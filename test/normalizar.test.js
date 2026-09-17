import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar } from '../src/utm.js';

test('converte para minusculas', () => {
  assert.equal(normalizar('GOIANIA'), 'goiania');
});

test('remove acentos', () => {
  assert.equal(normalizar('UAITÃ'), 'uaita');
});

test('remove cedilha', () => {
  assert.equal(normalizar('caçapava'), 'cacapava');
});

test('troca espaco por underscore', () => {
  assert.equal(normalizar('hub cerrado'), 'hub_cerrado');
});

test('troca caractere especial por underscore', () => {
  assert.equal(normalizar('SENAI/CE'), 'senai_ce');
});

test('colapsa underscores repetidos', () => {
  assert.equal(normalizar('a  &  b'), 'a_b');
});

test('remove underscore das pontas', () => {
  assert.equal(normalizar('  ouro ventures  '), 'ouro_ventures');
});

test('preserva hifen e digitos', () => {
  assert.equal(normalizar('Base27-A'), 'base27-a');
});
