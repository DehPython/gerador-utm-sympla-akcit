import { REGIAO_DA_UF } from './regioes.js';
import { normalizar } from './utm.js';
import { comoNome } from './exibicao.js';

const ehInterno = (pessoa) => pessoa.uf === 'Interno';
const ehBrasil = (pessoa) => Boolean(REGIAO_DA_UF[pessoa.uf]);

function no(id, rotulo, filhos) {
  return {
    id,
    rotulo,
    filhos,
    total: filhos.reduce((soma, filho) => soma + filho.total, 0),
  };
}

function folha(id, pessoa) {
  return { id, rotulo: comoNome(pessoa.nome), filhos: [], total: 1, pessoa };
}

// Agrupa por um campo e devolve os pares já ordenados pelo rótulo.
function porCampo(pessoas, campo) {
  const mapa = new Map();
  for (const pessoa of pessoas) {
    const chave = pessoa[campo];
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(pessoa);
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
}

const pessoasDe = (pai, pessoas) =>
  pessoas
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((pessoa) => folha(`${pai}/p:${normalizar(pessoa.nome)}`, pessoa));

// Estado ou país -> hub -> pessoa
function ramoTerritorial(pai, pessoas) {
  return porCampo(pessoas, 'uf').map(([uf, doLugar]) => {
    const idLugar = `${pai}/${normalizar(uf)}`;
    return no(
      idLugar,
      uf,
      porCampo(doLugar, 'embaixada').map(([embaixada, doHub]) => {
        const idHub = `${idLugar}/${normalizar(embaixada)}`;
        return no(idHub, comoNome(embaixada), pessoasDe(idHub, doHub));
      }),
    );
  });
}

export function montarArvore(pessoas) {
  const raizes = [];

  const embaixadores = pessoas.filter((p) => !ehInterno(p));
  if (embaixadores.length) {
    const ramos = [];

    const brasil = embaixadores.filter(ehBrasil);
    if (brasil.length) ramos.push(no('emb/brasil', 'Brasil', ramoTerritorial('emb/brasil', brasil)));

    const fora = embaixadores.filter((p) => !ehBrasil(p));
    if (fora.length) {
      ramos.push(no('emb/internacional', 'Internacional', ramoTerritorial('emb/internacional', fora)));
    }

    raizes.push(no('emb', 'Embaixadores', ramos));
  }

  const internos = pessoas.filter(ehInterno);
  if (internos.length) raizes.push(no('interno', 'Interno AKCIT', pessoasDe('interno', internos)));

  return raizes;
}
