import test from 'node:test';
import assert from 'node:assert/strict';
import { pode } from '../../src/lib/permissoes';
import { conferirStatus, faltasFaturamento, tarefasNoPeriodo, avisoSobrecarga } from '../../src/lib/validacoes';
import { atividadeTeste, dadosTeste, projetoTeste } from '../helpers/fixtures';

// Testes negativos foram adicionados porque a suite anterior checava em grande parte casos positivos.
test('segurança: só PMO exclui projeto; patrocinador mantém apenas aprovação', () => {
  assert.equal(pode('PMO', 'excluirProjeto'), true);
  for (const papel of ['Patrocinador', 'Técnico', 'Cliente'] as const) {
    assert.equal(pode(papel, 'excluirProjeto'), false, `perfil ${papel}`);
  }
  assert.equal(pode('Patrocinador', 'aprovarGate'), true);
  assert.equal(pode('Patrocinador', 'editarProjeto'), false);
});

test('segurança: Técnico não consegue gerenciar riscos, mesmo podendo atualizar atividade', () => {
  assert.equal(pode('Técnico', 'editarRisco'), false);
  assert.equal(pode('Técnico', 'atualizarAtividade'), true);
  assert.equal(pode('PMO', 'editarRisco'), true);
  for (const papel of ['Cliente', 'Patrocinador'] as const) assert.equal(pode(papel, 'editarRisco'), false);
});

test('status: 100% com status aberto deve ser recusado; concluído com dados obrigatórios é aceito', () => {
  const antes = atividadeTeste({ inicio: '2026-05-01', termino: '2026-05-30' });
  for (const status of ['Planejado', 'Em andamento', 'Bloqueado'] as const) {
    const depois = { ...antes, status, percentual: 100, impedimento: status === 'Bloqueado', observacao: 'Motivo informado' };
    assert.ok(conferirStatus(antes, depois, '2026-05-20', false).some(e => e.includes('100%') && e.includes('Concluído')), status);
  }
  const completo = { ...antes, status: 'Concluído' as const, percentual: 100, horasRealizadas: 5, dataReal: '2026-05-20' };
  assert.deepEqual(conferirStatus(antes, completo, '2026-05-20', false), []);
});

test('cadastro: Edital e Service Entitlement exigem número de contrato e data de assinatura', () => {
  for (const modeloFaturamento of ['Edital', 'Service Entitlement']) {
    const faltas = faltasFaturamento({ modeloFaturamento, contrato: '', dataAssinatura: '' });
    assert.equal(faltas.length, 2, modeloFaturamento);
    assert.ok(faltas.some(x => /contrato\/pedido/.test(x)));
    assert.ok(faltas.some(x => /assinatura/.test(x)));
    assert.deepEqual(faltasFaturamento({ modeloFaturamento, contrato: 'CT-001', dataAssinatura: '2026-05-12' }), []);
    assert.equal(faltasFaturamento({ modeloFaturamento, contrato: 'CT-001' }).length, 1);
    assert.equal(faltasFaturamento({ modeloFaturamento, dataAssinatura: '2026-05-12' }).length, 1);
  }
  assert.deepEqual(faltasFaturamento({ modeloFaturamento: 'Outro' }), []);
});

test('planejamento: aviso de sobrecarga considera técnico certo e projetos diferentes com datas sobrepostas', () => {
  const pA = projetoTeste({ codigo: 'ORG-01' });
  const pB = projetoTeste({ codigo: 'ORG-02' });
  const pFechado = projetoTeste({ codigo: 'ORG-03', situacaoCadastro: 'Encerrado' });
  const dados = dadosTeste(pA, [
    atividadeTeste({ codigo: '3.0', responsavel: 'A@SYSTECH.COM.BR', inicio: '2026-05-10', termino: '2026-05-20' }),
    atividadeTeste({ codigo: '3.1', responsavel: 'outro@systech.com.br', inicio: '2026-05-10', termino: '2026-05-20' }),
    atividadeTeste({ codigo: '3.2', responsavel: 'a@systech.com.br', inicio: '2026-05-10', termino: '2026-05-20', status: 'Concluído' }),
  ]);
  dados.projetos = [pA, pB, pFechado];
  dados.atividades[pB.codigo] = [atividadeTeste({ codigo: '4.0', responsavel: 'a@systech.com.br', inicio: '2026-05-20', termino: '2026-05-25' })];
  dados.atividades[pFechado.codigo] = [atividadeTeste({ codigo: '5.0', responsavel: 'a@systech.com.br', inicio: '2026-05-12', termino: '2026-05-19' })];
  const encontrados = tarefasNoPeriodo(dados, 'a@systech.com.br', '2026-05-15', '2026-05-22');
  assert.deepEqual(encontrados.map(x => `${x.projeto}/${x.codigo}`), ['ORG-01/3.0', 'ORG-02/4.0']);
  assert.match(avisoSobrecarga(encontrados), /2 tarefa\(s\)/);
  assert.deepEqual(tarefasNoPeriodo(dados, 'outro@systech.com.br', '2026-05-15', '2026-05-22').map(x => x.codigo), ['3.1']);
  assert.deepEqual(tarefasNoPeriodo(dados, 'a@systech.com.br', '2026-05-15', '2026-05-18', { projeto: 'ORG-01', codigo: '3.0' }), []);
  assert.deepEqual(tarefasNoPeriodo(dados, 'a@systech.com.br', '2026-06-01', '2026-06-05'), []);
});
