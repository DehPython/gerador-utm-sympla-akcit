import { test } from 'node:test';
import assert from 'node:assert/strict';
import { camposFaltando, OBRIGATORIOS_AVULSO } from '../src/validacao.js';

const cheio = { origem: 'palestra_unicamp', canal: 'evento_presencial', campanha: 'palestras_2026' };

test('nao falta nada quando os tres obrigatorios estao preenchidos', () => {
  assert.deepEqual(camposFaltando(cheio), []);
});

test('aponta o campo vazio', () => {
  assert.deepEqual(camposFaltando({ ...cheio, canal: '' }).map((c) => c.campo), ['canal']);
});

test('espaco em branco nao conta como preenchido', () => {
  assert.deepEqual(camposFaltando({ ...cheio, origem: '   ' }).map((c) => c.campo), ['origem']);
});

test('aponta todos os que faltam, na ordem do formulario', () => {
  assert.deepEqual(camposFaltando({}).map((c) => c.campo), ['origem', 'canal', 'campanha']);
});

test('campo opcional vazio nao e cobrado', () => {
  assert.deepEqual(camposFaltando({ ...cheio, detalhe: '', termo: '' }), []);
});

test('cada obrigatorio tem rotulo legivel para a mensagem', () => {
  assert.deepEqual(OBRIGATORIOS_AVULSO.map((c) => c.rotulo), ['Origem', 'Canal', 'Campanha']);
});
