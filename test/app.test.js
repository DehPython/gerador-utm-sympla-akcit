import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarDom } from './dom-falso.js';

const elementos = montarDom();
await import('../src/app.js');

const el = (id) => elementos.get(id);

test('a pagina carrega com a tela de selecao visivel e a de links escondida', () => {
  assert.equal(el('tela-selecao').hidden, false);
  assert.equal(el('tela-links').hidden, true);
});

test('o alerta comeca escondido', () => {
  assert.equal(el('alerta').hidden, true);
});

test('gerar sem url mostra o alerta e nao troca de tela', () => {
  el('base').value = '';
  el('gerar').disparar('click');
  assert.equal(el('alerta').hidden, false);
  assert.match(el('alerta-texto').textContent, /Cole o link/);
  assert.equal(el('tela-links').hidden, true);
});

test('o alerta e anunciado por leitor de tela', () => {
  assert.equal(el('alerta').atributos.role, 'alert');
});

test('gerar com link que nao e do Sympla mostra o alerta', () => {
  el('base').value = 'https://www.eventbrite.com.br/e/123';
  el('gerar').disparar('click');
  assert.equal(el('alerta').hidden, false);
  assert.match(el('alerta-texto').textContent, /Sympla/i);
  assert.equal(el('tela-links').hidden, true);
  assert.equal(el('base').classes.has('faltando'), true);
});

test('o botao fecha o alerta', () => {
  el('alerta-fechar').disparar('click');
  assert.equal(el('alerta').hidden, true);
});

test('gerar de novo com sucesso nao deixa alerta antigo na tela', () => {
  el('base').value = 'https://www.eventbrite.com.br/e/1';
  el('gerar').disparar('click');
  assert.equal(el('alerta').hidden, false);

  el('base').value = 'https://www.sympla.com.br/evento/teste/123456';
  el('gerar').disparar('click');
  assert.equal(el('alerta').hidden, true);
  el('voltar').disparar('click');
});

test('gerar com dominio que imita o Sympla nao troca de tela', () => {
  el('base').value = 'https://sympla.com.br.site-falso.com/evento/x';
  el('gerar').disparar('click');
  assert.equal(el('tela-links').hidden, true);
});

test('digitar no campo tira o destaque de erro', () => {
  el('base').disparar('input');
  assert.equal(el('base').classes.has('faltando'), false);
});

test('gerar com url leva para a tela de links', () => {
  el('base').value = 'https://www.sympla.com.br/evento/teste/123456';
  el('gerar').disparar('click');
  assert.equal(el('tela-selecao').hidden, true);
  assert.equal(el('tela-links').hidden, false);
});

test('a tela de links mostra os 37 links agrupados por macro', () => {
  const texto = el('resultado').texto();
  assert.match(texto, /EMBAIXADORES|Embaixadores/);
  assert.match(texto, /INTERNO|Interno/);
  assert.match(texto, /Rufo Paganini/);
  assert.match(el('resumo-topo').texto(), /37/);
});

test('cada grupo de links sai em ordem alfabetica', () => {
  const grupos = el('resultado').filhos.map((grupo) =>
    grupo.filhos
      .filter((f) => f.classes.has('linha-link'))
      .map((linha) => linha.filhos.find((f) => f.classes.has('quem')).textContent));

  assert.equal(grupos.length, 2, 'esperava um grupo para embaixadores e outro para internos');

  for (const nomes of grupos) {
    assert.ok(nomes.length > 1);
    const esperado = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    assert.deepEqual(nomes, esperado);
  }
});

test('o cabecalho do grupo nao tem mais botao de copiar em lote', () => {
  const topo = el('resultado').filhos[0].filhos.find((f) => f.classes.has('grupo-topo'));
  assert.equal(topo.filhos.filter((f) => f.tagName === 'button').length, 0);
});

const primeiraLinha = () =>
  el('resultado').filhos[0].filhos.find((f) => f.classes.has('linha-link'));

const botaoDe = (linha) => linha.filhos.find((f) => f.tagName === 'button');
const marcaDe = (linha) => linha.filhos.find((f) => f.classes.has('marca-copiado'));

test('a linha comeca sem marca de copiado', () => {
  const linha = primeiraLinha();
  assert.equal(linha.classes.has('copiado'), false);
  assert.equal(marcaDe(linha).textContent, '');
});

test('copiar deixa uma marca permanente na linha', async () => {
  const linha = primeiraLinha();
  botaoDe(linha).disparar('click');
  await new Promise(setImmediate);

  assert.equal(linha.classes.has('copiado'), true);
  assert.match(marcaDe(linha).textContent, /✓/);
});

test('a marca nao vaza para as outras linhas', () => {
  const outras = el('resultado').filhos[0].filhos
    .filter((f) => f.classes.has('linha-link'))
    .slice(1);
  assert.equal(outras.some((l) => l.classes.has('copiado')), false);
});

test('gerar de novo limpa as marcas da rodada anterior', async () => {
  el('voltar').disparar('click');
  el('base').value = 'https://www.sympla.com.br/evento/outro/999';
  el('gerar').disparar('click');
  assert.equal(primeiraLinha().classes.has('copiado'), false);
});

test('voltar devolve para a tela de selecao', () => {
  el('voltar').disparar('click');
  assert.equal(el('tela-selecao').hidden, false);
  assert.equal(el('tela-links').hidden, true);
});
