import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comoNome } from '../src/exibicao.js';

test('converte nome em caixa alta para capitalizacao normal', () => {
  assert.equal(comoNome('RUFO PAGANINI'), 'Rufo Paganini');
});

test('preserva acentos ao capitalizar', () => {
  assert.equal(comoNome('UAITÃ PIRES'), 'Uaitã Pires');
});

test('mantem preposicoes em minusculas', () => {
  assert.equal(comoNome('SARAH RAMOS DE ÁVILA'), 'Sarah Ramos de Ávila');
});

test('nao rebaixa preposicao que abre o nome', () => {
  assert.equal(comoNome('DA SILVA SAURO'), 'Da Silva Sauro');
});

test('mantem sigla curta em caixa alta', () => {
  assert.equal(comoNome('SENAI/CE'), 'SENAI/CE');
});

test('preserva sigla de duas letras dentro do nome', () => {
  assert.equal(comoNome('SEBRAE RN IA LAB'), 'Sebrae RN IA Lab');
});

test('preserva uf no fim do nome', () => {
  assert.equal(comoNome('SEBRAE RO'), 'Sebrae RO');
});

test('preposicao de duas letras continua minuscula', () => {
  assert.equal(comoNome('SARAH RAMOS DE ÁVILA'), 'Sarah Ramos de Ávila');
});
