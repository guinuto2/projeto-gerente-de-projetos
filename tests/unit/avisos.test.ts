import test from 'node:test';
import assert from 'node:assert/strict';
import { avisoHorasPlanejadas, avisoHorasRealizadas, HORAS_POR_DIA } from '../../src/lib/validacoes';
import { destinatariosAviso } from '../../src/lib/notificacoes';

test('horas planejadas: limite é de 8 h por dia útil por pessoa', () => {
  assert.equal(HORAS_POR_DIA, 8);
  assert.equal(avisoHorasPlanejadas(24, 3), '', '24 h em 3 dias = exatamente 8 h/dia: sem aviso');
  assert.match(avisoHorasPlanejadas(25, 3), /25 h em 3 dia\(s\).*8 h por dia.*máximo de 24 h/);
  assert.match(avisoHorasPlanejadas(9, 1), /máximo de 8 h/);
});

test('horas planejadas: sem horas ou sem período não gera aviso', () => {
  assert.equal(avisoHorasPlanejadas(0, 3), '');
  assert.equal(avisoHorasPlanejadas(40, 0), '');
});

test('horas realizadas: aviso só acima de 20% das planejadas', () => {
  assert.equal(avisoHorasRealizadas(12, 10), '', 'exatamente 20% acima: sem aviso');
  assert.match(avisoHorasRealizadas(13, 10), /passam 30% das planejadas \(10 h\)/);
  assert.match(avisoHorasRealizadas(25, 20), /passam 25%/);
  assert.equal(avisoHorasRealizadas(50, undefined), '', 'sem horas planejadas: sem aviso');
});

test('sino: quem fez a ação não recebe o próprio aviso', () => {
  assert.deepEqual(destinatariosAviso('ana@systech.com.br, carlos@systech.com.br', 'ana@systech.com.br', false), ['carlos@systech.com.br']);
  assert.deepEqual(destinatariosAviso('Ana@Systech.com.br', 'ANA@systech.com.br', false), [], 'sem diferenciar maiúsculas');
});

test('sino: um aviso por pessoa, sem repetição nem endereços inválidos', () => {
  assert.deepEqual(
    destinatariosAviso('a@x.com; A@X.com, b@x.com,  , sem-arroba', '', false),
    ['a@x.com', 'b@x.com'],
  );
  assert.deepEqual(destinatariosAviso('', 'a@x.com', false), []);
});

test('sino: no modo piloto o aviso aparece para quem estiver testando', () => {
  assert.deepEqual(destinatariosAviso('', '', true), ['*']);
  assert.deepEqual(destinatariosAviso('a@x.com', 'a@x.com', true), ['*']);
});
