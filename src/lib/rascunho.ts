import type { Dados, Projeto } from '../types/models';
import { macro } from './calculos';

/** O que ainda falta para um rascunho poder ser enviado para aprovação (ou ativado). */
export function pendenciasRascunho(d: Dados, p: Projeto, hoje: string): string[] {
  const e: string[] = [];
  const br = (s: string) => s.split('-').reverse().join('/');
  if (!p.cliente.trim()) e.push('cliente');
  if (!p.gerente.trim()) e.push('gerente de projeto');
  if (!p.objetivo.trim()) e.push('objetivo');
  if (!p.inicio) e.push('data de início');
  else if (p.inicio < hoje) e.push(`início a partir de hoje (${br(hoje)})`);
  if (!p.terminoPrevisto && !p.terminoBaseline) e.push('data de término');
  const at = macro(d, p.codigo);
  if (!at.length) e.push('ao menos uma atividade no cronograma');
  else if (at.some(a => !a.inicio || !a.termino)) e.push('datas de todas as atividades');
  return e;
}
