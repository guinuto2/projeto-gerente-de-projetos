import test from 'node:test';
import assert from 'node:assert/strict';
import type { Dados } from '../../src/types/models';

/** Isola o localStorage sem browser nem dados reais. */
const armazenamento = new Map<string, string>();
Object.assign(globalThis, {
  window: { PORTAL_CONFIG: { clientId: '', dataSimulada: '2026-06-01' } },
  localStorage: {
    getItem(chave: string) { return armazenamento.get(chave) ?? null; },
    setItem(chave: string, valor: string) { armazenamento.set(chave, String(valor)); },
    removeItem(chave: string) { armazenamento.delete(chave); },
    clear() { armazenamento.clear(); },
  },
});

// Carregar depois do window: config.ts consulta PORTAL_CONFIG ao inicializar.
const { FontePiloto } = require('../../src/services/FontePiloto') as typeof import('../../src/services/FontePiloto');

test.beforeEach(() => armazenamento.clear());

test('FontePiloto carrega dados de demonstração e a data simulada sem chamar API', async () => {
  const fonte = new FontePiloto();
  const d = await fonte.carregar();
  assert.ok(d.projetos.length > 0);
  assert.ok(d.atividades[d.projetos[0].codigo] !== undefined);
  assert.equal(fonte.modo, 'piloto');
  assert.equal(fonte.hoje(), '2026-06-01');
  assert.equal(fonte.email(), '');
});

test('persistir e carregar recuperam alterações entre instâncias da fonte', async () => {
  const fonte = new FontePiloto();
  const inicial = await fonte.carregar();
  const codigo = inicial.projetos[0].codigo;
  const alterado = structuredClone(inicial);
  alterado.projetos[0].nome = 'Projeto alterado no piloto';
  fonte.persistir(alterado);
  const recarregado = await new FontePiloto().carregar();
  assert.equal(recarregado.projetos[0].nome, 'Projeto alterado no piloto');
  assert.equal(recarregado.projetos[0].codigo, codigo);
});

test('carregar recupera os dados originais quando armazenamento está corrompido', async () => {
  armazenamento.set('portal-pmo-piloto-v3', '{json inválido');
  const d = await new FontePiloto().carregar();
  assert.ok(d.projetos.length > 0);
});

test('restaurar descarta alterações do piloto e o histórico local', async () => {
  const fonte = new FontePiloto();
  const d = await fonte.carregar();
  fonte.persistir({ ...d, projetos: [] } as Dados);
  armazenamento.set('portal-pmo-historico-v1', '[{"quando":"hoje"}]');
  fonte.restaurar();
  assert.equal(armazenamento.has('portal-pmo-piloto-v3'), false);
  assert.equal(armazenamento.has('portal-pmo-historico-v1'), false);
  assert.ok((await fonte.carregar()).projetos.length > 0);
});

test('modelos são criados, substituídos e excluídos por identificador', async () => {
  const fonte = new FontePiloto();
  const base = { id: 'modelo-teste', nome: 'Modelo 1', tipo: '', descricao: '', itens: [] };
  await fonte.salvarModelo(base);
  await fonte.salvarModelo({ ...base, nome: 'Modelo atualizado' });
  const modelos = await fonte.modelos();
  assert.equal(modelos.length, 1);
  assert.equal(modelos[0].nome, 'Modelo atualizado');
  assert.equal(modelos[0].atualizadoPor, 'Modo piloto');
  await fonte.excluirModelo('modelo-teste');
  assert.deepEqual(await fonte.modelos(), []);
});

test('modelos tratam JSON inválido sem impedir o carregamento do portal', async () => {
  armazenamento.set('portal-pmo-modelos', '{{erro');
  assert.deepEqual(await new FontePiloto().modelos(), []);
});

test('histórico registra alterações e consulta por projeto em ordem decrescente', async () => {
  const fonte = new FontePiloto();
  const r = { usuario: 'testador', tipo: 'Atividade', acao: 'Editou', descricao: 'Teste' };
  await fonte.registrar({ ...r, projeto: 'A', quando: '2026-05-01T10:00:00Z' });
  await fonte.registrar({ ...r, projeto: 'B', quando: '2026-05-02T10:00:00Z' });
  await fonte.registrar({ ...r, projeto: 'A', quando: '2026-05-03T10:00:00Z' });
  assert.deepEqual((await fonte.historico('A')).map(x => x.quando), ['2026-05-03T10:00:00Z', '2026-05-01T10:00:00Z']);
  assert.equal((await fonte.historico('B')).length, 1);
});

test('notificações são geradas e marcadas como lidas no modo piloto', async () => {
  const fonte = new FontePiloto();
  await fonte.criarNotificacoes([{ para: 'user@example.test', titulo: 'Tarefa', texto: 'Nova atividade', link: '/projeto/A', tipo: 'tarefa' }]);
  const lista = await fonte.notificacoes('user@example.test');
  assert.equal(lista.length, 1);
  assert.equal(lista[0].lida, false);
  await fonte.marcarNotificacoesLidas([lista[0].id]);
  assert.equal((await fonte.notificacoes('user@example.test'))[0].lida, true);
});

test('documentos retornam a estrutura de pastas mesmo sem arquivos', async () => {
  const fonte = new FontePiloto();
  await fonte.carregar();
  const pastas = await fonte.documentos('PROJETO-INEXISTENTE');
  assert.equal(pastas.length, 5);
  assert.ok(pastas.every(p => Array.isArray(p.arquivos) && p.arquivos.length === 0));
});

test('modo piloto proíbe upload real para SharePoint', async () => {
  const fonte = new FontePiloto();
  await assert.rejects(() => fonte.enviarArquivo(), /funciona quando o portal está conectado ao SharePoint/);
});

test('documentos da Wiki são gravados e recuperados sem rede', async () => {
  const fonte = new FontePiloto();
  const doc = { id: 'modelo-wiki', nome: 'Processo de teste', atualizadoPor: '', atualizado: '', conteudo: '' };
  // Os dados da Wiki são persistidos como JSON no modo piloto.
  await fonte.salvarWikiDoc(doc as unknown as import('../../src/lib/wiki').ModeloSalvo);
  const lista = await fonte.wikiDocs();
  assert.equal(lista.length, 1);
  assert.equal(lista[0].nome, 'Processo de teste');
  assert.equal(lista[0].atualizadoPor, 'Modo piloto');
});
