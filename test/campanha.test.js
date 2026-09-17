import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campanhaDe } from '../src/campanha.js';

const emb = (nome, uf, embaixada) => ({ nome, uf, municipio: 'X', embaixada, status: 'Ativo' });
const interno = (nome) => ({ nome, uf: 'Interno', municipio: 'ACS', embaixada: 'ACS', status: 'Ativo' });

test('embaixador recebe a campanha embaixadores', () => {
  assert.equal(campanhaDe(emb('Ana', 'GO', 'H')), 'embaixadores');
});

test('pessoa interna recebe a campanha interno', () => {
  assert.equal(campanhaDe(interno('Andre')), 'interno');
});

test('embaixador de fora do Brasil continua na campanha embaixadores', () => {
  assert.equal(campanhaDe(emb('Regina', 'CANADÁ', 'IA2A')), 'embaixadores');
});
