import test from 'node:test';
import assert from 'node:assert/strict';
import { diferencaDiasCorridos, somarDiasCorridos, diasUteis } from '../../src/lib/datas';
import { diasCorridos, marcasCronograma } from '../../src/lib/escalaCronograma';

test('desloca início e término mantendo duração de dois dias', () => {
  const delta = diferencaDiasCorridos('2026-05-13', '2026-05-15');
  assert.equal(delta, 2);
  assert.equal(somarDiasCorridos('2026-05-15', delta!), '2026-05-17');
});

test('permite antecipar datas, inclusive cruzando meses', () => {
  const delta = diferencaDiasCorridos('2026-06-02', '2026-05-30');
  assert.equal(delta, -3);
  assert.equal(somarDiasCorridos('2026-06-05', delta!), '2026-06-02');
});

test('atravessa ano bissexto sem perder dias', () => {
  assert.equal(somarDiasCorridos('2028-02-28', 2), '2028-03-01');
  assert.equal(diasCorridos('2028-02-28', '2028-03-01'), 2);
});

test('não modifica uma data inválida ou em edição incompleta', () => {
  assert.equal(diferencaDiasCorridos('2026-05-13', ''), null);
  assert.equal(somarDiasCorridos('', 3), '');
});

test('conta somente dias úteis no período, incluindo extremidades', () => {
  assert.equal(diasUteis('2026-05-15', '2026-05-18'), 2); // sexta até segunda
});

test('escala semanal em cronograma curto', () => {
  const marcas = marcasCronograma('2026-05-13', '2026-06-13');
  assert.equal(marcas[0].rotulo, '13/05');
  assert.ok(marcas.length >= 4);
});

test('escala legível para cronograma de cinco anos', () => {
  const marcas = marcasCronograma('2026-01-01', '2031-01-01');
  assert.ok(marcas.length <= 11);
  assert.ok(marcas.every(m => /[a-z]{3}\/\d{2}/.test(m.rotulo)));
});
