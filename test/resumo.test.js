import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumoDoLink } from '../src/resumo.js';

const URL_BASE = 'https://www.sympla.com.br/evento/summit-akcit-2026/2938471';

test('mostra o dominio e o utm_source, que e o que muda por pessoa', () => {
  assert.equal(
    resumoDoLink(`${URL_BASE}?utm_source=rufo_paganini&utm_medium=am&utm_campaign=embaixadores`),
    'sympla.com.br/…?utm_source=rufo_paganini'
  );
});

test('tira o www do dominio', () => {
  assert.match(resumoDoLink(`${URL_BASE}?utm_source=ana`), /^sympla\.com\.br/);
});

test('cai para o dominio quando nao ha utm_source', () => {
  assert.equal(resumoDoLink('https://www.sympla.com.br/evento/x/1'), 'sympla.com.br/…');
});

test('devolve a url crua quando nao da para interpretar', () => {
  assert.equal(resumoDoLink('nao-e-url'), 'nao-e-url');
});
