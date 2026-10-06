import type { Fase, Nivel, SituacaoRisco, StatusAtividade } from '../types/models';

export const FASES: Fase[] = ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento'];
export const ABREV_FASE = ['Inic.', 'Plan.', 'Exec.', 'Monit.', 'Encer.'];
export const PASTAS = ['01 · Iniciação', '02 · Planejamento', '03 · Execução', '04 · Monitoramento e controle', '05 · Encerramento'];
export const STATUS_ATIVIDADE: StatusAtividade[] = ['Planejado', 'Em andamento', 'Bloqueado', 'Concluído', 'Cancelado'];
export const NIVEIS: Nivel[] = ['Baixo', 'Médio', 'Alto'];
export const SITUACOES_RISCO: SituacaoRisco[] = ['Aberto', 'Em tratamento', 'Mitigado', 'Fechado'];
export const TIPOS_PROJETO = ['VMware', 'Omnissa', 'Client', 'Storage', 'Servidores', 'Backup', 'Rede'];

/** Nomes antigos de tipo gravados nas listas → nome atual. */
export const normalizarTipo = (t: string): string => (/^vmware\s*\/\s*euc$/i.test((t || '').trim()) ? 'VMware' : t);

export type Cores = [fundo: string, texto: string];

export const SELO_FAROL: Record<string, Cores> = { Verde: ['#D7F0E3', '#145C3C'], Amarelo: ['#FFE8A8', '#5C3D00'], Vermelho: ['#FBE3DC', '#9A2E12'] };
export const COR_FAROL: Record<string, string> = { Verde: '#1F8A5B', Amarelo: '#D69E2E', Vermelho: '#C0392B' };
export const SELO_STATUS: Record<string, Cores> = {
  'Concluído': ['#D7F0E3', '#145C3C'], 'Em andamento': ['#FFF1D1', '#7A5200'], 'Planejado': ['#EEF0F3', '#3C4757'],
  'Bloqueado': ['#FBE3DC', '#9A2E12'], 'Cancelado': ['#EEF0F3', '#8A94A3'], 'A confirmar': ['#E8EEF7', '#2B4C7E']
};
export const SELO_RISCO: Record<string, Cores> = {
  'Aberto': ['#FBE3DC', '#9A2E12'], 'Em tratamento': ['#FFF1D1', '#7A5200'], 'Mitigado': ['#D7F0E3', '#145C3C'], 'Fechado': ['#EEF0F3', '#3C4757']
};
export const SELO_PENDENCIA: Record<string, Cores> = { 'Aberta': ['#FFF1D1', '#7A5200'], 'Respondida': ['#D7F0E3', '#145C3C'] };
export const GATE_COR: Record<string, string> = { 'Aprovado': '#7E181C', 'Aguardando aprovação': '#D69E2E', 'Pendente': '#A3A6AB' };
export const GATE_CAIXA: Record<string, string> = { 'Aprovado': '#F6E9EA', 'Aguardando aprovação': '#FFF4DB', 'Pendente': '#F3F3F4' };
export const COR_EXTENSAO: Record<string, string> = { docx: '#2B579A', doc: '#2B579A', xlsx: '#217346', xls: '#217346', pptx: '#B7472A', pdf: '#C0392B', vsdx: '#3955A3' };

/** Ordena códigos como DA-A2 < DA-A10 (ordem numérica). */
export const porCodigo = (a: { codigo: string }, b: { codigo: string }) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true });

/** classe visual da equipe: s = Systech, c = cliente, a = ambos */
export function classeEquipe(equipe: string): 's' | 'c' | 'a' {
  if (/systech/i.test(equipe) && /( e |\/)/i.test(equipe)) return 'a';
  return /systech|pmo/i.test(equipe) ? 's' : 'c';
}

/** Gate que fecha cada fase (Monitoramento corre junto com o Encerramento e fecha no G4). */
export const GATE_DA_FASE: Partial<Record<Fase, { gate: string; nome: string }>> = {
  'Iniciação': { gate: 'G1', nome: 'G1 · Termo de abertura aprovado' },
  'Planejamento': { gate: 'G2', nome: 'G2 · Linha de base aprovada' },
  'Execução': { gate: 'G3', nome: 'G3 · Execução aceita (libera monitoramento e encerramento)' },
  'Encerramento': { gate: 'G4', nome: 'G4 · Termo de aceite final' }
};

/** Fase oficial seguinte quando o gate é aprovado. */
export const PROXIMA_FASE: Partial<Record<Fase, Fase>> = {
  'Iniciação': 'Planejamento', 'Planejamento': 'Execução', 'Execução': 'Encerramento'
};

/**
 * Onde cada gate aparece no ciclo de vida. Monitoramento e Encerramento formam um bloco em paralelo;
 * o G3 fica depois da Execução e o G4 depois do bloco.
 */
export const GATE_APOS_FASE: Record<string, Fase> = { 'Iniciação': 'Iniciação', 'Planejamento': 'Planejamento', 'Execução': 'Execução', 'Monitoramento': 'Encerramento', 'Encerramento': 'Encerramento' };

/** Tipos de reunião do Teams: duração sugerida e se convida só a equipe Systech. */
export interface TipoReuniao { nome: string; duracaoMin: number; somenteSystech: boolean; descricao: string }
export const TIPOS_REUNIAO: TipoReuniao[] = [
  { nome: 'Implementação', duracaoMin: 120, somenteSystech: false, descricao: 'Janela de implantação com a equipe técnica e o cliente' },
  { nome: 'Alinhamento', duracaoMin: 60, somenteSystech: false, descricao: 'Alinhamento de escopo, prazos e pendências com o cliente' },
  { nome: 'Interna', duracaoMin: 30, somenteSystech: true, descricao: 'Só a equipe Systech' },
  { nome: 'Execução', duracaoMin: 60, somenteSystech: false, descricao: 'Acompanhamento da execução das atividades' }
];
export const tipoReuniao = (nome?: string) => TIPOS_REUNIAO.find(t => t.nome === nome);

/** Funções possíveis na equipe do projeto (lista fechada). */
export const FUNCOES_EQUIPE = ['Técnico', 'Gerente de projeto', 'Arquiteto', 'Responsável do cliente', 'Responsável do fornecedor', 'Patrocinador'];

/** Próximo código da sequência (R-7 → R-8, DA-A16 → DA-A17); usa o prefixo mais comum da lista. */
export function proximoCodigoSeq(codigos: string[], prefixoPadrao: string): string {
  const partes = codigos.map(c => /^(.*?)(\d+)$/.exec(c.trim())).filter((m): m is RegExpExecArray => !!m);
  if (!partes.length) return prefixoPadrao + '1';
  const contagem = new Map<string, number>();
  for (const m of partes) contagem.set(m[1], (contagem.get(m[1]) || 0) + 1);
  const prefixo = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const maior = Math.max(...partes.filter(m => m[1] === prefixo).map(m => Number(m[2])));
  return prefixo + (maior + 1);
}

/** Causas de atraso da atualização semanal. */
export const CAUSAS_ATRASO = ['Cliente / acesso', 'Fabricante / entrega', 'Janela / RDM', 'Recurso interno', 'Técnica'];
/** Status disponíveis na atualização semanal (igual ao protótipo). */
export const STATUS_ATUALIZACAO = ['Em andamento', 'Planejado', 'Bloqueado', 'Concluído', 'A confirmar', 'Cancelado'] as const;
