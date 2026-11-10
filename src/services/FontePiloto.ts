import type { Atividade, Dados, Gate, PastaDocumentos, Pendencia, RegistroHistorico, Risco } from '../types/models';
import type { FonteDados } from './FonteDados';
import pilotoTrf1 from '../data/piloto-trf1.json';
import { PASTAS, normalizarTipo } from '../lib/constantes';
import { TECNICOS_PADRAO } from '../lib/pessoas';
import { config } from '../config/config';

const CHAVE = 'portal-pmo-piloto-v3';
const original = pilotoTrf1 as unknown as Dados;

/** Dados do Design & Build TRF1 v2 com datas fictícias. Alterações ficam só neste navegador. */
export class FontePiloto implements FonteDados {
  readonly modo = 'piloto' as const;
  private d: Dados = structuredClone(original);

  async entrar() { return 'Modo piloto'; }
  async sair() { /* sem sessão */ }
  email() { return ''; }
  hoje() { return /^\d{4}-\d{2}-\d{2}$/.test(config.dataSimulada || '') ? config.dataSimulada : original.referencia; }

  async carregar(): Promise<Dados> {
    try {
      const salvo = localStorage.getItem(CHAVE);
      this.d = salvo ? (JSON.parse(salvo) as Dados) : structuredClone(original);
    } catch {
      this.d = structuredClone(original);
    }
    this.d.projetos = this.d.projetos.map(p => ({ ...p, tipo: normalizarTipo(p.tipo) }));
    if (!this.d.tecnicos || !this.d.tecnicos.length) this.d.tecnicos = TECNICOS_PADRAO.map(t => ({ ...t }));
    return this.d;
  }

  persistir(d: Dados) {
    this.d = d;
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch { /* armazenamento indisponível */ }
  }

  restaurar() {
    try { localStorage.removeItem('portal-pmo-historico-v1'); } catch { /* */ }
    try { localStorage.removeItem(CHAVE); } catch { /* nada a fazer */ }
  }

  // No piloto a gravação acontece em persistir(), chamado pelo contexto após cada alteração.
  async salvarAtividade() { /* em memória */ }
  async salvarRisco() { /* em memória */ }
  async salvarPendencia() { /* em memória */ }
  async salvarProjeto() { /* em memória */ }
  async salvarGate() { /* em memória */ }
  async criarProjeto() { /* em memória */ }
  async excluirProjeto() { /* em memória */ }
  async criarAtividade(_p: unknown, atv: Atividade) { return atv; }
  async excluirAtividade() { /* em memória */ }
  async modelos() {
    try { return JSON.parse(localStorage.getItem('portal-pmo-modelos') || '[]'); } catch { return []; }
  }
  async salvarModelo(m: import('../lib/modelos').ModeloProjeto) {
    const l = (await this.modelos()).filter((x: { id: string }) => x.id !== m.id);
    localStorage.setItem('portal-pmo-modelos', JSON.stringify([...l, { ...m, atualizado: new Date().toISOString(), atualizadoPor: 'Modo piloto' }]));
  }
  async excluirModelo(id: string) {
    localStorage.setItem('portal-pmo-modelos', JSON.stringify((await this.modelos()).filter((x: { id: string }) => x.id !== id)));
  }
  async notificacoes(email: string) {
    try { return (JSON.parse(localStorage.getItem('portal-pmo-notificacoes') || '[]') as import('../types/models').Notificacao[]).filter(n => !email || n.para === email.toLowerCase() || n.para === '*'); } catch { return []; }
  }
  async criarNotificacoes(itens: { para: string; titulo: string; texto: string; link: string; tipo: string }[]) {
    const l = await this.notificacoes('');
    const novos = itens.map((n, i) => ({ ...n, para: '*', id: `n${Date.now()}${i}`, quando: new Date().toISOString(), lida: false }));   // piloto: todos veem
    localStorage.setItem('portal-pmo-notificacoes', JSON.stringify([...novos, ...l].slice(0, 100)));
  }
  async marcarNotificacoesLidas(ids: string[]) {
    const l = (await this.notificacoes('')).map(n => (ids.includes(n.id) ? { ...n, lida: true } : n));
    localStorage.setItem('portal-pmo-notificacoes', JSON.stringify(l));
  }
  async wikiDocs() {
    try { return JSON.parse(localStorage.getItem('portal-pmo-wiki-docs') || '[]'); } catch { return []; }
  }
  async salvarWikiDoc(d: import('../lib/wiki').ModeloSalvo) {
    const l = (await this.wikiDocs()).filter((x: { id: string }) => x.id !== d.id);
    localStorage.setItem('portal-pmo-wiki-docs', JSON.stringify([...l, { ...d, atualizado: new Date().toISOString(), atualizadoPor: 'Modo piloto' }]));
  }
  async registrar(r: RegistroHistorico) {
    try {
      const lista = JSON.parse(localStorage.getItem('portal-pmo-historico-v1') || '[]') as RegistroHistorico[];
      lista.push(r); localStorage.setItem('portal-pmo-historico-v1', JSON.stringify(lista.slice(-2000)));
    } catch { /* sem armazenamento */ }
  }
  async historico(cod: string) {
    try {
      return (JSON.parse(localStorage.getItem('portal-pmo-historico-v1') || '[]') as RegistroHistorico[])
        .filter(r => r.projeto === cod).sort((a, b) => b.quando.localeCompare(a.quando));
    } catch { return []; }
  }
  async criarRisco(_p: unknown, r: Risco) { return r; }
  async excluirRisco() { /* em memória */ }
  async criarPendencia(_p: unknown, x: Pendencia) { return x; }
  async excluirPendencia() { /* em memória */ }
  async criarGate(_p: unknown, g: Gate) { return g; }

  async documentos(cod: string): Promise<PastaDocumentos[]> {
    const lista = this.d.documentos[cod] || [];
    return PASTAS.map(p => ({ pasta: p, url: '', arquivos: lista.filter(a => a.fase === p).map(a => ({ ...a, url: '' })) }));
  }

  async enviarArquivo(): Promise<void> {
    throw new Error('O envio de arquivos funciona quando o portal está conectado ao SharePoint.');
  }

  linkBiblioteca() { return ''; }
}
