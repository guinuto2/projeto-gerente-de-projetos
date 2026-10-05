export type Fase = 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento';
export type EstadoFase = 'Concluída' | 'Em andamento' | 'Não iniciada';
export type StatusAtividade = 'Planejado' | 'Em andamento' | 'Bloqueado' | 'Concluído' | 'Cancelado';
export type Nivel = 'Baixo' | 'Médio' | 'Alto';
export type SituacaoRisco = 'Aberto' | 'Em tratamento' | 'Mitigado' | 'Fechado';
export type SituacaoGate = 'Pendente' | 'Aguardando aprovação' | 'Aprovado' | '';
export type SituacaoCadastro = 'Rascunho' | 'Em aprovação' | 'Ativo' | 'Encerrado';

/** _id é o ID do item na lista do SharePoint (ausente no modo piloto). */
export interface Gate {
  _id?: string;
  fase: Fase;
  gate: string;
  nome: string;
  situacao: SituacaoGate;
  data: string;
  info: string;
  /** preenchidos na decisão do gate */
  aprovadoPor?: string;
  dataAprovacao?: string;
  parecer?: string;
}

export interface MembroEquipe { nome: string; funcao: string; empresa: string; email: string }

/** Técnico da Systech (lista Portal Tecnicos). */
export interface Tecnico { _id?: string; nome: string; email: string; funcao: string; ativo: boolean }

export interface Numeros {
  localidades: number; hosts: number; clusters: number; hostsMover: number;
  vmsImpactadas: number; janelas: string; diasSystech: number; diasTRF1: number;
}

export interface Projeto {
  _id?: string;
  codigo: string;
  nome: string;
  cliente: string;
  tipo: string;
  fase: Fase;
  farol: 'Verde' | 'Amarelo' | 'Vermelho';
  situacaoCadastro: SituacaoCadastro;
  gerente: string;
  arquiteto: string;
  patrocinador: string;
  contrato: string;
  inicio: string;
  terminoBaseline: string;
  terminoPrevisto: string;
  objetivo: string;
  escopoIncluido: string[];
  escopoExcluido: string[];
  premissas: string[];
  dependencias: string[];
  restricoes: string[];
  numeros: Numeros | null;
  equipe: MembroEquipe[];
  fases: Gate[];
  /** itens repetidos em Portal Gates (mesmo projeto e mesmo gate) — o portal oferece remover */
  gatesRepetidos?: string[];
}

export interface Atividade {
  _id?: string;
  codigo: string;
  nome: string;
  fase: Fase;
  equipe: string;
  duracao: number;
  descricao: string;
  marco: boolean;
  inicio: string;
  termino: string;
  baselineInicio: string;
  baselineTermino: string;
  status: StatusAtividade;
  percentual: number;
  /** código da atividade macro, quando é subatividade */
  pai: string;
  observacao: string;
  /** reunião do Teams ligada à atividade (link para entrar, início local 'aaaa-mm-ddThh:mm', id do evento) */
  reuniaoUrl?: string;
  reuniaoInicio?: string;
  reuniaoId?: string;
  /** Implementação, Alinhamento, Interna ou Execução */
  reuniaoTipo?: string;
}

/** Dados para criar uma reunião do Teams a partir de uma atividade. */
export interface NovaReuniao {
  /** tipo de reunião (Implementação, Alinhamento, Interna, Execução) */
  tipo?: string;
  titulo: string;
  /** início local, 'aaaa-mm-ddThh:mm' (horário de Brasília) */
  inicio: string;
  duracaoMin: number;
  pauta: string;
  participantes: string[];
}

export interface Risco {
  _id?: string;
  codigo: string;
  descricao: string;
  impactoProjeto: string;
  cenarios: string;
  probabilidade: Nivel;
  impacto: Nivel;
  mitigacao: string;
  contingencia: string;
  responsavel: string;
  situacao: SituacaoRisco;
}

export interface Pendencia {
  _id?: string;
  codigo: string;
  pergunta: string;
  detalhe: string;
  impacto: string;
  situacao: 'Aberta' | 'Respondida';
  resposta?: string;
}

export interface Decisao { _id?: string; codigo: string; decisao: string; descricao: string; justificativa: string; impacto: string }

export interface Arquivo { nome: string; url: string; modificado: string; autor: string; fase?: string }
export interface PastaDocumentos { pasta: string; url: string; arquivos: Arquivo[] }

/** Tudo que o portal carrega de uma vez. Listas indexadas pelo código do projeto. */
export interface Dados {
  referencia: string;
  projetos: Projeto[];
  atividades: Record<string, Atividade[]>;
  riscos: Record<string, Risco[]>;
  pendencias: Record<string, Pendencia[]>;
  decisoes: Record<string, Decisao[]>;
  documentos: Record<string, Arquivo[]>;
  /** técnicos da Systech (lista Portal Tecnicos) */
  tecnicos: Tecnico[];
}

export interface NovoProjeto { projeto: Projeto; atividades: Atividade[]; riscos: Risco[] }
