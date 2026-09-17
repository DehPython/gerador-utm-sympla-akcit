// Baixa a planilha de embaixadores e regenera src/dados.js.
//
// A planilha é a fonte de verdade dos embaixadores. O time interno não está
// nela: fica em INTERNOS, que este script preserva sem tocar.
//
//   node scripts/sincronizar.js            grava se houver mudança
//   node scripts/sincronizar.js --conferir não grava, só diz se está desatualizado
import { readFile, writeFile, rename } from 'node:fs/promises';
import { lerCsv, extrairEmbaixadores } from '../src/planilha.js';

const PLANILHA = process.env.PLANILHA_ID ?? '1OyoE2ybG9Mcjuw8n4QjfGufPgu1kUjnGYU7Vf1gKopU';
const ABA = process.env.PLANILHA_GID ?? '0';
// No Docker o arquivo fica num volume compartilhado entre quem sincroniza e
// quem serve o site, então o caminho precisa ser configurável.
const DESTINO = process.env.DADOS_PATH
  ? new URL(`file://${process.env.DADOS_PATH}`)
  : new URL('../src/dados.js', import.meta.url);

// Se a planilha vier menor que isso, algo deu errado do outro lado e é melhor
// manter o que já está no disco do que publicar uma lista truncada.
const MINIMO = Number(process.env.MINIMO_EMBAIXADORES ?? 10);
const SEGUNDOS = 20;

const conferindo = process.argv.includes('--conferir');

async function baixar() {
  const url = `https://docs.google.com/spreadsheets/d/${PLANILHA}/export?format=csv&gid=${ABA}`;
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(SEGUNDOS * 1000),
    redirect: 'follow',
  });

  if (!resposta.ok) {
    throw new Error(`A planilha respondeu HTTP ${resposta.status}. Confira se ela segue compartilhada por link.`);
  }

  const tipo = resposta.headers.get('content-type') ?? '';
  if (!tipo.includes('csv')) {
    throw new Error(`Esperava CSV e veio "${tipo}". Normalmente é a tela de login do Google: o acesso por link foi revogado.`);
  }

  return resposta.text();
}

function conferir(embaixadores) {
  if (embaixadores.length < MINIMO) {
    throw new Error(`A planilha trouxe só ${embaixadores.length} embaixadores, menos que o mínimo de ${MINIMO}. Nada foi gravado.`);
  }

  const semUf = embaixadores.filter((p) => !p.uf);
  if (semUf.length) {
    throw new Error(`Sem UF: ${semUf.map((p) => p.nome).join(', ')}. Corrija na planilha e rode de novo.`);
  }

  const repetidos = embaixadores
    .map((p) => p.nome.trim().toLowerCase())
    .filter((nome, i, todos) => todos.indexOf(nome) !== i);
  if (repetidos.length) {
    throw new Error(`Nome repetido na planilha: ${[...new Set(repetidos)].join(', ')}. Dois links iguais viram uma pessoa só no relatório.`);
  }
}

const comoLista = (pessoas) => pessoas.map((p) => '  ' + JSON.stringify(p)).join(',\n');

async function principal() {
  const antigo = await readFile(DESTINO, 'utf8');

  const embaixadores = extrairEmbaixadores(lerCsv(await baixar()));
  conferir(embaixadores);

  // INTERNOS não vem da planilha: reaproveita o bloco que já está no arquivo.
  const blocoInternos = antigo.match(/export const INTERNOS = \[[\s\S]*?\n\];/);
  if (!blocoInternos) throw new Error('Não achei o bloco INTERNOS em src/dados.js. Nada foi gravado.');

  const novo = `// Embaixadores sincronizados da planilha por scripts/sincronizar.js.
// Não edite à mão: a planilha é a fonte de verdade e a próxima sincronização
// sobrescreve este bloco. O time interno é mantido aqui embaixo.
// A área do interno vira utm_medium do link, então uma pessoa de outra área é
// só trocar 'ACS' pelo nome dela.

export const EMBAIXADORES = [
${comoLista(embaixadores)},
];

${blocoInternos[0]}
`;

  const ativos = embaixadores.filter((p) => p.status.trim().toLowerCase() === 'ativo').length;
  const resumo = `${embaixadores.length} embaixadores na planilha, ${ativos} ativos`;

  if (novo === antigo) {
    console.log(`Sem mudança. ${resumo}.`);
    return;
  }

  if (conferindo) {
    console.log(`Desatualizado: a planilha mudou. ${resumo}.`);
    process.exitCode = 1;
    return;
  }

  // Grava em arquivo temporário e renomeia: rename é atômico no mesmo disco, então
  // o servidor nunca entrega um dados.js pela metade enquanto o job roda.
  const temporario = new URL(`${DESTINO.href}.tmp`);
  await writeFile(temporario, novo);
  await rename(temporario, DESTINO);
  console.log(`dados.js atualizado. ${resumo}.`);
}

principal().catch((erro) => {
  console.error(`Sincronização falhou: ${erro.message}`);
  console.error('src/dados.js ficou como estava.');
  process.exitCode = 1;
});
