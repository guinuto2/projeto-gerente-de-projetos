/** Reuniões são gravadas na hora local de Brasília (UTC-03), sem fuso no campo. */
export function instanteReuniao(inicio?: string): number | null {
  if (!inicio || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(inicio)) return null;
  const data = new Date(`${inicio.slice(0, 16)}:00-03:00`).getTime();
  return Number.isFinite(data) ? data : null;
}

/** O link de ingresso só fica disponível até o horário marcado para começar. */
export function reuniaoPassou(inicio?: string, agora: Date = new Date()): boolean {
  const instante = instanteReuniao(inicio);
  return instante !== null && agora.getTime() >= instante;
}
