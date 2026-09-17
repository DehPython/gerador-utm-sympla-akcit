import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarArvore } from '../src/arvore.js';

const emb = (nome, uf, embaixada) => ({ nome, uf, municipio: 'X', embaixada, status: 'Ativo' });
const interno = (nome) => ({ nome, uf: 'Interno', municipio: 'ACS', embaixada: 'ACS', status: 'Ativo' });

const rotulos = (nos) => nos.map((n) => n.rotulo);

test('as raizes sao as duas macro categorias', () => {
  const a = montarArvore([emb('Ana', 'GO', 'Hub Cerrado'), interno('Andre')]);
  assert.deepEqual(rotulos(a), ['Embaixadores', 'Interno AKCIT']);
});

test('omite macro categoria sem ninguem', () => {
  const a = montarArvore([interno('Andre')]);
  assert.deepEqual(rotulos(a), ['Interno AKCIT']);
});

test('embaixadores se divide em Brasil e Internacional', () => {
  const a = montarArvore([emb('Ana', 'GO', 'H'), emb('Regina', 'CANADÁ', 'IA2A')]);
  assert.deepEqual(rotulos(a[0].filhos), ['Brasil', 'Internacional']);
});

test('brasil se abre em estados ordenados', () => {
  const a = montarArvore([emb('Ana', 'SP', 'H'), emb('Bruno', 'GO', 'H')]);
  assert.deepEqual(rotulos(a[0].filhos[0].filhos), ['GO', 'SP']);
});

test('estado se abre em hubs e hub se abre em pessoas', () => {
  const a = montarArvore([emb('Ana', 'GO', 'Hub Cerrado')]);
  const estado = a[0].filhos[0].filhos[0];
  assert.deepEqual(rotulos(estado.filhos), ['Hub Cerrado']);
  assert.deepEqual(rotulos(estado.filhos[0].filhos), ['Ana']);
});

test('interno vai direto do macro para as pessoas', () => {
  const a = montarArvore([interno('Andre'), interno('Ketlen')]);
  assert.deepEqual(rotulos(a[0].filhos), ['Andre', 'Ketlen']);
});

test('cada no conta quantas pessoas tem embaixo', () => {
  const a = montarArvore([emb('Ana', 'GO', 'H1'), emb('Bruno', 'GO', 'H2'), interno('Andre')]);
  assert.equal(a[0].total, 2);
  assert.equal(a[1].total, 1);
});

test('a folha carrega a pessoa para gerar o link', () => {
  const pessoa = emb('Ana', 'GO', 'Hub Cerrado');
  const a = montarArvore([pessoa]);
  assert.equal(a[0].filhos[0].filhos[0].filhos[0].filhos[0].pessoa, pessoa);
});

test('ids sao unicos na arvore inteira', () => {
  const a = montarArvore([emb('Ana', 'GO', 'H'), emb('Bruno', 'SP', 'H'), interno('Andre')]);
  const ids = [];
  const varrer = (nos) => nos.forEach((n) => { ids.push(n.id); varrer(n.filhos); });
  varrer(a);
  assert.equal(new Set(ids).size, ids.length);
});
