/**
 * Quem recebe um aviso do sino: um por e-mail (separados por vírgula ou ponto e vírgula), sem repetir,
 * sem diferenciar maiúsculas e sem avisar quem fez a ação. No modo piloto o aviso aparece para quem estiver testando ('*').
 */
export function destinatariosAviso(para: string, eu: string, piloto: boolean): string[] {
  if (piloto) return ['*'];
  const meu = (eu || '').trim().toLowerCase();
  return Array.from(new Set((para || '').split(/[,;]\s*/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@') && e !== meu)));
}

/** Retenção na interface: lidos saem após 7 dias; não lidos, após 30 dias.
 * Não exclui registros da lista SharePoint nem altera o histórico do projeto.
 */
export function avisoDentroDoPrazo(n: { quando: string; lida: boolean }, agora: Date = new Date()): boolean {
  const data = new Date(n.quando).getTime();
  if (!Number.isFinite(data)) return true; // aviso antigo sem data legível: preservar
  const dias = n.lida ? 7 : 30;
  return agora.getTime() - data < dias * 24 * 60 * 60 * 1000;
}
