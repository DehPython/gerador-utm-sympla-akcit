import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCsv, extrairEmbaixadores } from '../src/planilha.js';

test('separa colunas por virgula', () => {
  assert.deepEqual(lerCsv('a,b,c'), [['a', 'b', 'c']]);
});

test('respeita virgula dentro de aspas', () => {
  assert.deepEqual(lerCsv('"Sao Paulo, SP",x'), [['Sao Paulo, SP', 'x']]);
});

test('respeita aspas escapadas', () => {
  assert.deepEqual(lerCsv('"diz ""oi""",y'), [['diz "oi"', 'y']]);
});

test('respeita quebra de linha dentro de aspas', () => {
  assert.deepEqual(lerCsv('"linha1\nlinha2",z'), [['linha1\nlinha2', 'z']]);
});

test('aceita fim de linha do windows', () => {
  assert.deepEqual(lerCsv('a,b\r\nc,d'), [['a', 'b'], ['c', 'd']]);
});

// --- extração ---

const PLANILHA = [
  ['DIRETÓRIO DA REDE DE EMBAIXADORES', '', '', '', '', '', '', '', ''],
  ['', 'TOTAL DE EMBAIXADORES', '', 'ESTADOS / REGIÕES', '', '', '', '', ''],
  ['', '22', '', '18', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['Nº', 'UF', 'MUNICÍPIO', 'EMBAIXADA', 'EMBAIXADOR(A)', 'LINKEDIN', 'E-MAIL', 'CELULAR', 'STATUS'],
  ['1', 'GO', 'GOIÂNIA', 'HUB CERRADO', 'UAITÃ PIRES', 'https://x', 'a@b.com', '62 9', 'Ativo'],
  ['2', 'SP', 'CAMPINAS', 'VENTURE HUB', 'JOSÉ URBINI', 'https://y', 'c@d.com', '11 9', 'Desligado'],
  ['', '', '', '', '', '', '', '', ''],
];

test('acha o cabecalho mesmo com linhas decorativas antes', () => {
  assert.equal(extrairEmbaixadores(PLANILHA).length, 2);
});

test('le os cinco campos que o link usa', () => {
  assert.deepEqual(extrairEmbaixadores(PLANILHA)[0], {
    nome: 'UAITÃ PIRES', uf: 'GO', municipio: 'GOIÂNIA', embaixada: 'HUB CERRADO', status: 'Ativo',
  });
});

test('nao copia email, celular nem linkedin para o app', () => {
  const texto = JSON.stringify(extrairEmbaixadores(PLANILHA));
  for (const vazado of ['a@b.com', '62 9', 'https://x']) {
    assert.ok(!texto.includes(vazado), `vazou ${vazado}`);
  }
});

test('mantem quem esta desligado: quem filtra e o app, nao a importacao', () => {
  assert.equal(extrairEmbaixadores(PLANILHA)[1].status, 'Desligado');
});

test('ignora linhas sem nome', () => {
  assert.equal(extrairEmbaixadores([...PLANILHA, ['9', 'RJ', 'RIO', 'HUB', '', '', '', '', 'Ativo']]).length, 2);
});

test('reclama quando nao encontra o cabecalho', () => {
  assert.throws(() => extrairEmbaixadores([['a', 'b'], ['c', 'd']]), /cabeçalho/i);
});
