import test from 'node:test';
import assert from 'node:assert/strict';
import { FonteSharePoint } from '../../src/services/FonteSharePoint';
import { AgendaSemPermissao, PROPRIEDADE_ATIVIDADE } from '../../src/lib/agenda';
import type { PortalConfig } from '../../src/config/config';
import type { Autenticador } from '../../src/services/auth';

const cfg = { sharepointHost: 'tenant.example', sitePath: '/sites/TesteProjetos', biblioteca: 'Documentos de Projetos' } as PortalConfig;
const buscarReal = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = buscarReal; });

function fonte(opcoes: { silencioso?: string | null } = {}) {
  const pedidos: string[] = [];
  const auth = {
    email: () => 'tecnico@systech.com.br',
    tokenPara: async (escopos: string[]) => { pedidos.push('interativo:' + escopos.join(',')); return 'token-interativo'; },
    tokenSilencioso: async (escopos: string[]) => { pedidos.push('silencioso:' + escopos.join(',')); return opcoes.silencioso === undefined ? 'token-silencioso' : opcoes.silencioso; },
  } as unknown as Autenticador;
  return { f: new FonteSharePoint(cfg, auth), pedidos };
}
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });
const evGraph = (id: string, extra: Record<string, unknown> = {}) => ({
  id, subject: 'Compromisso ' + id, isAllDay: false, start: { dateTime: '2026-11-16T09:00:00.0000000' }, end: { dateTime: '2026-11-16T10:00:00.0000000' }, ...extra,
});

test('agenda: lê o calendarView no fuso de Brasília, sem janela de permissão, e marca os compromissos do portal', async () => {
  const chamadas: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url, init) => {
    chamadas.push({ url: String(url), init: init! });
    if (chamadas.length === 1) return json({ value: [
      evGraph('a', { location: { displayName: 'Sala 2' }, onlineMeeting: { joinUrl: 'https://teams.exemplo/entrar' }, webLink: 'https://outlook.exemplo/a' }),
      evGraph('b', { isCancelled: true }),
      evGraph('c', { singleValueExtendedProperties: [{ id: PROPRIEDADE_ATIVIDADE, value: 'TRF1-VCF|3.1.1' }] }),
    ], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/calendarView?pagina=2' });
    return json({ value: [evGraph('d', { isAllDay: true, start: { dateTime: '2026-11-17T00:00:00.0000000' }, end: { dateTime: '2026-11-18T00:00:00.0000000' } })] });
  }) as typeof fetch;
  const { f, pedidos } = fonte();
  const eventos = await f.agenda('2026-11-16', '2026-11-22', false);
  assert.deepEqual(pedidos, ['silencioso:Calendars.ReadWrite'], 'a leitura automática não abre janela');
  const u = new URL(chamadas[0].url);
  assert.equal(u.pathname, '/v1.0/me/calendarView');
  assert.equal(u.searchParams.get('startDateTime'), '2026-11-16T00:00:00-03:00');
  assert.equal(u.searchParams.get('endDateTime'), '2026-11-23T00:00:00-03:00', 'o último dia pedido entra inteiro');
  assert.match(u.searchParams.get('$expand') || '', /singleValueExtendedProperties/);
  const cab = chamadas[0].init.headers as Record<string, string>;
  assert.equal(cab.Authorization, 'Bearer token-silencioso');
  assert.equal(cab.Prefer, 'outlook.timezone="E. South America Standard Time"');
  assert.equal(chamadas[1].url, 'https://graph.microsoft.com/v1.0/me/calendarView?pagina=2', 'segue as páginas');
  assert.deepEqual(eventos.map(e => e.id), ['a', 'c', 'd'], 'compromissos cancelados ficam de fora');
  assert.deepEqual(eventos[0], { id: 'a', titulo: 'Compromisso a', inicio: '2026-11-16T09:00:00', fim: '2026-11-16T10:00:00', diaInteiro: false,
    local: 'Sala 2', link: 'https://outlook.exemplo/a', linkTeams: 'https://teams.exemplo/entrar', atividade: undefined });
  assert.equal(eventos[1].atividade, 'TRF1-VCF|3.1.1');
  assert.equal(eventos[2].diaInteiro, true);
});

test('agenda: sem permissão de calendário, avisa para conectar (sem token silencioso ou com 403)', async () => {
  globalThis.fetch = (async () => { throw new Error('não deveria chamar o Graph'); }) as typeof fetch;
  await assert.rejects(fonte({ silencioso: null }).f.agenda('2026-11-16', '2026-11-16', false), AgendaSemPermissao);
  globalThis.fetch = (async () => json({ error: { message: 'Forbidden' } }, 403)) as typeof fetch;
  await assert.rejects(fonte().f.agenda('2026-11-16', '2026-11-16', false), AgendaSemPermissao);
});

test('agenda: "Conectar agenda" usa o token interativo (com janela de consentimento)', async () => {
  globalThis.fetch = (async () => json({ value: [] })) as typeof fetch;
  const { f, pedidos } = fonte({ silencioso: null });
  assert.deepEqual(await f.agenda('2026-11-16', '2026-11-16', true), []);
  assert.deepEqual(pedidos, ['interativo:Calendars.ReadWrite']);
});

test('agenda: acha o compromisso da atividade pela etiqueta invisível, sem janela', async () => {
  let url = '';
  globalThis.fetch = (async (u) => { url = String(u); return json({ value: [evGraph('x', { isCancelled: true }), evGraph('y')] }); }) as typeof fetch;
  const { f, pedidos } = fonte();
  const e = await f.eventoDaAtividade("TRF1|O'Brien", false);
  assert.equal(e?.id, 'y', 'ignora compromisso cancelado');
  assert.deepEqual(pedidos, ['silencioso:Calendars.ReadWrite']);
  const filtro = new URL(url).searchParams.get('$filter') || '';
  assert.match(filtro, new RegExp(`ep/id eq '${PROPRIEDADE_ATIVIDADE.replace(/[{}]/g, '\\$&')}'`));
  assert.match(filtro, /ep\/value eq 'TRF1\|O''Brien'/, 'aspas simples escapadas no filtro');
});

test('agenda: cria o compromisso quando a atividade ainda não está na agenda', async () => {
  const chamadas: { metodo: string; url: string; corpo?: unknown }[] = [];
  globalThis.fetch = (async (u, init) => {
    chamadas.push({ metodo: init!.method || 'GET', url: String(u), corpo: init!.body ? JSON.parse(String(init!.body)) : undefined });
    return json(evGraph('novo'), 201);
  }) as typeof fetch;
  const e = await fonte().f.salvarEventoAtividade({ subject: 'X' });
  assert.equal(e.id, 'novo');
  assert.deepEqual(chamadas.map(c => `${c.metodo} ${new URL(c.url).pathname}`), ['POST /v1.0/me/events']);
  assert.deepEqual(chamadas[0].corpo, { subject: 'X' });
});

test('agenda: atualiza o compromisso que já existe (PATCH) e relê o resultado', async () => {
  const chamadas: string[] = [];
  globalThis.fetch = (async (u, init) => {
    chamadas.push(`${init!.method || 'GET'} ${new URL(String(u)).pathname}`);
    return init!.method === 'PATCH' ? new Response(null, { status: 204 }) : json(evGraph('existente', { subject: 'Atualizado' }));
  }) as typeof fetch;
  const e = await fonte().f.salvarEventoAtividade({ subject: 'Atualizado' }, 'existente');
  assert.deepEqual(chamadas, ['PATCH /v1.0/me/events/existente', 'GET /v1.0/me/events/existente']);
  assert.equal(e.titulo, 'Atualizado');
});

test('agenda: se o compromisso foi apagado no Outlook, cria de novo', async () => {
  const chamadas: string[] = [];
  globalThis.fetch = (async (u, init) => {
    chamadas.push(`${init!.method || 'GET'} ${new URL(String(u)).pathname}`);
    return init!.method === 'PATCH' ? json({ error: { message: 'not found' } }, 404) : json(evGraph('recriado'), 201);
  }) as typeof fetch;
  const e = await fonte().f.salvarEventoAtividade({ subject: 'X' }, 'apagado');
  assert.deepEqual(chamadas, ['PATCH /v1.0/me/events/apagado', 'POST /v1.0/me/events']);
  assert.equal(e.id, 'recriado');
});
