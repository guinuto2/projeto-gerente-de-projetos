import type { Fase, Nivel, SituacaoRisco, StatusAtividade } from '../types/models';

export const FASES: Fase[] = ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento'];
export const ABREV_FASE = ['Inic.', 'Plan.', 'Exec.', 'Monit.', 'Encer.'];
export const PASTAS = ['01 · Iniciação', '02 · Planejamento', '03 · Execução', '04 · Monitoramento e controle', '05 · Encerramento'];
export const STATUS_ATIVIDADE: StatusAtividade[] = ['Planejado', 'Em andamento', 'Bloqueado', 'Concluído', 'Cancelado'];
export const NIVEIS: Nivel[] = ['Baixo', 'Médio', 'Alto'];
export const SITUACOES_RISCO: SituacaoRisco[] = ['Aberto', 'Em tratamento', 'Mitigado', 'Fechado'];
export const TIPOS_PROJETO = ['VMware / EUC', 'Storage', 'Servidores', 'Backup', 'Rede', 'Outros'];

export type Cores = [fundo: string, texto: string];

export const SELO_FAROL: Record<string, Cores> = { Verde: ['#D7F0E3', '#145C3C'], Amarelo: ['#FFE8A8', '#5C3D00'], Vermelho: ['#FBE3DC', '#9A2E12'] };
export const COR_FAROL: Record<string, string> = { Verde: '#1F8A5B', Amarelo: '#D69E2E', Vermelho: '#C0392B' };
export const SELO_STATUS: Record<string, Cores> = {
  'Concluído': ['#D7F0E3', '#145C3C'], 'Em andamento': ['#FFF1D1', '#7A5200'], 'Planejado': ['#EEF0F3', '#3C4757'],
  'Bloqueado': ['#FBE3DC', '#9A2E12'], 'Cancelado': ['#EEF0F3', '#8A94A3']
};
export const SELO_RISCO: Record<string, Cores> = {
  'Aberto': ['#FBE3DC', '#9A2E12'], 'Em tratamento': ['#FFF1D1', '#7A5200'], 'Mitigado': ['#D7F0E3', '#145C3C'], 'Fechado': ['#EEF0F3', '#3C4757']
};
export const SELO_PENDENCIA: Record<string, Cores> = { 'Aberta': ['#FFF1D1', '#7A5200'], 'Respondida': ['#D7F0E3', '#145C3C'] };
export const GATE_COR: Record<string, string> = { 'Aprovado': '#7E181C', 'Aguardando aprovação': '#D69E2E', 'Pendente': '#A3A6AB' };
export const GATE_CAIXA: Record<string, string> = { 'Aprovado': '#F6E9EA', 'Aguardando aprovação': '#FFF4DB', 'Pendente': '#F3F3F4' };
export const COR_EXTENSAO: Record<string, string> = { docx: '#2B579A', doc: '#2B579A', xlsx: '#217346', xls: '#217346', pptx: '#B7472A', pdf: '#C0392B', vsdx: '#3955A3' };

/** classe visual da equipe: s = Systech, c = cliente, a = ambos */
export function classeEquipe(equipe: string): 's' | 'c' | 'a' {
  if (/systech/i.test(equipe) && /( e |\/)/i.test(equipe)) return 'a';
  return /systech|pmo/i.test(equipe) ? 's' : 'c';
}

/** Gate que fecha cada fase (Monitoramento corre em paralelo e não tem gate). */
export const GATE_DA_FASE: Partial<Record<Fase, { gate: string; nome: string }>> = {
  'Iniciação': { gate: 'G1', nome: 'G1 · Termo de abertura aprovado' },
  'Planejamento': { gate: 'G2', nome: 'G2 · Linha de base aprovada' },
  'Execução': { gate: 'G3', nome: 'G3 · Implementação aceita (libera o encerramento)' },
  'Encerramento': { gate: 'G4', nome: 'G4 · Termo de aceite final' }
};

/** Fase oficial seguinte quando o gate é aprovado. */
export const PROXIMA_FASE: Partial<Record<Fase, Fase>> = {
  'Iniciação': 'Planejamento', 'Planejamento': 'Execução', 'Execução': 'Encerramento'
};

/**
 * Onde cada gate aparece no ciclo de vida. Execução e Monitoramento formam um bloco em paralelo;
 * o gate da Execução (G3) fica depois do bloco, antes do Encerramento.
 */
export const GATE_APOS_FASE: Record<string, Fase> = { 'Iniciação': 'Iniciação', 'Planejamento': 'Planejamento', 'Execução': 'Monitoramento', 'Monitoramento': 'Monitoramento', 'Encerramento': 'Encerramento' };
