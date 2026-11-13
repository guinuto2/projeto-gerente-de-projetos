import test from 'node:test';
import assert from 'node:assert/strict';
import { modeloPadrao, datasDoItem, itensDoProjeto, idDoModelo } from '../../src/lib/modelos';
import { diasUteis, diferencaDiasCorridos, somarDiasCorridos } from '../../src/lib/datas';
import { conferirDatas, conferirStatus, checklistGate } from '../../src/lib/validacoes';
import { aguardando, candidatas, lancadaParaTecnico } from '../../src/lib/dependencias';
import { avanco, progressoFase } from '../../src/lib/calculos';
import { atividadeTeste, dadosTeste, projetoTeste } from '../helpers/fixtures';

test('modelo padrão gera atividades com datas úteis válidas e equipes padronizadas', () => {
  const modelo = modeloPadrao();
  assert.ok(modelo.itens.length > 10);
  for (const item of modelo.itens) {
    const { inicio, termino } = datasDoItem(item, '2026-05-11');
    assert.match(inicio, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(termino >= inicio, `${item.codigo}: término anterior ao início`);
    assert.equal(diasUteis(inicio, termino), Math.max(1, item.dias), item.codigo);
    assert.ok(!item.equipe.includes(' e Cliente'));
  }
});

test('modelo aplicado em fim de semana inicia na segunda-feira', () => {
  const item = { codigo: '3.0', nome: 'Teste', fase: 'Execução' as const, equipe: 'Systech', inicio: 0, dias: 3 };
  assert.deepEqual(datasDoItem(item, '2026-05-16'), { inicio: '2026-05-18', termino: '2026-05-20' });
});

test('cronograma salvo em modelo preserva duração, dependências e subatividades', () => {
  const original = [
    atividadeTeste({ codigo: '3.0', inicio: '2026-05-11', termino: '2026-05-14', duracao: 4 }),
    atividadeTeste({ codigo: '3.0.1', pai: '3.0', inicio: '2026-05-12', termino: '2026-05-13', duracao: 2, predecessoras: ['3.0'], horasPlanejadas: 8 }),
    atividadeTeste({ codigo: '3.1', status: 'Cancelado' }),
  ];
  const itens = itensDoProjeto(original, '2026-05-11');
  assert.deepEqual(itens.map(x => x.codigo), ['3.0', '3.0.1']);
  assert.deepEqual(itens[1].predecessoras, ['3.0']);
  assert.equal(itens[1].pai, '3.0');
  assert.equal(itens[1].horasPlanejadas, 8);
  const convertido = itens.map(x => ({ codigo: x.codigo, ...datasDoItem(x, '2026-06-01') }));
  assert.deepEqual(convertido, [
    { codigo: '3.0', inicio: '2026-06-01', termino: '2026-06-04' },
    { codigo: '3.0.1', inicio: '2026-06-02', termino: '2026-06-03' },
  ]);
});

test('reprogramação por diferença de dias preserva os intervalos também ao atravessar mês', () => {
  const antes = [atividadeTeste({ inicio: '2026-05-13', termino: '2026-05-15' }), atividadeTeste({ codigo: '3.1', inicio: '2026-05-28', termino: '2026-06-02' })];
  const delta = diferencaDiasCorridos(antes[0].inicio, '2026-05-15');
  assert.equal(delta, 2);
  const depois = antes.map(a => ({ ...a, inicio: somarDiasCorridos(a.inicio, delta!), termino: somarDiasCorridos(a.termino, delta!) }));
  assert.deepEqual(depois.map(a => [a.inicio, a.termino]), [['2026-05-15', '2026-05-17'], ['2026-05-30', '2026-06-04']]);
});

test('validação de datas cruza limites de projeto, pai e atividade filha', () => {
  const p = projetoTeste({ inicio: '2026-05-10', terminoPrevisto: '2026-05-20' });
  const pai = atividadeTeste({ inicio: '2026-05-11', termino: '2026-05-16' });
  const filha = atividadeTeste({ codigo: '3.0.1', pai: '3.0', inicio: '2026-05-12', termino: '2026-05-18' });
  const estrutura = conferirDatas(pai, p, [pai, filha], 'estrutura');
  assert.ok(estrutura.erros.some(x => x.includes('fora do período')));
  const reprogramacao = conferirDatas(pai, p, [pai, filha], 'reprogramacao');
  assert.ok(reprogramacao.avisos.some(x => x.includes('fora do período')));
  const fora = conferirDatas(atividadeTeste({ inicio: '2026-05-09', termino: '2026-05-22' }), p, [], 'estrutura');
  assert.ok(fora.erros.some(x => x.includes('antes do início do projeto')));
  assert.ok(fora.erros.some(x => x.includes('depois do fim previsto')));
});

test('dependência pendente bloqueia e impede relações circulares', () => {
  const a = atividadeTeste({ codigo: '3.0', predecessoras: ['3.1'] });
  const b = atividadeTeste({ codigo: '3.1' });
  const c = atividadeTeste({ codigo: '3.2', predecessoras: ['3.0'] });
  assert.equal(aguardando(a, [a, b, c]), true);
  assert.ok(!candidatas([a, b, c], '3.0').some(x => x.codigo === '3.2'));
  assert.equal(aguardando(a, [a, { ...b, status: 'Concluído' }, c]), false);
  assert.equal(lancadaParaTecnico(atividadeTeste({ pai: '3.0', lancada: false })), false);
  assert.equal(lancadaParaTecnico(atividadeTeste({ pai: '3.0' })), true);
});

test('avançar atividade altera progresso do projeto e checklist do gate G3', () => {
  const p = projetoTeste();
  const a = atividadeTeste({ codigo: '3.0', duracao: 3, percentual: 0 });
  const b = atividadeTeste({ codigo: '3.1', duracao: 1, percentual: 100, status: 'Concluído' });
  const dados = dadosTeste(p, [a, b]);
  assert.equal(avanco(dados, p.codigo), 25);
  assert.equal(progressoFase(dados, p.codigo, 'Execução').feitas, 1);
  assert.equal(checklistGate('G3', p, dados, true)[0].ok, false);
  dados.atividades[p.codigo][0] = { ...a, status: 'Concluído', percentual: 100, dataReal: '2026-05-20', horasRealizadas: 4 };
  assert.equal(avanco(dados, p.codigo), 100);
  assert.equal(checklistGate('G3', p, dados, true)[0].ok, true);
});

test('atividade vencida exige causa; após correção do status mantém a regra de horas', () => {
  const a = atividadeTeste({ termino: '2026-05-14', status: 'Em andamento', percentual: 30 });
  assert.ok(conferirStatus(a, { ...a }, '2026-05-20', false).some(x => x.includes('causa do atraso')));
  assert.ok(!conferirStatus(a, { ...a, causaAtraso: 'Cliente / acesso' }, '2026-05-20', false).some(x => x.includes('causa do atraso')));
  assert.ok(conferirStatus(a, { ...a, causaAtraso: 'Cliente / acesso', horasRealizadas: 5, dataReal: '2026-05-21' }, '2026-05-20', false).some(x => x.includes('futuro')));
  assert.ok(conferirStatus({ ...a, horasRealizadas: 10 }, { ...a, horasRealizadas: 5, causaAtraso: 'Cliente / acesso' }, '2026-05-20', false).some(x => x.includes('diminuir')));
});

test('G4 exige atividades e pendências resolvidas, riscos mitigados e TRD', () => {
  const p = projetoTeste();
  const dados = dadosTeste(p, [atividadeTeste()]);
  dados.riscos[p.codigo].push({ codigo: 'R1', descricao: 'Risco', impactoProjeto: '', cenarios: '', probabilidade: 'Alto', impacto: 'Alto', mitigacao: '', contingencia: '', responsavel: '', situacao: 'Aberto' });
  dados.pendencias[p.codigo].push({ codigo: 'P1', pergunta: 'Pendente', detalhe: '', impacto: '', situacao: 'Aberta' });
  assert.deepEqual(checklistGate('G4', p, dados, false).map(x => x.ok), [false, false, false, false]);
  dados.atividades[p.codigo][0].status = 'Concluído';
  dados.riscos[p.codigo][0].situacao = 'Mitigado';
  dados.pendencias[p.codigo][0].situacao = 'Respondida';
  assert.deepEqual(checklistGate('G4', p, dados, true).map(x => x.ok), [true, true, true, true]);
});

test('ID de modelo normaliza texto e evita espaços/acento', () => {
  assert.equal(idDoModelo('Entrega Técnica & Homologação'), 'entrega-tecnica-homologacao');
});
