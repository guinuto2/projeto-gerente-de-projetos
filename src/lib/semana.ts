/** Seleção das atividades da atualização semanal. */
import type { Atividade, Dados, Projeto } from '../types/models';
import { dia, iso } from './datas';

/** Segunda e domingo da semana de "hoje". */
export function semanaDe(hoje: string): { inicio: string; fim: string } {
  const d = dia(hoje)!;
  const seg = new Date(d); seg.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
  return { inicio: iso(seg), fim: iso(dom) };
}

export interface ItemSemana { projeto: Projeto; atividade: Atividade }

const aberta = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';
export const vencida = (a: Atividade, hoje: string) => aberta(a) && !!a.termino && a.termino < hoje;

/**
 * Atividades abertas que já começaram ou começam até o fim da semana (inclui as atrasadas).
 * Subatividades só entram se tiverem responsável próprio (senão repetiriam a principal).
 */
export function atividadesDaSemana(d: Dados, projetos: Projeto[], hoje: string): ItemSemana[] {
  const { fim } = semanaDe(hoje);
  const lista: ItemSemana[] = [];
  for (const p of projetos) {
    for (const a of d.atividades[p.codigo] || []) {
      if (!aberta(a) || !a.inicio || a.inicio > fim) continue;
      if (a.pai && !a.responsavel) continue;
      lista.push({ projeto: p, atividade: a });
    }
  }
  // atrasadas primeiro, depois por data prevista
  return lista.sort((x, y) => Number(vencida(y.atividade, hoje)) - Number(vencida(x.atividade, hoje)) || (x.atividade.termino || '').localeCompare(y.atividade.termino || ''));
}
