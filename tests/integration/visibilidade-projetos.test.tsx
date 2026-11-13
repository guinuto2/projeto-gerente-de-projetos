/** Exercita o hook real com contextos de teste: nenhuma autenticação, SharePoint ou API externa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dadosTeste, projetoTeste } from '../helpers/fixtures';
import type { Papel } from '../../src/lib/permissoes';
import type { Projeto } from '../../src/types/models';

let cenario: { papel: Papel; email: string; projetos: Projeto[]; modo: 'piloto' | 'sharepoint'; modoCliente?: boolean };
// O hook recebe estes dados através de usePortal e usePapel. Todo o restante do hook é real.
const portalMod = require.resolve('../../src/state/PortalContext');
const papelMod = require.resolve('../../src/state/PapelContext');
require.cache[portalMod] = { id: portalMod, filename: portalMod, loaded: true, exports: {
  usePortal: () => ({
    dados: { ...dadosTeste(), projetos: cenario.projetos },
    usuario: 'Usuário de teste', email: cenario.email, fonte: { modo: cenario.modo, modoCliente: cenario.modoCliente },
  }),
}} as NodeModule;
require.cache[papelMod] = { id: papelMod, filename: papelMod, loaded: true, exports: {
  usePapel: () => ({ papel: cenario.papel }),
}} as NodeModule;
const { useProjetosVisiveis } = require('../../src/state/useProjetosVisiveis') as typeof import('../../src/state/useProjetosVisiveis');

type Visibilidade = ReturnType<typeof useProjetosVisiveis>;
function consultar(): Visibilidade {
  let resultado: Visibilidade | undefined;
  const Probe = () => { resultado = useProjetosVisiveis(); return null; };
  renderToStaticMarkup(createElement(Probe));
  assert.ok(resultado);
  return resultado;
}

const equipe = (email: string) => [
  { nome: 'Gestor interno', funcao: 'Gerente', empresa: 'Systech', email: 'gp@systechtecnologia.com.br' },
  { nome: 'Cliente', funcao: 'Fiscal', empresa: 'Órgão externo', email },
];

test('segurança: cliente autenticado só vê projetos do próprio órgão no modo conectado', () => {
  const orgA = projetoTeste({ codigo: 'ORGA-A', cliente: 'Órgão A', equipe: equipe('fiscal@orgao-a.gov.br') });
  const orgB = projetoTeste({ codigo: 'ORGB-B', cliente: 'Órgão B', equipe: equipe('fiscal@orgao-b.gov.br') });
  cenario = { papel: 'Cliente', email: 'outro@orgao-a.gov.br', modo: 'sharepoint', projetos: [orgA, orgB] };
  const v = consultar();
  assert.deepEqual(v.todos.map(p => p.codigo), ['ORGA-A']);
  assert.equal(v.podeVer(orgA), true);
  assert.equal(v.podeVer(orgB), false);
  assert.equal(v.projetos.length, 1);
});

test('segurança: cliente externo não herda projetos da Systech ou de outro órgão', () => {
  const interno = projetoTeste({ codigo: 'INTERNO-01', cliente: 'Órgão interno', equipe: equipe('fiscal@cliente-a.gov') });
  const externo = projetoTeste({ codigo: 'EXTERNO-02', cliente: 'Órgão externo', equipe: equipe('fiscal@cliente-b.gov') });
  cenario = { papel: 'Cliente', email: 'funcionario@systechtecnologia.com.br', modo: 'sharepoint', projetos: [interno, externo] };
  const simulacao = consultar();
  assert.deepEqual(simulacao.todos.map(p => p.codigo), ['INTERNO-01'], 'contas internas de teste só simulam um cliente');
  cenario = { papel: 'Cliente', email: 'contato@cliente-b.gov', modo: 'sharepoint', projetos: [interno, externo] };
  assert.deepEqual(consultar().todos.map(p => p.codigo), ['EXTERNO-02']);
});

test('segurança: rascunhos de projeto nunca aparecem para Técnico, Cliente ou Patrocinador', () => {
  const rascunho = projetoTeste({ codigo: 'RASC-01', situacaoCadastro: 'Rascunho' });
  const ativo = projetoTeste({ codigo: 'ATIVO-01', situacaoCadastro: 'Ativo', equipe: equipe('a@orgao-a.gov.br') });
  for (const papel of ['Técnico', 'Cliente', 'Patrocinador'] as Papel[]) {
    cenario = { papel, email: 'a@orgao-a.gov.br', modo: 'sharepoint', projetos: [rascunho, ativo] };
    const v = consultar();
    assert.equal(v.podeVer(rascunho), false, `${papel} não pode ver o rascunho`);
    assert.equal(v.todos.some(p => p.codigo === rascunho.codigo), false);
    assert.deepEqual(v.rascunhos, []);
  }
  cenario = { papel: 'PMO', email: 'gestor@systechtecnologia.com.br', modo: 'sharepoint', projetos: [rascunho, ativo] };
  assert.deepEqual(consultar().rascunhos.map(p => p.codigo), ['RASC-01']);
});

test('segurança: projeto em aprovação não é publicado na visão de cliente', () => {
  const projeto = projetoTeste({ codigo: 'EM-APROV', situacaoCadastro: 'Em aprovação', equipe: equipe('fiscal@orgao-a.gov.br') });
  cenario = { papel: 'Cliente', email: 'outro@orgao-a.gov.br', modo: 'sharepoint', projetos: [projeto] };
  assert.equal(consultar().podeVer(projeto), false);
});

test('segurança: técnico só vê projetos ativos em que está na equipe (e encerrados para consulta)', () => {
  const daEquipe = projetoTeste({ codigo: 'MINHA-EQUIPE', equipe: [
    { nome: 'Gestor interno', funcao: 'Gerente', empresa: 'Systech', email: 'gp@systechtecnologia.com.br' },
    { nome: 'Técnico responsável', funcao: 'Técnico', empresa: 'Systech', email: 'tecnico@systechtecnologia.com.br' },
  ] });
  const outraEquipe = projetoTeste({ codigo: 'OUTRA-EQUIPE', equipe: [
    { nome: 'Outro técnico', funcao: 'Técnico', empresa: 'Systech', email: 'outro@systechtecnologia.com.br' },
  ] });
  const encerradoDeOutros = projetoTeste({ codigo: 'ENCERRADO-OUTROS', situacaoCadastro: 'Encerrado', equipe: [
    { nome: 'Outro técnico', funcao: 'Técnico', empresa: 'Systech', email: 'outro@systechtecnologia.com.br' },
  ] });
  cenario = { papel: 'Técnico', email: 'TECNICO@systechtecnologia.com.br', modo: 'sharepoint', projetos: [daEquipe, outraEquipe, encerradoDeOutros] };
  const v = consultar();
  assert.equal(v.podeVer(daEquipe), true, 'vê o projeto em que está na equipe (e-mail sem diferenciar maiúsculas)');
  assert.equal(v.podeVer(outraEquipe), false, 'não vê projeto ativo de outra equipe');
  assert.equal(v.podeVer(encerradoDeOutros), true, 'encerrados ficam abertos para consulta');
  assert.deepEqual(v.todos.map(p => p.codigo).sort(), ['ENCERRADO-OUTROS', 'MINHA-EQUIPE']);
});
