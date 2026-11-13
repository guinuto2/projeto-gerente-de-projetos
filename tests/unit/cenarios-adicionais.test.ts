import test from 'node:test';
import assert from 'node:assert/strict';
import { codigoDaFase, codigoSubatividade, classeEquipe, proximoCodigoSeq, pastaDaFase, normalizarTipo } from '../../src/lib/constantes';
import { conferirStatus, fimDeSemana, avisoFimDeSemana } from '../../src/lib/validacoes';
import { atividadesDaSemana, semanaDe } from '../../src/lib/semana';
import { situacaoPrazo } from '../../src/lib/dependencias';
import { avanco, planejado } from '../../src/lib/calculos';
import { atividadeTeste, projetoTeste, dadosTeste } from '../helpers/fixtures';

test('códigos de atividades não colidem com subatividades existentes', () => {
  assert.equal(codigoDaFase(['3.0', '3.0.1', '3.2'], 'Execução'), '3.3');
  assert.equal(codigoDaFase([], 'Iniciação'), '1.0');
});

test('nova subatividade usa o maior sufixo livre', () => {
  assert.equal(codigoSubatividade(['3.0', '3.0.1', '3.0.3', '3.1.1'], '3.0'), '3.0.4');
});

test('próximo código sequencial preserva prefixo e incremento numérico', () => {
  assert.equal(proximoCodigoSeq(['R-1', 'R-3', 'P-9'], 'R-'), 'R-4');
  assert.equal(proximoCodigoSeq([], 'DA-A'), 'DA-A1');
});

test('equipe mista, cliente e Systech têm classes corretas', () => {
  assert.equal(classeEquipe('Systech/Cliente'), 'a');
  assert.equal(classeEquipe('Systech/Cliente/Fabricante'), 'a');
  assert.equal(classeEquipe('Cliente'), 'c');
  assert.equal(classeEquipe('Systech'), 's');
});

test('converte classificação de tipo legado sem mudar tipos novos', () => {
  assert.equal(normalizarTipo('VMware / EUC'), 'VMware');
  assert.equal(normalizarTipo('Backup'), 'Backup');
});

test('resolução de pasta por fase retorna a pasta do cronograma', () => {
  assert.match(pastaDaFase('Execução'), /Execução/);
  assert.match(pastaDaFase('Encerramento'), /Encerramento/);
});

test('aviso sobre finais de semana diferencia sábado de domingo', () => {
  assert.equal(fimDeSemana('2026-05-16'), true);
  assert.match(avisoFimDeSemana('2026-05-16'), /sábado/);
  assert.match(avisoFimDeSemana('2026-05-17'), /domingo/);
  assert.equal(fimDeSemana('2026-05-18'), false);
});

test('conclusão requer data real e horas quando não há subatividades', () => {
  const a = atividadeTeste();
  const erros = conferirStatus(a, { ...a, status: 'Concluído', percentual: 100 }, '2026-05-20', false);
  assert.ok(erros.some(e => e.includes('data real')));
  assert.ok(erros.some(e => e.includes('horas realizadas')));
  assert.deepEqual(conferirStatus(a, { ...a, status: 'Concluído', percentual: 100, dataReal: '2026-05-20', horasRealizadas: 2 }, '2026-05-20', false), []);
});

test('bloqueio exige impedimento e observação', () => {
  const a = atividadeTeste();
  const erros = conferirStatus(a, { ...a, status: 'Bloqueado', percentual: 0, observacao: '' }, '2026-05-12', false);
  assert.ok(erros.some(e => e.includes('impedimento')));
  assert.ok(erros.some(e => e.includes('observação')));
});

test('prazo próximo e atrasado seguem status real', () => {
  assert.equal(situacaoPrazo(atividadeTeste({ termino: '2026-05-21' }), '2026-05-20'), 'perto');
  assert.equal(situacaoPrazo(atividadeTeste({ termino: '2026-05-19' }), '2026-05-20'), 'atrasada');
  assert.equal(situacaoPrazo(atividadeTeste({ termino: '2026-05-19', status: 'Cancelado' }), '2026-05-20'), '');
});

test('semana de trabalho começa na segunda-feira e termina no domingo', () => {
  assert.deepEqual(semanaDe('2026-05-17'), { inicio: '2026-05-11', fim: '2026-05-17' });
});

test('atividades semanais ignoram concluídas e subatividade sem responsável', () => {
  const p = projetoTeste();
  const dados = dadosTeste(p, [
    atividadeTeste({ codigo: '3.0', inicio: '2026-05-11', termino: '2026-05-13' }),
    atividadeTeste({ codigo: '3.0.1', pai: '3.0', inicio: '2026-05-12', termino: '2026-05-13' }),
    atividadeTeste({ codigo: '3.0.2', pai: '3.0', responsavel: 'tech@systech.com.br', inicio: '2026-05-12', termino: '2026-05-16' }),
    atividadeTeste({ codigo: '3.1', status: 'Concluído', inicio: '2026-05-11' }),
    atividadeTeste({ codigo: '3.2', inicio: '2026-06-01' }),
  ]);
  assert.deepEqual(atividadesDaSemana(dados, [p], '2026-05-15').map(i => i.atividade.codigo), ['3.0', '3.0.2']);
});

test('percentual do projeto considera peso por duração das macroatividades', () => {
  const p = projetoTeste();
  const d = dadosTeste(p, [
    atividadeTeste({ codigo: '3.0', duracao: 3, percentual: 100 }),
    atividadeTeste({ codigo: '3.1', duracao: 1, percentual: 0 }),
    atividadeTeste({ codigo: '3.0.1', pai: '3.0', duracao: 20, percentual: 0 }),
  ]);
  assert.equal(avanco(d, p.codigo), 75);
});

test('planejado representa 100% após o término da baseline', () => {
  const p = projetoTeste();
  const d = dadosTeste(p, [atividadeTeste({ inicio: '2026-05-11', termino: '2026-05-14', baselineInicio: '2026-05-11', baselineTermino: '2026-05-14' })]);
  assert.equal(planejado(d, p.codigo, '2026-06-01'), 100);
});
