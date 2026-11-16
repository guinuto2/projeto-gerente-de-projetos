import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agruparPorDia, chaveAtividade, horarioEvento, montarEventoAtividade, PROPRIEDADE_ATIVIDADE, tituloAgenda, validarOpcoesAgenda,
  type EventoAgenda,
} from '../../src/lib/agenda';
import { atividadeTeste, projetoTeste } from '../helpers/fixtures';

const p = projetoTeste({ codigo: 'TRF1-VCF', nome: 'Convergência VCF' });
const a = atividadeTeste({ codigo: '3.1.1', nome: 'Backup do vCenter', fase: 'Execução', inicio: '2026-11-16', termino: '2026-11-18',
  descricao: 'Fazer backup em arquivo antes do upgrade.\nConferir o espaço no destino.' });

test('agenda: título padrão leva o código do projeto e o nome da atividade', () => {
  assert.equal(tituloAgenda(p, a), '[TRF1-VCF] Backup do vCenter');
  assert.equal(chaveAtividade('TRF1-VCF', '3.1.1'), 'TRF1-VCF|3.1.1');
});

test('agenda: "período" vira compromisso de dia inteiro, livre, com o fim no dia seguinte ao término', () => {
  const ev = montarEventoAtividade(p, a, { modo: 'periodo' });
  assert.equal(ev.isAllDay, true);
  assert.equal(ev.showAs, 'free');
  assert.deepEqual(ev.start, { dateTime: '2026-11-16T00:00:00', timeZone: 'E. South America Standard Time' });
  assert.deepEqual(ev.end, { dateTime: '2026-11-19T00:00:00', timeZone: 'E. South America Standard Time' }, 'o Outlook usa fim exclusivo');
  assert.equal(ev.subject, '[TRF1-VCF] Backup do vCenter');
});

test('agenda: "horário" vira bloco ocupado, com lembrete, no dia e horas escolhidos', () => {
  const ev = montarEventoAtividade(p, a, { modo: 'horario', data: '2026-11-17', horaInicio: '14:00', horaFim: '15:30' }, '', 'Título editado');
  assert.equal(ev.isAllDay, false);
  assert.equal(ev.showAs, 'busy');
  assert.equal(ev.isReminderOn, true);
  assert.equal(ev.start.dateTime, '2026-11-17T14:00:00');
  assert.equal(ev.end.dateTime, '2026-11-17T15:30:00');
  assert.equal(ev.subject, 'Título editado');
});

test('agenda: compromisso leva a descrição da atividade, protegida contra HTML, e o link do portal', () => {
  const perigosa = atividadeTeste({ ...a, descricao: '<script>alert(1)</script>' });
  const ev = montarEventoAtividade(p, perigosa, { modo: 'periodo' }, 'https://portal.exemplo/');
  assert.doesNotMatch(ev.body.content, /<script>/);
  assert.match(ev.body.content, /&lt;script&gt;/);
  assert.match(ev.body.content, /https:\/\/portal\.exemplo\/#\/atualizar\?item=TRF1-VCF%7C3\.1\.1/);
  const normal = montarEventoAtividade(p, a, { modo: 'periodo' });
  assert.match(normal.body.content, /Fazer backup em arquivo antes do upgrade\.<br>Conferir o espaço no destino\./, 'quebras de linha viram <br>');
  assert.match(normal.body.content, /Previsto: 16\/11\/2026 a 18\/11\/2026/);
});

test('agenda: compromisso carrega a etiqueta invisível com a chave da atividade', () => {
  const ev = montarEventoAtividade(p, a, { modo: 'periodo' });
  assert.deepEqual(ev.singleValueExtendedProperties, [{ id: PROPRIEDADE_ATIVIDADE, value: 'TRF1-VCF|3.1.1' }]);
});

test('agenda: validação do horário escolhido', () => {
  assert.equal(validarOpcoesAgenda({ modo: 'periodo' }, a), '');
  assert.match(validarOpcoesAgenda({ modo: 'periodo' }, atividadeTeste({ ...a, inicio: '', termino: '' })), /não tem início e término/);
  assert.match(validarOpcoesAgenda({ modo: 'horario', data: '', horaInicio: '09:00', horaFim: '10:00' }, a), /Escolha o dia/);
  assert.match(validarOpcoesAgenda({ modo: 'horario', data: '2026-11-17', horaInicio: '10:00', horaFim: '10:00' }, a), /fim precisa ser depois/);
  assert.equal(validarOpcoesAgenda({ modo: 'horario', data: '2026-11-17', horaInicio: '09:00', horaFim: '09:30' }, a), '');
});

test('agenda: agrupa por dia, com o dia inteiro primeiro e compromissos de vários dias em cada dia', () => {
  const ev: EventoAgenda[] = [
    { id: '1', titulo: 'Reunião', inicio: '2026-11-16T14:00:00', fim: '2026-11-16T15:00:00', diaInteiro: false },
    { id: '2', titulo: 'Daily', inicio: '2026-11-16T09:00:00', fim: '2026-11-16T09:30:00', diaInteiro: false },
    { id: '3', titulo: 'Janela', inicio: '2026-11-16T00:00:00', fim: '2026-11-18T00:00:00', diaInteiro: true },
    { id: '4', titulo: 'Fora do intervalo', inicio: '2026-11-25T09:00:00', fim: '2026-11-25T10:00:00', diaInteiro: false },
  ];
  const g = agruparPorDia(ev, '2026-11-16', '2026-11-22');
  assert.deepEqual(g.map(x => [x.dia, x.eventos.map(e => e.titulo)]), [
    ['2026-11-16', ['Janela', 'Daily', 'Reunião']],
    ['2026-11-17', ['Janela']],
  ], 'o dia inteiro termina no dia 17 (o 18 é o fim exclusivo)');
});

test('agenda: horário para mostrar', () => {
  assert.equal(horarioEvento({ id: '1', titulo: '', inicio: '2026-11-16T09:00:00', fim: '2026-11-16T10:30:00', diaInteiro: false }), '09:00–10:30');
  assert.equal(horarioEvento({ id: '1', titulo: '', inicio: '2026-11-16T00:00:00', fim: '2026-11-17T00:00:00', diaInteiro: true }), 'Dia inteiro');
});
