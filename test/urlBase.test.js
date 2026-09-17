import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarUrlBase } from '../src/validacao.js';

const aceita = (valor) => validarUrlBase(valor).ok;
const erro = (valor) => validarUrlBase(valor).erro;

test('aceita o endereço com www, que é o que a Sympla entrega', () => {
  assert.equal(aceita('https://www.sympla.com.br/evento/summit-akcit-2026/2938471'), true);
});

test('aceita sem www', () => {
  assert.equal(aceita('https://sympla.com.br/evento/x/1'), true);
});

test('aceita subdominio da Sympla', () => {
  assert.equal(aceita('https://bileto.sympla.com.br/event/123'), true);
});

test('aceita endereço que ja tem query string', () => {
  assert.equal(aceita('https://www.sympla.com.br/evento/x/1?d=1'), true);
});

test('completa o https quando a pessoa cola sem o protocolo', () => {
  const r = validarUrlBase('www.sympla.com.br/evento/x/1');
  assert.equal(r.ok, true);
  assert.equal(r.url, 'https://www.sympla.com.br/evento/x/1');
});

test('recusa outro site', () => {
  assert.equal(aceita('https://www.eventbrite.com.br/e/123'), false);
  assert.match(erro('https://www.eventbrite.com.br/e/123'), /sympla/i);
});

test('recusa dominio que so imita a Sympla', () => {
  assert.equal(aceita('https://sympla.com.br.site-falso.com/evento/x'), false);
});

test('recusa quando sympla aparece so no caminho', () => {
  assert.equal(aceita('https://site-falso.com/sympla.com.br/evento/x'), false);
});

test('recusa javascript: como endereço', () => {
  assert.equal(aceita('javascript:alert(1)'), false);
});

test('recusa campo vazio', () => {
  assert.equal(aceita(''), false);
  assert.match(erro(''), /cole o link/i);
});

test('recusa texto que nao e endereço', () => {
  assert.equal(aceita('o link do evento'), false);
});

test('ignora espaço sobrando nas pontas', () => {
  assert.equal(aceita('  https://www.sympla.com.br/evento/x/1  '), true);
});

test('recusa o endereço do gerador em vez do evento', () => {
  const r = validarUrlBase('https://produtores.sympla.com.br/funcionalidades/gerador-de-utm/');
  assert.equal(r.ok, false);
  assert.match(r.erro, /evento/i);
});

// --- link que já veio rastreado ---

const EVENTO = 'https://www.sympla.com.br/evento/summit-akcit-2026/2938471';

test('recusa link que ja tem utm_source', () => {
  const r = validarUrlBase(`${EVENTO}?utm_source=rufo_paganini`);
  assert.equal(r.ok, false);
  assert.match(r.erro, /já (tem|vem com)/i);
});

test('recusa qualquer um dos cinco parametros', () => {
  for (const campo of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    assert.equal(aceita(`${EVENTO}?${campo}=x`), false, campo);
  }
});

test('recusa o link inteiro gerado por esta ferramenta', () => {
  const gerado = `${EVENTO}?utm_source=uaita_pires&utm_medium=go&utm_campaign=embaixadores`;
  assert.equal(aceita(gerado), false);
});

test('recusa utm escrito em maiusculas', () => {
  assert.equal(aceita(`${EVENTO}?UTM_SOURCE=x`), false);
});

test('a mensagem diz o que fazer', () => {
  assert.match(validarUrlBase(`${EVENTO}?utm_source=x`).erro, /sem os parâmetros|link limpo/i);
});

test('outro parametro que nao e utm continua passando', () => {
  assert.equal(aceita(`${EVENTO}?d=1`), true);
  assert.equal(aceita(`${EVENTO}?ref=instagram`), true);
});

test('parametro que so comeca parecido nao e confundido com utm', () => {
  assert.equal(aceita(`${EVENTO}?utmost=1`), true);
});
