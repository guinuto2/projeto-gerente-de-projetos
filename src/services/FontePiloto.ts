import type { Atividade, Dados, Gate, PastaDocumentos } from '../types/models';
import type { FonteDados } from './FonteDados';
import pilotoTrf1 from '../data/piloto-trf1.json';
import { PASTAS } from '../lib/constantes';

const CHAVE = 'portal-pmo-piloto-v3';
const original = pilotoTrf1 as unknown as Dados;

/** Dados do Design & Build TRF1 v2 com datas fictícias. Alterações ficam só neste navegador. */
export class FontePiloto implements FonteDados {
  readonly modo = 'piloto' as const;
  private d: Dados = structuredClone(original);

  async entrar() { return 'Modo piloto'; }
  async sair() { /* sem sessão */ }
  email() { return ''; }
  hoje() { return original.referencia; }

  async carregar(): Promise<Dados> {
    try {
      const salvo = localStorage.getItem(CHAVE);
      this.d = salvo ? (JSON.parse(salvo) as Dados) : structuredClone(original);
    } catch {
      this.d = structuredClone(original);
    }
    return this.d;
  }

  persistir(d: Dados) {
    this.d = d;
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch { /* armazenamento indisponível */ }
  }

  restaurar() {
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
