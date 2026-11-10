import type { Atividade, Dados, Projeto } from '../types/models';

/** Domínios da Systech: pessoas com esses e-mails nunca são tratadas como cliente. */
export const DOMINIOS_SYSTECH = ['systechtecnologia.com.br', 'systech.com.br', 'gruposystech.onmicrosoft.com'];
export const dominioDe = (email: string) => (email.split('@')[1] || '').trim().toLowerCase();

/** Órgãos (domínios de e-mail) do lado do cliente na equipe de um projeto. */
export function dominiosDoCliente(p: Projeto): string[] {
  return Array.from(new Set(p.equipe.filter(m => m.email && (m.empresa || '').trim().toLowerCase() !== 'systech').map(m => dominioDe(m.email))
    .filter(d => d && !DOMINIOS_SYSTECH.includes(d))));
}

/** Cópia do projeto só com o que o cliente pode ver (sem faturamento, parceiro, e-mails, observações internas e tarefas não lançadas). */
export function copiaParaCliente(p: Projeto, d: Dados): { projeto: Projeto; atividades: Atividade[]; gerado: string } {
  const projeto: Projeto = {
    ...p,
    modeloFaturamento: undefined, parceiro: undefined, contrato: '', ultimoStatusReport: undefined,
    equipe: p.equipe.map(m => ({ nome: m.nome, funcao: m.funcao, empresa: m.empresa, email: '' })),
    fases: p.fases.map(g => ({ fase: g.fase, gate: g.gate, nome: g.nome, situacao: g.situacao, data: g.data, info: '' })),
    premissas: [], dependencias: [], restricoes: []
  } as Projeto;
  const atividades: Atividade[] = (d.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado' && a.lancada !== false).map(a => ({
    codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, duracao: a.duracao, descricao: '', marco: a.marco,
    inicio: a.inicio, termino: a.termino, baselineInicio: a.baselineInicio, baselineTermino: a.baselineTermino,
    status: a.status, percentual: a.percentual, pai: a.pai, observacao: '', dataReal: a.dataReal
  } as Atividade));
  return { projeto, atividades, gerado: new Date().toISOString() };
}
