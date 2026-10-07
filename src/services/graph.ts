import type { Autenticador } from './auth';

const GRAPH = 'https://graph.microsoft.com/v1.0';

interface Pagina<T> { value?: T[]; '@odata.nextLink'?: string }

/**
 * Limite do Microsoft 365 (429 "throttled"): quando o SharePoint pede para esperar, TODAS as chamadas do portal
 * aguardam juntas (pausa global) e a chamada é repetida — respeitando o Retry-After ou, sem ele, 1 s, 2 s, 4 s…
 */
let pausaAte = 0;
const dormir = (ms: number) => new Promise(r => setTimeout(r, ms));
export async function fetchGraph(url: string, init: RequestInit, tentativas = 5): Promise<Response> {
  for (let n = 0; ; n++) {
    const espera = pausaAte - Date.now();
    if (espera > 0) await dormir(espera);
    const r = await fetch(url, init);
    if ((r.status === 429 || r.status === 503 || r.status === 504) && n < tentativas) {
      const ra = Number(r.headers.get('Retry-After'));
      const ms = (Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(30000, 1000 * 2 ** n)) + Math.random() * 400;
      pausaAte = Math.max(pausaAte, Date.now() + ms);
      continue;
    }
    return r;
  }
}

/** Cliente mínimo do Microsoft Graph com token do MSAL. */
export class GraphClient {
  constructor(private auth: Autenticador) { }

  async pedir<T>(caminho: string, opcoes: { method?: string; json?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
    const url = caminho.startsWith('http') ? caminho : GRAPH + caminho;
    const headers: Record<string, string> = { Authorization: 'Bearer ' + await this.auth.token(), ...(opcoes.headers || {}) };
    let body: string | undefined;
    if (opcoes.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opcoes.json); }
    const r = await fetchGraph(url, { method: opcoes.method || 'GET', headers, body, cache: 'no-store' });
    if (!r.ok) {
      if (r.status === 429) throw new Error('O SharePoint está limitando o acesso (muitas requisições em pouco tempo). Aguarde um minuto e tente de novo.');
      let msg = r.statusText;
      try { const j = await r.json(); msg = j?.error?.message || msg; } catch { /* sem corpo */ }
      throw new Error(`SharePoint respondeu ${r.status}: ${msg}`);
    }
    return (r.status === 204 ? null : await r.json()) as T;
  }

  /** Segue a paginação (@odata.nextLink) e junta todos os itens. */
  async todos<T>(caminho: string, headers?: Record<string, string>): Promise<T[]> {
    let url: string | undefined = caminho;
    let itens: T[] = [];
    while (url) {
      const r: Pagina<T> = await this.pedir<Pagina<T>>(url, { headers });
      itens = itens.concat(r.value || []);
      url = r['@odata.nextLink'];
    }
    return itens;
  }

  get<T>(c: string) { return this.pedir<T>(c); }
  post<T>(c: string, json: unknown) { return this.pedir<T>(c, { method: 'POST', json }); }
  patch<T>(c: string, json: unknown) { return this.pedir<T>(c, { method: 'PATCH', json }); }
  excluir(c: string) { return this.pedir<null>(c, { method: 'DELETE' }); }

  /** Upload em blocos (sessão de upload) — aceita arquivos grandes. */
  async enviar(caminhoDrive: string, arquivo: File): Promise<void> {
    const sessao = await this.post<{ uploadUrl: string }>(`${caminhoDrive}:/createUploadSession`, { item: { '@microsoft.graph.conflictBehavior': 'rename' } });
    const bloco = 327680 * 20; // múltiplo de 320 KiB
    for (let ini = 0; ini < arquivo.size; ini += bloco) {
      const fim = Math.min(ini + bloco, arquivo.size);
      const r = await fetchGraph(sessao.uploadUrl, { method: 'PUT', headers: { 'Content-Range': `bytes ${ini}-${fim - 1}/${arquivo.size}` }, body: arquivo.slice(ini, fim) });
      if (!r.ok && r.status !== 202) throw new Error(`Falha no envio do arquivo (${r.status}).`);
    }
  }
}
