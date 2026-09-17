import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMBAIXADORES, INTERNOS } from '../src/dados.js';
import { normalizar } from '../src/utm.js';
import { somenteAtivos, linkDaPessoa } from '../src/pessoas.js';

const TODOS = [...EMBAIXADORES, ...INTERNOS];
const BASE = 'https://www.sympla.com.br/evento/teste/123456';

test('a planilha tem os 22 embaixadores', () => {
  assert.equal(EMBAIXADORES.length, 22);
});

test('nenhum utm_source colide entre as 37 pessoas', () => {
  const slugs = TODOS.map((p) => normalizar(p.nome));
  assert.equal(new Set(slugs).size, TODOS.length);
});

test('nenhum link real sai percent-encoded', () => {
  for (const pessoa of somenteAtivos(TODOS)) {
    const link = linkDaPessoa(pessoa, BASE, 'embaixadores');
    assert.ok(!link.includes('%'), `${pessoa.nome} gerou ${link}`);
  }
});

test('todo interno cadastrado hoje e da area ACS', () => {
  assert.deepEqual([...new Set(INTERNOS.map((p) => p.area))], ['ACS']);
});

test('a area do interno chega ao link em utm_medium', () => {
  assert.match(linkDaPessoa(INTERNOS[0], BASE, 'interno'), /utm_medium=acs/);
});
