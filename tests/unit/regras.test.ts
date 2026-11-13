import test from 'node:test';
import assert from 'node:assert/strict';
import { pode, papelDaFuncao } from '../../src/lib/permissoes';
import { pendentes, aguardando, situacaoPrazo } from '../../src/lib/dependencias';
import { conferirStatus, normalizarCodigo } from '../../src/lib/validacoes';
import { CRONOGRAMA_SYSTECH } from '../../src/lib/modeloSystech';
import { colunaKanban } from '../../src/components/atualizacao/KanbanAtividades';
import { gerentesParaCadastro } from '../../src/lib/pessoas';
import type { Atividade } from '../../src/types/models';

function atividade(parcial: Partial<Atividade> = {}): Atividade {
  return {
    codigo: '1.0', nome: 'Instalação', fase: 'Execução', equipe: 'Systech', duracao: 2,
    descricao: '', marco: false, inicio: '2026-05-13', termino: '2026-05-15',
    baselineInicio: '2026-05-13', baselineTermino: '2026-05-15', status: 'Planejado',
    percentual: 0, pai: '', observacao: '', ...parcial,
  };
}

test('PMO pode editar projetos, Técnico e Cliente não', () => {
  assert.equal(pode('PMO', 'editarProjeto'), true);
  assert.equal(pode('Técnico', 'editarProjeto'), false);
  assert.equal(pode('Cliente', 'editarProjeto'), false);
});

test('Técnico pode atualizar atividade, Cliente não', () => {
  assert.equal(pode('Técnico', 'atualizarAtividade'), true);
  assert.equal(pode('Cliente', 'atualizarAtividade'), false);
});

test('interpreta funções do Entra ID inclusive com acentos', () => {
  assert.equal(papelDaFuncao('Técnico'), 'Técnico');
  assert.equal(papelDaFuncao('pmo'), 'PMO');
  assert.equal(papelDaFuncao('perfil-desconhecido'), null);
});

test('atividade atrasada e aberta exige causa do atraso', () => {
  const original = atividade();
  const erros = conferirStatus(original, atividade(), '2026-05-20', false);
  assert.ok(erros.some(e => e.includes('causa do atraso')));
});

test('atividade atrasada com causa informada não acusa ausência de causa', () => {
  const original = atividade();
  const erros = conferirStatus(original, atividade({ causaAtraso: 'Cliente / acesso' }), '2026-05-20', false);
  assert.equal(erros.some(e => e.includes('causa do atraso')), false);
});

test('atividade no prazo não exige causa de atraso', () => {
  const a = atividade();
  const erros = conferirStatus(a, a, '2026-05-14', false);
  assert.equal(erros.some(e => e.includes('causa do atraso')), false);
});

test('dependência não concluída bloqueia a atividade', () => {
  const anterior = atividade({ codigo: '1.0' });
  const dependente = atividade({ codigo: '1.1', predecessoras: ['1.0'] });
  assert.equal(pendentes(dependente, [anterior, dependente]).length, 1);
  assert.equal(aguardando(dependente, [anterior, dependente]), true);
  assert.equal(aguardando(dependente, [atividade({ codigo: '1.0', status: 'Concluído' }), dependente]), false);
});

test('classifica atividade vencida e concluída corretamente', () => {
  assert.equal(situacaoPrazo(atividade(), '2026-05-20'), 'atrasada');
  assert.equal(situacaoPrazo(atividade({ status: 'Concluído' }), '2026-05-20'), '');
});

test('classifica Kanban com impedimento antes de em andamento', () => {
  assert.equal(colunaKanban(atividade({ status: 'Concluído' })), 'concluidas');
  assert.equal(colunaKanban(atividade({ status: 'Em andamento', impedimento: true })), 'bloqueadas');
  assert.equal(colunaKanban(atividade({ status: 'Em andamento' })), 'andamento');
  assert.equal(colunaKanban(atividade()), 'planejadas');
});

test('normaliza o código do projeto', () => {
  assert.equal(normalizarCodigo('trf 1_vcf'), 'TRF-1-VCF');
});

test('modelo inicial usa Systech/Cliente e Cliente, sem valores antigos', () => {
  const equipes = new Set(CRONOGRAMA_SYSTECH.map(a => a.equipe));
  assert.ok(equipes.has('Systech/Cliente'));
  assert.ok(equipes.has('Cliente'));
  assert.ok(!equipes.has('Systech e Cliente'));
});


test('gerentes são selecionados pela função ativa no Portal Técnicos, não pela role PMO', () => {
  const pessoas = [
    { nome: 'Gerente', email: 'gp@exemplo.com', funcao: 'Gerente de projeto', ativo: true },
    { nome: 'Arquitetura', email: 'arq@exemplo.com', funcao: 'Arquiteto', ativo: true },
    { nome: 'PMO', email: 'pmo@exemplo.com', funcao: 'PMO', ativo: true },
    { nome: 'Ex gerente', email: 'antigo@exemplo.com', funcao: 'Gerente', ativo: false },
    { nome: 'Dupla função', email: 'duplo@exemplo.com', funcao: 'Arquiteto/Gerente', ativo: true },
  ];
  assert.deepEqual(gerentesParaCadastro(pessoas).map(p => p.nome), ['Dupla função', 'Gerente']);
});
