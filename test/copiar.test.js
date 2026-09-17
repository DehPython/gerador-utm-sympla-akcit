import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarDom } from './dom-falso.js';

montarDom();
const { copiarTexto } = await import('../src/copiar.js');

function comClipboard(resultado) {
  globalThis.navigator.clipboard = {
    writeText: async (t) => {
      globalThis.__escrito = t;
      if (resultado === 'falha') throw new Error('bloqueado');
    },
  };
}

function semClipboard() {
  delete globalThis.navigator.clipboard;
}

test('usa a Clipboard API quando ela existe', async () => {
  comClipboard('ok');
  globalThis.__escrito = null;
  assert.equal(await copiarTexto('https://exemplo/1'), true);
  assert.equal(globalThis.__escrito, 'https://exemplo/1');
});

test('sem Clipboard API cai no execCommand, que e o caso de http na rede local', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = true;
  assert.equal(await copiarTexto('https://exemplo/2'), true);
  assert.equal(globalThis.document.__ultimoComando, 'copy');
});

test('o campo temporario e removido depois de copiar', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = true;
  await copiarTexto('https://exemplo/3');
  assert.equal(globalThis.document.body.filhos.length, 0);
});

test('o texto copiado chega ao campo temporario', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = true;
  await copiarTexto('https://exemplo/4');
  assert.equal(globalThis.document.__valorSelecionado, 'https://exemplo/4');
});

test('quando a Clipboard API existe mas falha, tenta o execCommand', async () => {
  comClipboard('falha');
  globalThis.document.__execCommandResultado = true;
  assert.equal(await copiarTexto('https://exemplo/5'), true);
  assert.equal(globalThis.document.__ultimoComando, 'copy');
});

test('avisa quando nenhum dos dois funciona', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = false;
  assert.equal(await copiarTexto('https://exemplo/6'), false);
});

test('o campo fica fora da tela sem opacity zero: o Chrome recusa selecionar invisivel', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = true;
  let capturado = null;
  const original = globalThis.document.body.append.bind(globalThis.document.body);
  globalThis.document.body.append = (el) => { capturado = el; original(el); };
  await copiarTexto('https://exemplo/7');
  globalThis.document.body.append = original;

  assert.equal(capturado.style.opacity, undefined, 'opacity: 0 quebra a seleção no Chrome');
  assert.equal(capturado.style.left, '-9999px');
});

test('seleciona o texto inteiro, que o iOS exige explicitamente', async () => {
  semClipboard();
  globalThis.document.__execCommandResultado = true;
  await copiarTexto('https://exemplo/8');
  assert.deepEqual(globalThis.document.__intervalo, [0, 'https://exemplo/8'.length]);
});
