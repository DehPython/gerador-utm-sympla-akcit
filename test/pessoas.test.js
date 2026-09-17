import { test } from 'node:test';
import assert from 'node:assert/strict';
import { somenteAtivos, linkDaPessoa } from '../src/pessoas.js';

const ativo = { nome: 'UAITÃ PIRES', uf: 'GO', municipio: 'GOIÂNIA', embaixada: 'HUB CERRADO', status: 'Ativo' };
const desligado = { ...ativo, nome: 'FULANO', status: 'Desligado' };
const pendente = { ...ativo, nome: 'CICRANO', status: 'Pendente' };

test('mantem quem esta Ativo', () => {
  assert.deepEqual(somenteAtivos([ativo]), [ativo]);
});

test('remove quem esta Desligado', () => {
  assert.deepEqual(somenteAtivos([ativo, desligado]), [ativo]);
});

test('remove quem esta Pendente', () => {
  assert.deepEqual(somenteAtivos([ativo, pendente]), [ativo]);
});

test('ignora caixa e espaco no status', () => {
  assert.deepEqual(somenteAtivos([{ ...ativo, status: '  ATIVO ' }]).length, 1);
});

test('remove quem esta sem status', () => {
  assert.deepEqual(somenteAtivos([{ ...ativo, status: '' }]), []);
});

test('monta o link da pessoa com o mapeamento dos quatro atributos', () => {
  assert.equal(
    linkDaPessoa(ativo, 'https://www.sympla.com.br/evento/teste/123456', 'embaixadores'),
    'https://www.sympla.com.br/evento/teste/123456?utm_source=uaita_pires&utm_medium=go&utm_campaign=embaixadores&utm_content=hub_cerrado&utm_term=goiania'
  );
});

// --- ordem alfabética da lista de links ---

test('ordena as pessoas pelo nome', async () => {
  const { emOrdemAlfabetica } = await import('../src/pessoas.js');
  const nomes = emOrdemAlfabetica([{ nome: 'Rufo' }, { nome: 'Ana' }, { nome: 'Mateus' }]);
  assert.deepEqual(nomes.map((p) => p.nome), ['Ana', 'Mateus', 'Rufo']);
});

test('acento nao joga o nome para o fim da lista', async () => {
  const { emOrdemAlfabetica } = await import('../src/pessoas.js');
  const nomes = emOrdemAlfabetica([{ nome: 'Ávila' }, { nome: 'Alves' }, { nome: 'Bruno' }]);
  assert.deepEqual(nomes.map((p) => p.nome), ['Alves', 'Ávila', 'Bruno']);
});

test('ignora caixa ao ordenar', async () => {
  const { emOrdemAlfabetica } = await import('../src/pessoas.js');
  const nomes = emOrdemAlfabetica([{ nome: 'bruno' }, { nome: 'Ana' }]);
  assert.deepEqual(nomes.map((p) => p.nome), ['Ana', 'bruno']);
});

test('nao altera a lista recebida', async () => {
  const { emOrdemAlfabetica } = await import('../src/pessoas.js');
  const original = [{ nome: 'Rufo' }, { nome: 'Ana' }];
  emOrdemAlfabetica(original);
  assert.deepEqual(original.map((p) => p.nome), ['Rufo', 'Ana']);
});
