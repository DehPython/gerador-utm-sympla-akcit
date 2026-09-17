import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkDaPessoa } from '../src/pessoas.js';
import { campanhaDe } from '../src/campanha.js';

const BASE = 'https://www.sympla.com.br/evento/teste/123';
const query = (pessoa) => linkDaPessoa(pessoa, BASE, campanhaDe(pessoa)).replace(BASE, '');

const interno = (nome, area) => ({ nome, uf: 'Interno', area, status: 'Ativo' });
const embaixador = { nome: 'UAITÃ PIRES', uf: 'GO', municipio: 'GOIÂNIA', embaixada: 'HUB CERRADO', status: 'Ativo' };

test('a area do interno vai para utm_medium', () => {
  assert.equal(
    query(interno('André Dantas', 'ACS')),
    '?utm_source=andre_dantas&utm_medium=acs&utm_campaign=interno'
  );
});

test('outra area gera outro utm_medium', () => {
  assert.match(query(interno('Fulana', 'Jurídico')), /utm_medium=juridico/);
});

test('interno nao leva utm_content nem utm_term', () => {
  const q = query(interno('André Dantas', 'ACS'));
  assert.ok(!q.includes('utm_content'), q);
  assert.ok(!q.includes('utm_term'), q);
});

test('interno sem area cai para interno, e nao quebra', () => {
  assert.match(query(interno('Fulana')), /utm_medium=interno/);
});

test('o embaixador nao muda', () => {
  assert.equal(
    query(embaixador),
    '?utm_source=uaita_pires&utm_medium=go&utm_campaign=embaixadores&utm_content=hub_cerrado&utm_term=goiania'
  );
});
