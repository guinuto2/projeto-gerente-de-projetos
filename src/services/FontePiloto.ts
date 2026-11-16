import type { Atividade, Dados, Gate, PastaDocumentos, Pendencia, RegistroHistorico, Risco } from '../types/models';
import type { FonteDados } from './FonteDados';
import pilotoTrf1 from '../data/piloto-trf1.json';
import { PASTAS, normalizarTipo } from '../lib/constantes';
import { TECNICOS_PADRAO } from '../lib/pessoas';
import { config } from '../config/config';
import { PROPRIEDADE_ATIVIDADE, type EventoAgenda } from '../lib/agenda';
import { somarDiasCorridos } from '../lib/datas';

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
  /* ---------- agenda simulada: alguns compromissos de exemplo + os adicionados (ficam neste navegador) ---------- */
  private lerAgenda(): EventoAgenda[] {
    try { const s = localStorage.getItem('portal-pmo-agenda-piloto'); if (s) return JSON.parse(s) as EventoAgenda[]; } catch { /* sem armazenamento */ }
    const h = this.hoje(), amanha = somarDiasCorridos(h, 1);
    return [
      { id: 'p1', titulo: 'Daily do time de infraestrutura', inicio: `${h}T09:00:00`, fim: `${h}T09:30:00`, diaInteiro: false, linkTeams: 'https://teams.microsoft.com/' },
      { id: 'p2', titulo: 'Reunião de acompanhamento com o cliente', inicio: `${h}T14:00:00`, fim: `${h}T15:00:00`, diaInteiro: false, local: 'Microsoft Teams', linkTeams: 'https://teams.microsoft.com/' },
      { id: 'p3', titulo: 'Revisão da arquitetura', inicio: `${amanha}T10:00:00`, fim: `${amanha}T11:30:00`, diaInteiro: false },
      { id: 'p4', titulo: 'Janela de manutenção', inicio: `${somarDiasCorridos(h, 3)}T00:00:00`, fim: `${somarDiasCorridos(h, 4)}T00:00:00`, diaInteiro: true },
    ];
  }
  private gravarAgenda(l: EventoAgenda[]) { try { localStorage.setItem('portal-pmo-agenda-piloto', JSON.stringify(l)); } catch { /* sem armazenamento */ } }
  async agenda(de: string, ate: string): Promise<EventoAgenda[]> {
    return this.lerAgenda().filter(e => e.inicio.slice(0, 10) <= ate && (e.diaInteiro ? somarDiasCorridos(e.fim.slice(0, 10), -1) : e.fim.slice(0, 10)) >= de)
      .sort((x, y) => x.inicio.localeCompare(y.inicio));
  }
  async eventoDaAtividade(chave: string, _interativo?: boolean): Promise<EventoAgenda | null> {
    return this.lerAgenda().find(e => e.atividade === chave) || null;
  }
  async salvarEventoAtividade(corpo: Record<string, unknown>, idExistente?: string): Promise<EventoAgenda> {
    const c = corpo as { subject: string; isAllDay: boolean; start: { dateTime: string }; end: { dateTime: string }; singleValueExtendedProperties?: { id: string; value: string }[] };
    const l = this.lerAgenda();
    const ev: EventoAgenda = {
      id: idExistente && l.some(e => e.id === idExistente) ? idExistente : `piloto-${Date.now()}`,
      titulo: c.subject, inicio: c.start.dateTime.slice(0, 19), fim: c.end.dateTime.slice(0, 19), diaInteiro: !!c.isAllDay,
      atividade: c.singleValueExtendedProperties?.find(p => p.id === PROPRIEDADE_ATIVIDADE)?.value,
    };
    this.gravarAgenda([...l.filter(e => e.id !== ev.id), ev]);
    return ev;
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
