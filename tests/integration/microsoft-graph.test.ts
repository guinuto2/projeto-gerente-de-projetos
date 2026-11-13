import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphClient, fetchGraph } from '../../src/services/graph';
import type { Autenticador } from '../../src/services/auth';

const buscarReal = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = buscarReal; });

function cliente(token = 'token-ficticio') {
  const auth = { token: async () => token } as unknown as Autenticador;
  return new GraphClient(auth);
}

function json(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });
}

test('GraphClient GET envia token de usuário, caminho correto e cache desativado', async () => {
  const requisicoes: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (entrada, init) => {
    requisicoes.push({ url: String(entrada), init: init! });
    return json({ id: 'site-1' });
  }) as typeof fetch;
  assert.deepEqual(await cliente().get('/sites/exemplo'), { id: 'site-1' });
  assert.equal(requisicoes[0].url, 'https://graph.microsoft.com/v1.0/sites/exemplo');
  assert.equal((requisicoes[0].init.headers as Record<string, string>).Authorization, 'Bearer token-ficticio');
  assert.equal(requisicoes[0].init.cache, 'no-store');
});

test('GraphClient executa POST, PATCH e DELETE com corpo JSON quando necessário', async () => {
  const chamadas: { method: string; body: string | undefined; headers: Record<string, string> }[] = [];
  globalThis.fetch = (async (_, init) => {
    chamadas.push({ method: init!.method || 'GET', body: init!.body as string | undefined, headers: init!.headers as Record<string, string> });
    return chamadas.length === 3 ? new Response(null, { status: 204 }) : json({ id: '1' });
  }) as typeof fetch;
  const c = cliente();
  await c.post('/items', { nome: 'Projeto' });
  await c.patch('/items/1', { percentual: 60 });
  assert.equal(await c.excluir('/items/1'), null);
  assert.deepEqual(chamadas.map(x => x.method), ['POST', 'PATCH', 'DELETE']);
  assert.deepEqual(chamadas.slice(0, 2).map(x => JSON.parse(x.body!)), [{ nome: 'Projeto' }, { percentual: 60 }]);
  assert.ok(chamadas.slice(0, 2).every(x => x.headers['Content-Type'] === 'application/json'));
  assert.equal(chamadas[2].body, undefined);
});

test('GraphClient.todos percorre paginação sem perder ou duplicar registros', async () => {
  const paginas: string[] = [];
  globalThis.fetch = (async (entrada) => {
    const url = String(entrada);
    paginas.push(url);
    return paginas.length === 1 ? json({ value: [{ id: 1 }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/itens?$skiptoken=2' }) : json({ value: [{ id: 2 }, { id: 3 }] });
  }) as typeof fetch;
  const itens = await cliente().todos<{ id: number }>('/itens');
  assert.deepEqual(itens.map(x => x.id), [1, 2, 3]);
  assert.equal(paginas.length, 2);
  assert.equal(paginas[1], 'https://graph.microsoft.com/v1.0/itens?$skiptoken=2');
});

test('GraphClient.todos trata página sem array value como lista vazia', async () => {
  globalThis.fetch = (async () => json({})) as typeof fetch;
  assert.deepEqual(await cliente().todos('/lista-vazia'), []);
});

test('GraphClient repassa mensagem de erro do Microsoft Graph sem tratá-la como sucesso', async () => {
  globalThis.fetch = (async () => json({ error: { message: 'Acesso negado para este item.' } }, 403)) as typeof fetch;
  await assert.rejects(() => cliente().get('/sites/proibido'), /SharePoint respondeu 403: Acesso negado/);
});

test('GraphClient trata falha sem corpo JSON com status original', async () => {
  globalThis.fetch = (async () => new Response('erro do servidor', { status: 500, statusText: 'Internal Server Error' })) as typeof fetch;
  await assert.rejects(() => cliente().post('/items', {}), /SharePoint respondeu 500: Internal Server Error/);
});

test('GraphClient.baixar devolve o conteúdo binário e usa autenticação', async () => {
  const requisicoes: RequestInit[] = [];
  globalThis.fetch = (async (_, init) => {
    requisicoes.push(init!);
    return new Response(new Uint8Array([65, 66, 67]), { status: 200 });
  }) as typeof fetch;
  const blob = await cliente().baixar('/drives/teste/items/1/content');
  assert.equal(await blob.text(), 'ABC');
  assert.equal((requisicoes[0].headers as Record<string, string>).Authorization, 'Bearer token-ficticio');
});

test('GraphClient.baixar não aceita download negado pelo SharePoint', async () => {
  globalThis.fetch = (async () => new Response('Sem acesso', { status: 403 })) as typeof fetch;
  await assert.rejects(() => cliente().baixar('/drives/teste/items/1/content'), /Não foi possível baixar o arquivo \(403\)/);
});

test('fetchGraph permite desativar novas tentativas em erro 429', async () => {
  let chamadas = 0;
  globalThis.fetch = (async () => { chamadas++; return new Response(null, { status: 429 }); }) as typeof fetch;
  const resposta = await fetchGraph('https://graph.microsoft.com/v1.0/teste', {}, 0);
  assert.equal(resposta.status, 429);
  assert.equal(chamadas, 1);
});
