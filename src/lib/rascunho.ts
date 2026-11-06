import type { Dados, Projeto } from '../types/models';
import { macro } from './calculos';

/** O que ainda falta para um rascunho poder ser enviado para aprovação (ou ativado). */
export function pendenciasRascunho(d: Dados, p: Projeto, _hoje: string): string[] {   // datas passadas são permitidas
  const e: string[] = [];
  if (!p.cliente.trim()) e.push('cliente');
  if (!p.gerente.trim()) e.push('gerente de projeto');
  if (!p.objetivo.trim()) e.push('objetivo');
  if (!p.inicio) e.push('data de início');
  if (!p.terminoPrevisto && !p.terminoBaseline) e.push('data de término');
  const at = macro(d, p.codigo);
  if (!at.length) e.push('ao menos uma atividade no cronograma');
  else if (at.some(a => !a.inicio || !a.termino)) e.push('datas de todas as atividades');
  return e;
}
