/** Indicadores calculados a partir das atividades — ninguém digita % do projeto. */
import type { Atividade, Dados, EstadoFase, Fase, Pendencia, Projeto, Risco } from '../types/models';
import { diasUteis } from './datas';

export const macro = (d: Dados, cod: string): Atividade[] => (d.atividades[cod] || []).filter(a => !a.pai);

const contaParaAvanco = (a: Atividade) => a.duracao > 0 && a.status !== 'Cancelado';

export function avanco(d: Dados, cod: string): number {
  const l = macro(d, cod).filter(contaParaAvanco);
  const total = l.reduce((s, a) => s + a.duracao, 0);
  return total ? Math.round(l.reduce((s, a) => s + a.duracao * a.percentual, 0) / total) : 0;
}

/** % que deveria estar pronto hoje segundo a baseline. */
export function planejado(d: Dados, cod: string, hoje: string): number {
  const l = macro(d, cod).filter(contaParaAvanco);
  const total = l.reduce((s, a) => s + a.duracao, 0);
  if (!total) return 0;
  let soma = 0;
  for (const a of l) {
    const bi = a.baselineInicio || a.inicio, bf = a.baselineTermino || a.termino;
    if (!bi || !bf) continue;
    if (hoje > bf) soma += a.duracao * 100;
    else if (hoje >= bi) soma += a.duracao * 100 * Math.max(0, diasUteis(bi, hoje) - 1) / Math.max(1, diasUteis(bi, bf));
  }
  return Math.round(soma / total);
}

/** Desvio do término previsto em dias úteis em relação à baseline. */
export function desvio(p: Projeto): number {
  if (!p.terminoBaseline || !p.terminoPrevisto || p.terminoBaseline === p.terminoPrevisto) return 0;
  const n = diasUteis(p.terminoBaseline, p.terminoPrevisto);
  return n > 0 ? n - 1 : n + 1;
}

export const riscosAbertos = (d: Dados, cod: string): Risco[] =>
  (d.riscos[cod] || []).filter(r => r.situacao === 'Aberto' || r.situacao === 'Em tratamento');

export const riscosAltos = (d: Dados, cod: string): Risco[] =>
  riscosAbertos(d, cod).filter(r => r.impacto === 'Alto' && r.probabilidade !== 'Baixo');

export const pendenciasAbertas = (d: Dados, cod: string): Pendencia[] =>
  (d.pendencias[cod] || []).filter(p => p.situacao !== 'Respondida');

export function proximoMarco(d: Dados, cod: string, hoje: string): Atividade | undefined {
  return macro(d, cod)
    .filter(a => a.marco && a.status !== 'Concluído' && a.termino >= hoje)
    .sort((a, b) => a.termino.localeCompare(b.termino))[0];
}

/** Posição no ciclo oficial: Monitoramento e Encerramento correm juntos (mesma posição). */
const POSICAO: Record<Fase, number> = { 'Iniciação': 0, 'Planejamento': 1, 'Execução': 2, 'Monitoramento': 3, 'Encerramento': 3 };

/**
 * Estado oficial da fase: quem avança a fase é a aprovação do gate (campo Fase do projeto).
 * Monitoramento acompanha o Encerramento em paralelo (os dois fecham no G4).
 */
export function estadoFase(_d: Dados, p: Projeto, fase: Fase): EstadoFase {
  if (p.situacaoCadastro === 'Encerrado') return 'Concluída';
  const k = POSICAO[fase], a = POSICAO[p.fase] ?? 0;
  return k < a ? 'Concluída' : k === a ? 'Em andamento' : 'Não iniciada';
}

export function faseAtual(_d: Dados, p: Projeto): Fase {
  return p.fase === 'Monitoramento' ? 'Encerramento' : p.fase;
}

/** Quantas atividades macro da fase já foram concluídas (ou canceladas). */
export function progressoFase(d: Dados, cod: string, fase: Fase): { feitas: number; total: number; abertas: Atividade[] } {
  const l = macro(d, cod).filter(a => a.fase === fase);
  const abertas = l.filter(a => a.status !== 'Concluído' && a.status !== 'Cancelado');
  return { feitas: l.length - abertas.length, total: l.length, abertas };
}
