import type { Atividade, Dados, Gate, NovoProjeto, PastaDocumentos, Pendencia, Projeto, Risco } from '../types/models';

/**
 * Contrato entre a interface e quem guarda os dados.
 * Duas implementações: FontePiloto (navegador) e FonteSharePoint (Microsoft Graph).
 * Os métodos salvar* só gravam; o estado da tela é atualizado pelo PortalContext.
 */
export interface FonteDados {
  readonly modo: 'piloto' | 'sharepoint';
  /** login (SharePoint) — devolve o nome de quem entrou */
  entrar(): Promise<string>;
  sair(): Promise<void>;
  /** e-mail de quem entrou (vazio no piloto) */
  email(): string;
  hoje(): string;
  carregar(): Promise<Dados>;
  salvarAtividade(cod: string, atv: Atividade, campos: Partial<Atividade>): Promise<void>;
  salvarRisco(cod: string, risco: Risco, campos: Partial<Risco>): Promise<void>;
  salvarPendencia(cod: string, pend: Pendencia, campos: Partial<Pendencia>): Promise<void>;
  salvarProjeto(p: Projeto, campos: Partial<Projeto>): Promise<void>;
  salvarGate(p: Projeto, g: Gate, campos: Partial<Gate>): Promise<void>;
  criarProjeto(novo: NovoProjeto): Promise<void>;
  /** apaga o projeto e tudo que está vinculado a ele (gates, atividades, riscos, pendências, decisões) */
  excluirProjeto(d: Dados, p: Projeto, opcoes: { documentos: boolean }): Promise<void>;
  /** devolve a atividade com o _id gerado pela lista */
  criarAtividade(p: Projeto, atv: Atividade): Promise<Atividade>;
  excluirAtividade(cod: string, atv: Atividade): Promise<void>;
  /** cria o item do gate na lista e devolve com _id */
  criarGate(p: Projeto, g: Gate): Promise<Gate>;
  /** remove itens de Portal Gates pelo ID (limpeza de repetidos) */
  excluirGates?(ids: string[]): Promise<void>;
  documentos(cod: string): Promise<PastaDocumentos[]>;
  enviarArquivo(cod: string, pasta: string, arquivo: File): Promise<void>;
  linkBiblioteca(cod?: string): string;
  /** envia e-mail pela conta logada; devolve o destinatário (só no modo SharePoint) */
  enviarEmail?(assunto: string, html: string, para?: string): Promise<string>;
  /** só no piloto: grava o estado atual no navegador */
  persistir?(d: Dados): void;
  /** só no piloto: descarta as alterações locais */
  restaurar?(): void;
}
