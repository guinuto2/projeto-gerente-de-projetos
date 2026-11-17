import test from 'node:test';
import assert from 'node:assert/strict';
import { instanteReuniao, reuniaoPassou } from '../../src/lib/reunioes';
import { avisoDentroDoPrazo } from '../../src/lib/notificacoes';

const agora = new Date('2026-11-16T12:00:00Z'); // 09h em Brasília

test('reunião: permite entrar antes do horário marcado em Brasília', () => {
  assert.equal(instanteReuniao('2026-11-16T10:00'), new Date('2026-11-16T13:00:00Z').getTime());
  assert.equal(reuniaoPassou('2026-11-16T10:00', agora), false);
  assert.equal(reuniaoPassou('2026-11-17T08:00', agora), false);
});

test('reunião: bloqueia entrada no início marcado e após o horário, inclusive no mesmo dia', () => {
  assert.equal(reuniaoPassou('2026-11-16T09:00', agora), true);
  assert.equal(reuniaoPassou('2026-11-16T08:59', agora), true);
  assert.equal(reuniaoPassou('2026-11-15T18:00', agora), true);
});

test('reunião: sem horário legível não bloqueia links legados por engano', () => {
  assert.equal(reuniaoPassou(undefined, agora), false);
  assert.equal(reuniaoPassou('inválido', agora), false);
});

const menosDias = (dias: number) => new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
test('sino: avisos lidos deixam de aparecer após 7 dias', () => {
  assert.equal(avisoDentroDoPrazo({ quando: menosDias(6), lida: true }, agora), true);
  assert.equal(avisoDentroDoPrazo({ quando: menosDias(7), lida: true }, agora), false);
});

test('sino: avisos não lidos ficam disponíveis por até 30 dias', () => {
  assert.equal(avisoDentroDoPrazo({ quando: menosDias(8), lida: false }, agora), true);
  assert.equal(avisoDentroDoPrazo({ quando: menosDias(29), lida: false }, agora), true);
  assert.equal(avisoDentroDoPrazo({ quando: menosDias(30), lida: false }, agora), false);
});

test('sino: datas antigas inválidas não são apagadas inadvertidamente', () => {
  assert.equal(avisoDentroDoPrazo({ quando: '', lida: true }, agora), true);
});
