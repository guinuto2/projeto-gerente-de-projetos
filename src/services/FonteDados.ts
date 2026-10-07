import type { Arquivo, Atividade, Dados, Gate, NovaReuniao, NovoProjeto, PastaDocumentos, Pendencia, Projeto, RegistroHistorico, Risco } from '../types/models';

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
  /** grava um registro no histórico (não falha a ação se não conseguir) */
  registrar(r: RegistroHistorico): Promise<void>;
  /** histórico do projeto, do mais recente para o mais antigo */
  historico(cod: string): Promise<RegistroHistorico[]>;
  /** exclui um arquivo da biblioteca (vai para a lixeira) */
  excluirArquivo?(cod: string, pasta: string, arquivo: Arquivo): Promise<void>;
  criarRisco(p: Projeto, r: Risco): Promise<Risco>;
  excluirRisco(cod: string, r: Risco): Promise<void>;
  criarPendencia(p: Projeto, x: Pendencia): Promise<Pendencia>;
  excluirPendencia(cod: string, x: Pendencia): Promise<void>;
  /** pastas na raiz da biblioteca que não correspondem a nenhum projeto (sobras de exclusões) */
  pastasSemProjeto?(codigos: string[]): Promise<{ nome: string; url: string }[]>;
  /** manda a pasta para a lixeira do site */
  excluirPasta?(nome: string): Promise<void>;
  /** cria o item do gate na lista e devolve com _id */
  criarGate(p: Projeto, g: Gate): Promise<Gate>;
  /** remove itens de Portal Gates pelo ID (limpeza de repetidos) */
  excluirGates?(ids: string[]): Promise<void>;
  documentos(cod: string): Promise<PastaDocumentos[]>;
  enviarArquivo(cod: string, pasta: string, arquivo: File): Promise<void>;
  linkBiblioteca(cod?: string): string;
  /** cria um evento com reunião do Teams no calendário de quem está logado e envia os convites */
  criarReuniaoTeams?(r: NovaReuniao, corpoHtml: string): Promise<{ id: string; joinUrl: string }>;
  /** lê a reunião (para editar) */
  obterReuniaoTeams?(id: string): Promise<NovaReuniao>;
  /** altera a reunião; o Outlook manda a atualização aos convidados */
  atualizarReuniaoTeams?(id: string, r: NovaReuniao, corpoHtml: string): Promise<void>;
  /** cancela a reunião; o Outlook manda o cancelamento aos convidados */
  cancelarReuniaoTeams?(id: string, mensagem: string): Promise<void>;
  /** horário atual das reuniões no calendário de quem está logado (só as que ele organiza); id → início 'aaaa-mm-ddThh:mm' */
  lerReunioes?(ids: string[]): Promise<Record<string, string>>;
  /** false quando a lista Portal Atividades ainda não tem as colunas da reunião (rodar o script) */
  reuniaoGravavel?(): boolean;
  /** envia e-mail pela conta logada; devolve o destinatário (só no modo SharePoint) */
  enviarEmail?(assunto: string, html: string, para?: string): Promise<string>;
  /** só no piloto: grava o estado atual no navegador */
  persistir?(d: Dados): void;
  /** só no piloto: descarta as alterações locais */
  restaurar?(): void;
}
