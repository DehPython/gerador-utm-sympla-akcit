import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarUrl } from '../src/utm.js';

test('monta url com os tres obrigatorios na ordem do sympla', () => {
  assert.equal(
    montarUrl({
      base: 'https://www.sympla.com.br/evento/teste/123456',
      source: 'UAITÃ PIRES',
      medium: 'GO',
      campaign: 'embaixadores',
    }),
    'https://www.sympla.com.br/evento/teste/123456?utm_source=uaita_pires&utm_medium=go&utm_campaign=embaixadores'
  );
});

test('inclui content e term quando preenchidos', () => {
  const url = montarUrl({
    base: 'https://sympla.com.br/e/1',
    source: 'ana', medium: 'go', campaign: 'emb',
    content: 'HUB CERRADO', term: 'SÃO JOSÉ DO RIO PRETO',
  });
  assert.equal(url, 'https://sympla.com.br/e/1?utm_source=ana&utm_medium=go&utm_campaign=emb&utm_content=hub_cerrado&utm_term=sao_jose_do_rio_preto');
});

test('omite opcionais vazios', () => {
  const url = montarUrl({
    base: 'https://sympla.com.br/e/1',
    source: 'ana', medium: 'go', campaign: 'emb', content: '', term: '   ',
  });
  assert.equal(url, 'https://sympla.com.br/e/1?utm_source=ana&utm_medium=go&utm_campaign=emb');
});

test('usa & quando a url base ja tem query string', () => {
  const url = montarUrl({
    base: 'https://sympla.com.br/e/1?d=1',
    source: 'ana', medium: 'go', campaign: 'emb',
  });
  assert.equal(url, 'https://sympla.com.br/e/1?d=1&utm_source=ana&utm_medium=go&utm_campaign=emb');
});

test('descarta fragmento da url base', () => {
  const url = montarUrl({
    base: 'https://sympla.com.br/e/1#ingressos',
    source: 'ana', medium: 'go', campaign: 'emb',
  });
  assert.equal(url, 'https://sympla.com.br/e/1?utm_source=ana&utm_medium=go&utm_campaign=emb');
});

test('rejeita url base vazia', () => {
  assert.throws(
    () => montarUrl({ base: '', source: 'ana', medium: 'go', campaign: 'emb' }),
    /URL base/
  );
});

test('rejeita obrigatorio vazio', () => {
  assert.throws(
    () => montarUrl({ base: 'https://sympla.com.br/e/1', source: '', medium: 'go', campaign: 'emb' }),
    /utm_source/
  );
});
