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
  /** e-mails das pessoas que já têm acesso ao site no SharePoint (lista oculta "User Information List"); null se não der para ler */
  usuariosDoSite?(): Promise<Set<string> | null>;
  /** avisos do sino para um e-mail (mais recentes primeiro); null se a lista "Portal Notificacoes" não existe */
  notificacoes?(email: string): Promise<import('../types/models').Notificacao[] | null>;
  /** cria avisos (um por destinatário) */
  criarNotificacoes?(itens: Omit<import('../types/models').Notificacao, 'id' | 'quando' | 'lida'>[]): Promise<void>;
  /** marca avisos como lidos */
  marcarNotificacoesLidas?(ids: string[]): Promise<void>;
  /** modelos de projeto salvos (null se a lista "Portal Modelos" não existe) */
  modelos?(): Promise<import('../lib/modelos').ModeloProjeto[] | null>;
  /** grava (cria ou substitui) um modelo de projeto */
  salvarModelo?(m: import('../lib/modelos').ModeloProjeto): Promise<void>;
  /** exclui um modelo de projeto */
  excluirModelo?(id: string): Promise<void>;
  /** publica, na pasta de cada órgão da biblioteca "Portal Clientes", a cópia dos projetos que o cliente pode ver; devolve quantos mudaram */
  publicarParaClientes?(d: import('../types/models').Dados): Promise<number>;
  /** cliente: lê só a pasta do órgão dele na biblioteca "Portal Clientes" (sem acesso às listas do site) */
  carregarCliente?(): Promise<import('../types/models').Dados>;
  /** true quando quem está logado é um cliente (de fora da Systech) lendo só a pasta do órgão */
  modoCliente?: boolean;
  /** documentos da Wiki editados pelos técnicos (null se a lista "Portal Wiki" ainda não existe) */
  wikiDocs?(): Promise<import('../lib/wiki').ModeloSalvo[] | null>;
  /** grava (cria ou substitui) um documento da Wiki */
  salvarWikiDoc?(d: import('../lib/wiki').ModeloSalvo): Promise<void>;
  /** arquivos da biblioteca "Wiki Tecnicos" (null se a biblioteca ainda não existe) */
  arquivosWiki?(): Promise<{ id: string; nome: string; tamanho: number; url: string; modificado: string; descricao?: string }[] | null>;
  /** envia (ou substitui) um arquivo na biblioteca "Wiki Tecnicos", com uma descrição opcional */
  enviarArquivoWiki?(arquivo: File, descricao: string, pasta?: string): Promise<void>;
  /** documentos de comprovação para editais de cada fabricante (pasta Comprovacoes/<id> da biblioteca Wiki Tecnicos) */
  comprovacoesWiki?(ids: string[]): Promise<Record<string, { id: string; nome: string; tamanho: number; url: string; modificado: string; descricao?: string; pasta: string; tipo: 'arquivo' | 'pasta'; qtd?: number }[]> | null>;
  /** cria uma pasta (e as anteriores do caminho) na biblioteca Wiki Tecnicos */
  criarPastaWiki?(caminho: string): Promise<void>;
  /** renomeia um arquivo ou pasta da biblioteca Wiki Tecnicos */
  renomearItemWiki?(id: string, novoNome: string): Promise<void>;
  /** exclui um arquivo ou pasta da biblioteca Wiki Tecnicos (vai para a lixeira do SharePoint) */
  excluirItemWiki?(id: string): Promise<void>;
  /** altera a descrição de um arquivo da biblioteca Wiki Tecnicos */
  descreverItemWiki?(id: string, descricao: string): Promise<void>;
  /** conteúdo de um arquivo da biblioteca da Wiki, para baixar */
  baixarArquivoWiki?(id: string): Promise<Blob>;
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
  /** funções (App Roles) do Entra ID de quem entrou; ausente no piloto */
  papeis?(): string[];
  /** horário atual das reuniões no calendário de quem está logado (só as que ele organiza); id → início 'aaaa-mm-ddThh:mm' */
  lerReunioes?(ids: string[]): Promise<Record<string, string>>;
  /** false quando a lista Portal Atividades ainda não tem as colunas da reunião (rodar o script) */
  reuniaoGravavel?(): boolean;
  /** false quando Portal Atividades ainda não tem as colunas Lancada/Predecessoras (rodar o script) */
  tarefasGravaveis?(): boolean;
  /** envia e-mail pela conta logada; devolve o destinatário (só no modo SharePoint) */
  enviarEmail?(assunto: string, html: string, para?: string): Promise<string>;
  /** só no piloto: grava o estado atual no navegador */
  persistir?(d: Dados): void;
  /** só no piloto: descarta as alterações locais */
  restaurar?(): void;
}
