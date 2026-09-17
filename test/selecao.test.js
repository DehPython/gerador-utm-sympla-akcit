import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarArvore } from '../src/arvore.js';
import { folhasDe, estadoDo } from '../src/selecao.js';

const emb = (nome, uf, embaixada) => ({ nome, uf, municipio: 'X', embaixada, status: 'Ativo' });
const chave = (p) => p.nome;

const ANA = emb('Ana', 'GO', 'Hub Cerrado');
const BRUNO = emb('Bruno', 'GO', 'Hub Goias');
const raiz = () => montarArvore([ANA, BRUNO])[0];

test('folhasDe devolve todas as pessoas sob o no', () => {
  assert.deepEqual(folhasDe(raiz()).map((p) => p.nome), ['Ana', 'Bruno']);
});

test('folhasDe de uma folha devolve a propria pessoa', () => {
  const folha = raiz().filhos[0].filhos[0].filhos[0].filhos[0];
  assert.deepEqual(folhasDe(folha).map((p) => p.nome), ['Ana']);
});

test('no com todos os filhos marcados esta todos', () => {
  assert.equal(estadoDo(raiz(), new Set(['Ana', 'Bruno']), chave), 'todos');
});

test('no sem nenhum filho marcado esta nenhum', () => {
  assert.equal(estadoDo(raiz(), new Set(), chave), 'nenhum');
});

test('no com parte dos filhos marcados esta parcial', () => {
  assert.equal(estadoDo(raiz(), new Set(['Ana']), chave), 'parcial');
});

test('hub com uma pessoa acompanha essa pessoa', () => {
  const hubDaAna = raiz().filhos[0].filhos[0].filhos[0];
  assert.equal(estadoDo(hubDaAna, new Set(['Ana']), chave), 'todos');
  assert.equal(estadoDo(hubDaAna, new Set(['Bruno']), chave), 'nenhum');
});
