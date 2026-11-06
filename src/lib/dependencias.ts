/** Pré-requisitos entre atividades/subatividades e tarefas ainda não lançadas para o técnico. */
import type { Atividade, StatusAtividade } from '../types/models';
import { diasUteis } from './datas';

/** Status/% que contam como "iniciada". */
export const iniciaria = (status: StatusAtividade, percentual: number) => status === 'Em andamento' || status === 'Concluído' || percentual > 0;

/** Pré-requisitos ainda não concluídos (os que não existem mais são ignorados). */
export function pendentes(a: Atividade, lista: Atividade[]): Atividade[] {
  return (a.predecessoras || []).map(c => lista.find(x => x.codigo === c)).filter((x): x is Atividade => !!x && x.status !== 'Concluído');
}

/** A atividade está bloqueada: não concluída e com pré-requisito pendente. */
export const aguardando = (a: Atividade, lista: Atividade[]) => a.status !== 'Concluído' && a.status !== 'Cancelado' && pendentes(a, lista).length > 0;

/**
 * Atividades que podem ser pré-requisito de "codigo": todas, menos ela mesma, as subatividades dela, a principal dela
 * e qualquer uma que (direta ou indiretamente) já dependa dela — para não criar ciclo.
 */
export function candidatas(lista: Atividade[], codigo: string): Atividade[] {
  const dependentes = new Set<string>([codigo]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const a of lista) {
      if (dependentes.has(a.codigo)) continue;
      if ((a.predecessoras || []).some(p => dependentes.has(p)) || (a.pai && dependentes.has(a.pai))) { dependentes.add(a.codigo); mudou = true; }
    }
  }
  const atual = lista.find(a => a.codigo === codigo);
  return lista.filter(a => !dependentes.has(a.codigo) && a.codigo !== atual?.pai)
    .sort((x, y) => x.codigo.localeCompare(y.codigo, 'pt-BR', { numeric: true }));
}

/** O técnico só vê subatividades já lançadas (as antigas, sem a marcação, contam como lançadas). */
export const lancadaParaTecnico = (a: Atividade) => !a.pai || a.lancada !== false;

/** Situação do prazo de uma tarefa aberta: "atrasada" (passou do término) ou "perto" (vence em até 3 dias úteis). */
export function situacaoPrazo(a: Atividade, hoje: string): '' | 'atrasada' | 'perto' {
  if (a.status === 'Concluído' || a.status === 'Cancelado' || !a.termino) return '';
  if (a.termino < hoje) return 'atrasada';
  return diasUteis(hoje, a.termino) <= 3 ? 'perto' : '';
}
