import test from 'node:test';
import assert from 'node:assert/strict';
import { FonteSharePoint, ConflitoEdicao, LISTAS } from '../../src/services/FonteSharePoint';
import { atividadeTeste, projetoTeste } from '../helpers/fixtures';
import type { PortalConfig } from '../../src/config/config';
import type { Autenticador } from '../../src/services/auth';

const cfg = {
  sharepointHost: 'tenant.example', sitePath: '/sites/TesteProjetos', biblioteca: 'Documentos de Projetos', dataSimulada: '2026-05-20',
} as PortalConfig;
const auth = {
  email: () => 'gestor@systech.com.br', token: async () => 'token-de-teste', entrar: async () => '', sair: async () => {},
} as unknown as Autenticador;

type Item = { id: string; fields: Record<string, unknown>; lastModifiedDateTime?: string; lastModifiedBy?: unknown };
function simularSharePoint(opcoes: { conflito?: boolean; colunaAusente?: boolean } = {}) {
  const fonte = new FonteSharePoint(cfg, auth);
  const eventos: { metodo: string; url: string; dados?: unknown }[] = [];
  const listas = Object.entries(LISTAS).map(([chave, displayName]) => ({ id: chave, displayName }));
  const projeto: Item = { id: '11', fields: {
    Codigo: 'EXEMPLO-01', Title: 'Projeto exemplo', Cliente: 'Cliente Exemplo', Situacao: 'Ativo',
    Fase: 'Execução', DataInicio: '2026-05-11T12:00:00Z', DataTerminoBaseline: '2026-05-30T12:00:00Z',
    DataTerminoPrevista: '2026-06-02T12:00:00Z', Equipe: 'Gerente | Gerente de projeto | Systech | gp@systech.com.br',
  } };
  const atividade: Item = { id: '21', lastModifiedDateTime: '2026-05-20T12:00:00Z', fields: {
    ProjetoLookupId: 11, Codigo: '3.0', Title: 'Configurar ambiente', Fase: 'Execução', Status: 'Em andamento',
    Percentual: 20, Equipe: 'Systech/Cliente', Duracao: 2, DataInicio: '2026-05-13T12:00:00Z',
    DataTermino: '2026-05-15T12:00:00Z', Predecessoras: '2.0, 2.1', Lancada: true, HorasPlanejadas: 8,
  } };
  const gates: Item[] = [
    { id: '31', fields: { ProjetoLookupId: 11, Fase: 'Execução', Gate: 'G3', Title: 'G3', Situacao: 'Pendente' } },
    { id: '32', fields: { ProjetoLookupId: 11, Fase: 'Execução', Gate: 'G3', Title: 'G3', Situacao: 'Aprovado' } },
  ];
  let patchTentativas = 0;
  const graph = {
    async get(url: string) {
      eventos.push({ metodo: 'GET', url });
      if (url === '/sites/tenant.example:/sites/TesteProjetos') return { id: 'site' };
      if (url.includes('/items/21?$select')) return {
        id: '21', lastModifiedDateTime: opcoes.conflito ? '2026-05-21T09:00:00Z' : '2026-05-20T12:00:00Z',
        lastModifiedBy: { user: { displayName: 'Outro colaborador', email: 'outro@systech.com.br' } },
      };
      throw new Error('GET não esperado: ' + url);
    },
    async todos(url: string) {
      eventos.push({ metodo: 'LIST', url });
      if (url.endsWith('/lists?$select=id,displayName')) return listas;
      if (url.includes('/columns?$select=name')) return [{ name: 'Predecessoras' }, { name: 'Lancada' }, { name: 'HorasPlanejadas' }];
      if (url.includes('/drives?$select=id,name,webUrl')) return [{ id: 'drive-1', name: cfg.biblioteca, webUrl: 'https://tenant.example/documentos' }];
      if (url.includes('/lists/projetos/items?')) return [projeto];
      if (url.includes('/lists/atividades/items?')) return [atividade];
      if (url.includes('/lists/gates/items?')) return gates;
      if (url.includes('/lists/') && url.includes('/items?')) return [];
      throw new Error('LIST não esperada: ' + url);
    },
    async patch(url: string, dados: unknown) {
      eventos.push({ metodo: 'PATCH', url, dados: structuredClone(dados) });
      patchTentativas++;
      if (opcoes.colunaAusente && patchTentativas === 1) throw new Error("SharePoint respondeu 400: Field 'HorasPlanejadas' is not recognized");
      return { id: '21' };
    },
    async post(url: string, dados: unknown) {
      eventos.push({ metodo: 'POST', url, dados });
      return { id: '50' };
    },
  };
  // Injeta somente a comunicação de rede. Todas as regras de mapeamento/conflito da FonteSharePoint são reais.
  (fonte as unknown as { graph: typeof graph }).graph = graph;
  return { fonte, eventos };
}

test('FonteSharePoint carrega listas, converte datas e relaciona atividades ao projeto', async () => {
  const { fonte } = simularSharePoint();
  const dados = await fonte.carregar();
  assert.equal(dados.projetos.length, 1);
  assert.equal(dados.projetos[0].inicio, '2026-05-11');
  assert.equal(dados.projetos[0].equipe[0].email, 'gp@systech.com.br');
  const a = dados.atividades['EXEMPLO-01'][0];
  assert.equal(a.codigo, '3.0');
  assert.equal(a.termino, '2026-05-15');
  assert.deepEqual(a.predecessoras, ['2.0', '2.1']);
  assert.equal(a.lancada, true);
  assert.equal(a.horasPlanejadas, 8);
  assert.equal(fonte.hoje(), '2026-05-20');
  assert.equal(fonte.tarefasGravaveis(), true);
});

test('FonteSharePoint resolve gates duplicados priorizando o aprovado', async () => {
  const { fonte } = simularSharePoint();
  const d = await fonte.carregar();
  assert.equal(d.projetos[0].fases.length, 1);
  assert.equal(d.projetos[0].fases[0].situacao, 'Aprovado');
  assert.deepEqual(d.projetos[0].gatesRepetidos, ['31']);
  assert.equal(fonte.gatesDuplicados, 1);
});

test('grava atualização da atividade com datas SharePoint e predecessoras convertidas', async () => {
  const { fonte, eventos } = simularSharePoint();
  const d = await fonte.carregar();
  const a = d.atividades['EXEMPLO-01'][0];
  await fonte.salvarAtividade(d.projetos[0].codigo, a, {
    status: 'Bloqueado', causaAtraso: 'Janela / RDM', impedimento: true, termino: '2026-05-20', predecessoras: ['2.0', '2.1'],
  });
  const patch = eventos.find(x => x.metodo === 'PATCH')!;
  assert.equal(patch.url, '/sites/site/lists/atividades/items/21/fields');
  assert.deepEqual(patch.dados, {
    Status: 'Bloqueado', CausaAtraso: 'Janela / RDM', Impedimento: true,
    DataTermino: '2026-05-20T12:00:00Z', Predecessoras: '2.0, 2.1',
  });
});

test('bloqueia gravação quando outro usuário editou a atividade após o carregamento', async () => {
  const { fonte, eventos } = simularSharePoint({ conflito: true });
  const d = await fonte.carregar();
  const a = d.atividades['EXEMPLO-01'][0];
  await assert.rejects(() => fonte.salvarAtividade('EXEMPLO-01', a, { percentual: 80 }), ConflitoEdicao);
  assert.equal(eventos.filter(e => e.metodo === 'PATCH').length, 0);
});

test('se uma coluna não existir, reenvia sem a coluna e registra a ausência', async () => {
  const { fonte, eventos } = simularSharePoint({ colunaAusente: true });
  const d = await fonte.carregar();
  const a = d.atividades['EXEMPLO-01'][0];
  await fonte.salvarAtividade('EXEMPLO-01', a, { horasPlanejadas: 8, status: 'Planejado' });
  const patches = eventos.filter(x => x.metodo === 'PATCH');
  assert.equal(patches.length, 2);
  assert.deepEqual(patches[0].dados, { HorasPlanejadas: 8, Status: 'Planejado' });
  assert.deepEqual(patches[1].dados, { Status: 'Planejado' });
  assert.equal(fonte.colunasAusentes.has('HorasPlanejadas'), true);
});

test('salvarProjeto usa datas ao meio-dia UTC e serializa a equipe no formato esperado', async () => {
  const { fonte, eventos } = simularSharePoint();
  const d = await fonte.carregar();
  await fonte.salvarProjeto(d.projetos[0], {
    terminoPrevisto: '2026-06-10', equipe: projetoTeste().equipe,
  });
  const patch = eventos.find(x => x.metodo === 'PATCH')!;
  assert.equal(patch.url, '/sites/site/lists/projetos/items/11/fields');
  assert.equal((patch.dados as Record<string, string>).DataTerminoPrevista, '2026-06-10T12:00:00Z');
  assert.match((patch.dados as Record<string, string>).Equipe, /Gerente Exemplo|Interno/);
  assert.match((patch.dados as Record<string, string>).Equipe, /fiscal@cliente\.example/);
});

test('preparação de site e listas é reutilizada em carregamentos concorrentes', async () => {
  const { fonte, eventos } = simularSharePoint();
  await Promise.all([fonte.carregar(), fonte.carregar()]);
  assert.equal(eventos.filter(x => x.url === '/sites/tenant.example:/sites/TesteProjetos').length, 1);
});
