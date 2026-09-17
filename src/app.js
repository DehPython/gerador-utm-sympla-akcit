import { EMBAIXADORES, INTERNOS } from './dados.js';
import { somenteAtivos, linkDaPessoa, emOrdemAlfabetica } from './pessoas.js';
import { montarUrl, normalizar } from './utm.js';
import { montarArvore } from './arvore.js';
import { folhasDe, estadoDo } from './selecao.js';
import { campanhaDe } from './campanha.js';
import { camposFaltando, OBRIGATORIOS_AVULSO, validarUrlBase } from './validacao.js';
import { resumoDoLink } from './resumo.js';
import { comoNome } from './exibicao.js';
import { copiarTexto } from './copiar.js';

const PESSOAS = somenteAtivos([...EMBAIXADORES, ...INTERNOS]);

// Chave estável por pessoa: sobrevive a filtro e a redesenho da árvore.
const chaveDe = (pessoa) => `${normalizar(pessoa.uf)}/${normalizar(pessoa.nome)}`;

const marcadas = new Set(PESSOAS.map(chaveDe));
const links = new Map();
const abertos = new Set();

const el = (id) => document.getElementById(id);
const telaSelecao = () => el('tela-selecao');
const telaLinks = () => el('tela-links');
const campoBase = el('base');
const campoBusca = el('busca');
const alerta = el('alerta');
const alertaTexto = el('alerta-texto');
const lista = el('lista');

// ---- alerta ----

let sumirAlerta = null;

// O erro aparece sobre a página, e não abaixo do campo: com a lista aberta a
// mensagem inline ficava fora da tela e ninguém via por que nada acontecia.
function alertar(mensagem) {
  alertaTexto.textContent = mensagem;
  alerta.hidden = false;

  clearTimeout(sumirAlerta);
  sumirAlerta = setTimeout(fecharAlerta, 8000);
}

function fecharAlerta() {
  clearTimeout(sumirAlerta);
  alerta.hidden = true;
}

// ---- desenho ----

function filtradas() {
  const busca = normalizar(campoBusca.value);
  if (!busca) return PESSOAS;
  return PESSOAS.filter((p) => normalizar(textoDaPessoa(p)).includes(busca));
}

// Interno tem área; embaixador tem município e hub. A busca varre o que existir.
const textoDaPessoa = (p) =>
  [p.nome, p.uf, p.municipio, p.embaixada, p.area].filter(Boolean).join(' ');

function desenhar() {
  // Redesenhar a árvore inteira perderia a rolagem: expandir um nó lá embaixo
  // jogaria a página de volta ao topo.
  const rolagem = window.scrollY;
  const pessoas = filtradas();
  lista.replaceChildren();

  if (!pessoas.length) {
    const p = document.createElement('p');
    p.className = 'vazio';
    p.textContent = 'Ninguém corresponde a esse filtro.';
    lista.append(p);
    atualizarContagem();
    window.scrollTo(0, rolagem);
    return;
  }

  // Buscar abre a árvore sozinho: resultado escondido é resultado perdido.
  const buscando = Boolean(campoBusca.value.trim());
  for (const raiz of montarArvore(pessoas)) lista.append(desenharNo(raiz, 0, buscando));
  atualizarContagem();
  window.scrollTo(0, rolagem);
}

function desenharNo(no, nivel, forcarAberto) {
  const ehFolha = Boolean(no.pessoa);
  const aberto = forcarAberto || abertos.has(no.id);

  const caixa = document.createElement('div');
  caixa.className = ehFolha ? 'no folha' : 'no';
  caixa.dataset.nivel = String(nivel);
  if (aberto && !ehFolha) caixa.classList.add('aberto');

  const linha = document.createElement('div');
  linha.className = 'no-linha';

  const alvo = document.createElement('label');
  alvo.className = 'no-alvo';

  let seta = null;
  if (!ehFolha) {
    seta = document.createElement('button');
    seta.type = 'button';
    seta.className = 'seta';
    seta.textContent = '\u25B6';
    seta.setAttribute('aria-expanded', String(aberto));
    seta.setAttribute('aria-label', aberto ? `Recolher ${no.rotulo}` : `Expandir ${no.rotulo}`);
    seta.addEventListener('click', () => {
      if (abertos.has(no.id)) abertos.delete(no.id);
      else abertos.add(no.id);
      desenhar();
    });
  }

  const estado = estadoDo(no, marcadas, chaveDe);
  const marca = document.createElement('input');
  marca.type = 'checkbox';
  marca.checked = estado === 'todos';
  marca.indeterminate = estado === 'parcial';
  marca.addEventListener('change', () => {
    for (const pessoa of folhasDe(no)) {
      if (marca.checked) marcadas.add(chaveDe(pessoa));
      else marcadas.delete(chaveDe(pessoa));
    }
    desenhar();
  });

  const rotulo = document.createElement('span');
  rotulo.className = 'no-rotulo';
  rotulo.textContent = no.rotulo;
  rotulo.title = no.rotulo;

  alvo.append(marca, rotulo);
  if (seta) linha.append(seta);
  linha.append(alvo);

  if (!ehFolha) {
    const conta = document.createElement('span');
    conta.className = 'no-conta';
    const quantas = folhasDe(no).filter((p) => marcadas.has(chaveDe(p))).length;
    conta.textContent = `${quantas}/${no.total}`;
    linha.append(conta);
  }

  caixa.append(linha);
  if (ehFolha) caixa.classList.toggle('marcado', marca.checked);

  if (!ehFolha) {
    const filhos = document.createElement('div');
    filhos.className = 'no-filhos';
    for (const filho of no.filhos) filhos.append(desenharNo(filho, nivel + 1, forcarAberto));
    caixa.append(filhos);
  }

  return caixa;
}

function caixaDeLink(url) {
  const caixa = document.createElement('div');
  caixa.className = 'link';

  const codigo = document.createElement('code');
  codigo.textContent = url;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = 'COPIAR';
  botao.addEventListener('click', () => copiar(url, botao, 'COPIADO'));

  caixa.append(codigo, botao);
  return caixa;
}

// ---- tela de resultados ----

function mostrarLinks() {
  const resultado = el('resultado');
  resultado.replaceChildren();

  for (const raiz of montarArvore(PESSOAS)) {
    const doGrupo = emOrdemAlfabetica(folhasDe(raiz))
      .map((pessoa) => ({ pessoa, url: links.get(chaveDe(pessoa)) }))
      .filter(({ url }) => url);

    if (doGrupo.length) resultado.append(grupoDeLinks(raiz.rotulo, doGrupo));
  }

  const total = links.size;
  const alvo = el('resumo-topo');
  alvo.replaceChildren();
  const numero = document.createElement('b');
  numero.textContent = String(total);
  alvo.append(numero, total === 1 ? 'link pronto' : 'links prontos');

  telaSelecao().hidden = true;
  telaLinks().hidden = false;
  window.scrollTo(0, 0);
}

function grupoDeLinks(titulo, itens) {
  const caixa = document.createElement('section');
  caixa.className = 'grupo-links';

  const topo = document.createElement('div');
  topo.className = 'grupo-topo';

  const nome = document.createElement('span');
  nome.textContent = titulo;

  const quantos = document.createElement('span');
  quantos.className = 'quantos';
  quantos.textContent = itens.length === 1 ? '1 link' : `${itens.length} links`;

  topo.append(nome, quantos);
  caixa.append(topo);

  for (const { pessoa, url } of itens) caixa.append(linhaDeLink(pessoa, url));
  return caixa;
}

function linhaDeLink(pessoa, url) {
  const linha = document.createElement('div');
  linha.className = 'linha-link';

  const quem = document.createElement('span');
  quem.className = 'quem';
  quem.textContent = comoNome(pessoa.nome);

  const onde = document.createElement('span');
  onde.className = 'onde';
  onde.textContent = resumoDoLink(url);
  onde.title = url;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = 'COPIAR';

  // A marca fica no DOM desde o início para reservar a coluna: sem isso o botão
  // saltaria de lugar na primeira vez que alguém copia.
  const marca = document.createElement('span');
  marca.className = 'marca-copiado';
  marca.textContent = '';
  marca.setAttribute('aria-hidden', 'true');

  botao.addEventListener('click', async () => {
    const deuCerto = await copiar(url, botao, 'COPIADO');
    if (!deuCerto) return;
    linha.classList.add('copiado');
    marca.textContent = '\u2713';
    marca.removeAttribute('aria-hidden');
    marca.setAttribute('role', 'img');
    marca.setAttribute('aria-label', 'Já copiado');
    botao.title = 'Copiar de novo';
  });

  linha.append(quem, onde, botao, marca);
  return linha;
}

function atualizarContagem() {
  const contagem = el('contagem');
  contagem.replaceChildren();

  const numero = document.createElement('b');
  numero.textContent = String(marcadas.size);
  contagem.append(numero, `de ${PESSOAS.length} selecionados`);

  el('alternar').textContent = marcadas.size === PESSOAS.length ? 'DESMARCAR TODOS' : 'MARCAR TODOS';
}

// ---- ações ----

async function copiar(texto, botao, rotuloOk) {
  const original = botao.textContent;
  const deuCerto = await copiarTexto(texto);

  botao.textContent = deuCerto ? rotuloOk : 'NÃO DEU: COPIE À MÃO';
  if (deuCerto) botao.classList.add('feito');

  setTimeout(() => {
    botao.textContent = original;
    botao.classList.remove('feito');
  }, 1600);
  return deuCerto;
}

function gerar() {
  fecharAlerta();
  links.clear();

  const endereco = validarUrlBase(campoBase.value);
  if (!endereco.ok) {
    alertar(endereco.erro);
    campoBase.classList.add('faltando');
    campoBase.focus();
    desenhar();
    return;
  }
  const base = endereco.url;

  if (!marcadas.size) {
    alertar('Marque pelo menos uma pessoa para gerar os links.');
    desenhar();
    return;
  }

  try {
    for (const pessoa of PESSOAS) {
      const chave = chaveDe(pessoa);
      if (marcadas.has(chave)) links.set(chave, linkDaPessoa(pessoa, base, campanhaDe(pessoa)));
    }
  } catch (erro) {
    links.clear();
    alertar(erro.message);
  }

  if (links.size) mostrarLinks();
  else desenhar();
}

function comoPlanilha() {
  const linhas = [['Nome', 'UF', 'Embaixada', 'Link'].join('\t')];
  for (const pessoa of PESSOAS) {
    const url = links.get(chaveDe(pessoa));
    if (url) linhas.push([pessoa.nome, pessoa.uf, pessoa.embaixada ?? pessoa.area ?? '', url].join('\t'));
  }
  return linhas.join('\n');
}

function gerarAvulso() {
  const saida = el('a-saida');
  saida.replaceChildren();
  fecharAlerta();
  for (const { id } of OBRIGATORIOS_AVULSO) el(id).classList.remove('faltando');

  const endereco = validarUrlBase(campoBase.value);
  if (!endereco.ok) {
    alertar(endereco.erro);
    campoBase.classList.add('faltando');
    campoBase.focus();
    return;
  }

  const valores = {
    origem: el('a-origem').value,
    canal: el('a-canal').value,
    campanha: el('a-campanha').value,
    detalhe: el('a-detalhe').value,
    termo: el('a-termo').value,
  };

  const faltam = camposFaltando(valores);
  if (faltam.length) {
    for (const { id } of faltam) el(id).classList.add('faltando');
    const nomes = faltam.map((c) => c.rotulo);
    alertar(nomes.length === 1
      ? `Preencha ${nomes[0]} para gerar o link.`
      : `Preencha ${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)} para gerar o link.`);
    el(faltam[0].id).focus();
    return;
  }

  try {
    const url = montarUrl({
      base: endereco.url,
      source: valores.origem,
      medium: valores.canal,
      campaign: valores.campanha,
      content: valores.detalhe,
      term: valores.termo,
    });
    saida.append(caixaDeLink(url));
    fecharAlerta();
  } catch (erro) {
    alertar(erro.message);
  }
}

// ---- ligações ----

for (const { id } of OBRIGATORIOS_AVULSO) {
  el(id).addEventListener('input', (ev) => ev.currentTarget.classList.remove('faltando'));
}

el('alerta-fechar').addEventListener('click', fecharAlerta);
el('gerar').addEventListener('click', gerar);
el('a-gerar').addEventListener('click', gerarAvulso);
el('copiar-planilha').addEventListener('click', (ev) => copiar(comoPlanilha(), ev.currentTarget, 'COPIADO'));

el('voltar').addEventListener('click', () => {
  telaLinks().hidden = true;
  telaSelecao().hidden = false;
  window.scrollTo(0, 0);
});
campoBusca.addEventListener('input', desenhar);

el('alternar').addEventListener('click', () => {
  if (marcadas.size === PESSOAS.length) marcadas.clear();
  else for (const pessoa of PESSOAS) marcadas.add(chaveDe(pessoa));
  desenhar();
});

campoBase.addEventListener('input', () => campoBase.classList.remove('faltando'));

campoBase.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') gerar();
});

desenhar();
