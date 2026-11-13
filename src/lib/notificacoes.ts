/**
 * Quem recebe um aviso do sino: um por e-mail (separados por vírgula ou ponto e vírgula), sem repetir,
 * sem diferenciar maiúsculas e sem avisar quem fez a ação. No modo piloto o aviso aparece para quem estiver testando ('*').
 */
export function destinatariosAviso(para: string, eu: string, piloto: boolean): string[] {
  if (piloto) return ['*'];
  const meu = (eu || '').trim().toLowerCase();
  return Array.from(new Set((para || '').split(/[,;]\s*/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@') && e !== meu)));
}
