import type { Autenticador } from './auth';

const GRAPH = 'https://graph.microsoft.com/v1.0';

interface Pagina<T> { value?: T[]; '@odata.nextLink'?: string }

/** Cliente mínimo do Microsoft Graph com token do MSAL. */
export class GraphClient {
  constructor(private auth: Autenticador) { }

  async pedir<T>(caminho: string, opcoes: { method?: string; json?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
    const url = caminho.startsWith('http') ? caminho : GRAPH + caminho;
    const headers: Record<string, string> = { Authorization: 'Bearer ' + await this.auth.token(), ...(opcoes.headers || {}) };
    let body: string | undefined;
    if (opcoes.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opcoes.json); }
    const r = await fetch(url, { method: opcoes.method || 'GET', headers, body, cache: 'no-store' });
    if (!r.ok) {
      let msg = r.statusText;
      try { const j = await r.json(); msg = j?.error?.message || msg; } catch { /* sem corpo */ }
      throw new Error(`SharePoint respondeu ${r.status}: ${msg}`);
    }
    return (r.status === 204 ? null : await r.json()) as T;
  }

  /** Segue a paginação (@odata.nextLink) e junta todos os itens. */
  async todos<T>(caminho: string): Promise<T[]> {
    let url: string | undefined = caminho;
    let itens: T[] = [];
    while (url) {
      const r: Pagina<T> = await this.pedir<Pagina<T>>(url);
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
      const r = await fetch(sessao.uploadUrl, { method: 'PUT', headers: { 'Content-Range': `bytes ${ini}-${fim - 1}/${arquivo.size}` }, body: arquivo.slice(ini, fim) });
      if (!r.ok && r.status !== 202) throw new Error(`Falha no envio do arquivo (${r.status}).`);
    }
  }
}
