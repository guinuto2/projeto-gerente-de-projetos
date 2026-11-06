import type { Atividade, Dados, Pendencia, Projeto, Risco } from '../types/models';

/**
 * Validações do portal, num lugar só (valem para Atualizar status, painel da atividade e criação de tarefas).
 * As funções devolvem a lista de problemas; quem chama decide se bloqueia (erros) ou só avisa (avisos).
 */

const br = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const aberta = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';
/** campos que caracterizam uma atualização de status */
export const CAMPOS_STATUS = ['status', 'percentual', 'dataReal', 'horasRealizadas', 'impedimento', 'causaAtraso'] as const;

/** 1. Coerência ao atualizar o status. */
export function conferirStatus(antes: Atividade, depois: Atividade, hoje: string, temTarefas: boolean): string[] {
  const e: string[] = [];
  const pct = depois.status === 'Concluído' ? 100 : depois.percentual;
  if (depois.status === 'Concluído') {
    if (depois.percentual !== 100 && temTarefas) e.push('a atividade só pode ser concluída quando todas as tarefas estiverem concluídas ou canceladas');
    if (!depois.dataReal) e.push('informe a data real de conclusão');
    if (!temTarefas && !(Number(depois.horasRealizadas) > 0)) e.push('informe as horas realizadas para concluir');
  }
  if (pct === 100 && depois.status !== 'Concluído' && depois.status !== 'Cancelado') e.push('100% só com o status “Concluído” (ou ajuste o %)');
  if (depois.status === 'Bloqueado') {
    if (!depois.impedimento) e.push('com o status “Bloqueado”, marque “Tem impedimento” como Sim');
    if (!(depois.observacao || '').trim()) e.push('descreva o impedimento em “Próximo passo / observação”');
  }
  if (aberta(depois) && depois.termino && depois.termino < hoje && !(depois.causaAtraso || '').trim())
    e.push(`a tarefa está atrasada (prevista para ${br(depois.termino)}): informe a causa do atraso`);
  if (depois.dataReal) {
    if (depois.dataReal > hoje) e.push('a data real não pode ser no futuro');
    if (depois.inicio && depois.dataReal < depois.inicio) e.push(`a data real não pode ser antes do início (${br(depois.inicio)})`);
  }
  const hAntes = Number(antes.horasRealizadas) || 0, hDepois = depois.horasRealizadas === undefined ? hAntes : Number(depois.horasRealizadas) || 0;
  if (hDepois < hAntes) e.push(`as horas realizadas não podem diminuir (estavam em ${hAntes} h)`);
  return e;
}

/** Sábado ou domingo. */
export function fimDeSemana(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(`${iso}T12:00:00`).getDay();
  return d === 0 || d === 6;
}
export const avisoFimDeSemana = (iso?: string) => (fimDeSemana(iso) ? `${br(iso)} cai num ${new Date(`${iso}T12:00:00`).getDay() === 0 ? 'domingo' : 'sábado'}` : '');

/**
 * 2. Datas dentro dos limites. "estrutura" (criar/editar a atividade) bloqueia; "reprogramacao" (Atualizar status) só avisa,
 * para que um atraso real possa ser registrado.
 */
export function conferirDatas(a: Atividade, p: Projeto, lista: Atividade[], modo: 'estrutura' | 'reprogramacao'): { erros: string[]; avisos: string[] } {
  const erros: string[] = [], avisos: string[] = [];
  const fimProjeto = p.terminoPrevisto || p.terminoBaseline;
  const fora = (msg: string) => (modo === 'estrutura' ? erros : avisos).push(msg);
  if (a.inicio && a.termino && a.termino < a.inicio) erros.push('o término é antes do início');
  if (!a.pai) {
    if (a.inicio && p.inicio && a.inicio < p.inicio) erros.push(`começa antes do início do projeto (${br(p.inicio)})`);
    if (a.termino && fimProjeto && a.termino > fimProjeto) fora(`termina depois do fim previsto do projeto (${br(fimProjeto)})`);
    const filhos = lista.filter(x => x.pai === a.codigo && x.status !== 'Cancelado');
    const foraDoPai = filhos.filter(x => (x.inicio && a.inicio && x.inicio < a.inicio) || (x.termino && a.termino && x.termino > a.termino));
    if (foraDoPai.length) fora(`as tarefas ${foraDoPai.map(x => x.codigo).join(', ')} ficariam fora do período da atividade (${br(a.inicio)} a ${br(a.termino)})`);
  } else {
    const pai = lista.find(x => x.codigo === a.pai);
    if (pai) {
      if (a.inicio && pai.inicio && a.inicio < pai.inicio) erros.push(`começa antes da atividade principal ${pai.codigo} (${br(pai.inicio)})`);
      if (a.termino && pai.termino && a.termino > pai.termino) fora(`termina depois da atividade principal ${pai.codigo} (${br(pai.termino)})`);
    }
  }
  for (const [rot, d] of [['início', a.inicio], ['término', a.termino]] as const) if (fimDeSemana(d)) avisos.push(`o ${rot} ${avisoFimDeSemana(d)}`);
  return { erros, avisos };
}

/** 3. Checklist dos gates G3 (fim da execução) e G4 (encerramento). temTrd: null = não verificado (piloto). */
export function checklistGate(gate: string, p: Projeto, d: Dados, temTrd: boolean | null): { ok: boolean | null; texto: string }[] {
  const atv = (d.atividades[p.codigo] || []);
  if (gate === 'G3') {
    const abertas = atv.filter(a => a.fase === 'Execução' && aberta(a));
    return [{ ok: !abertas.length, texto: abertas.length ? `${abertas.length} atividade(s) da Execução ainda aberta(s): ${abertas.slice(0, 6).map(a => a.codigo).join(', ')}${abertas.length > 6 ? '…' : ''}` : 'Atividades da Execução concluídas ou canceladas' }];
  }
  if (gate !== 'G4') return [];
  const abertas = atv.filter(aberta);
  const riscos = (d.riscos[p.codigo] || []).filter((r: Risco) => r.situacao !== 'Fechado' && r.situacao !== 'Mitigado');
  const pend = (d.pendencias[p.codigo] || []).filter((x: Pendencia) => x.situacao === 'Aberta');
  return [
    { ok: !abertas.length, texto: abertas.length ? `${abertas.length} atividade(s) ainda aberta(s): ${abertas.slice(0, 6).map(a => a.codigo).join(', ')}${abertas.length > 6 ? '…' : ''}` : 'Todas as atividades concluídas ou canceladas' },
    { ok: !riscos.length, texto: riscos.length ? `${riscos.length} risco(s) ainda aberto(s): ${riscos.slice(0, 6).map(r => r.codigo).join(', ')}` : 'Riscos fechados ou mitigados' },
    { ok: !pend.length, texto: pend.length ? `${pend.length} pendência(s) aberta(s): ${pend.slice(0, 6).map(x => x.codigo).join(', ')}` : 'Pendências respondidas' },
    { ok: temTrd, texto: temTrd === null ? 'Termo de aceite (TRD): não verificado no modo piloto' : temTrd ? 'Termo de aceite (TRD) na pasta do projeto' : 'Falta o termo de aceite (TRD) na pasta do projeto — envie um arquivo com “TRD” ou “termo de aceite” no nome' }
  ];
}

/** 9. Código do projeto no padrão CLIENTE-SIGLA (maiúsculas, números e hífen, ex.: TRF1-VCF). */
export const CODIGO_PADRAO = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
export const normalizarCodigo = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_]+/g, '-').replace(/[^A-Z0-9-]/g, '').replace(/-{2,}/g, '-');

/** 10. Cliente parecido com um já usado (ex.: "TRF 1" e "TRF1"), mas não igual. */
export function clienteParecido(nome: string, clientes: string[]): string | null {
  const n = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sigla = (s: string) => n(s.split(/[·\-–—(]/)[0]);
  const alvo = n(nome), alvoSigla = sigla(nome);
  if (alvo.length < 3) return null;
  for (const c of clientes) {
    if (c.trim() === nome.trim()) return null;   // é exatamente um já usado
  }
  for (const c of clientes) {
    const k = n(c), ks = sigla(c);
    if (k === alvo || (alvoSigla.length >= 3 && ks === alvoSigla) || (alvo.length >= 4 && distancia(k, alvo) <= 2) || (alvoSigla.length >= 3 && distancia(ks, alvoSigla) <= 1 && Math.min(ks.length, alvoSigla.length) >= 4)) return c;
  }
  return null;
}
function distancia(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}

/** 11. Risco alto (impacto Alto e probabilidade Média/Alta) exige plano de mitigação. */
export const riscoAltoSemMitigacao = (r: Pick<Risco, 'impacto' | 'probabilidade' | 'mitigacao'>) => r.impacto === 'Alto' && r.probabilidade !== 'Baixo' && !(r.mitigacao || '').trim();
/** Pendência aberta com prazo vencido: quantos dias de atraso (0 = não vencida). */
export function diasVencida(x: Pick<Pendencia, 'situacao'> & { prazo?: string }, hoje: string): number {
  if (x.situacao !== 'Aberta' || !x.prazo || x.prazo >= hoje) return 0;
  return Math.round((new Date(`${hoje}T12:00:00`).getTime() - new Date(`${x.prazo}T12:00:00`).getTime()) / 86400000);
}

/* ---------------- avisos de planejamento (não bloqueiam) ---------------- */

/** 5. Tarefas abertas do técnico que se sobrepõem ao período, em todos os projetos (a própria tarefa fica de fora). */
export function tarefasNoPeriodo(d: Dados, email: string, inicio: string, termino: string, exceto?: { projeto: string; codigo: string }) {
  if (!email || !inicio || !termino) return [];
  const e = email.toLowerCase(), out: { projeto: string; codigo: string; nome: string; inicio: string; termino: string }[] = [];
  for (const [cod, lista] of Object.entries(d.atividades)) {
    const p = d.projetos.find(x => x.codigo === cod);
    if (!p || p.situacaoCadastro === 'Encerrado' || p.situacaoCadastro === 'Rascunho') continue;
    for (const a of lista) {
      if (exceto && exceto.projeto === cod && exceto.codigo === a.codigo) continue;
      if (!aberta(a) || (a.responsavel || '').toLowerCase() !== e || !a.inicio || !a.termino) continue;
      if (a.inicio <= termino && a.termino >= inicio) out.push({ projeto: cod, codigo: a.codigo, nome: a.nome, inicio: a.inicio, termino: a.termino });
    }
  }
  return out.sort((x, y) => x.inicio.localeCompare(y.inicio));
}
export function avisoSobrecarga(l: ReturnType<typeof tarefasNoPeriodo>): string {
  if (!l.length) return '';
  const lista = l.slice(0, 4).map(t => `${t.projeto} ${t.codigo} (${br(t.inicio).slice(0, 5)}–${br(t.termino).slice(0, 5)})`).join(', ');
  return `já tem ${l.length} tarefa(s) aberta(s) nesse período: ${lista}${l.length > 4 ? '…' : ''}`;
}

/** 6. Horas planejadas acima do possível pela duração (8 h por dia útil). */
export const HORAS_POR_DIA = 8;
export function avisoHorasPlanejadas(horas: number, diasUteisPeriodo: number): string {
  if (!(horas > 0) || !(diasUteisPeriodo > 0)) return '';
  const max = diasUteisPeriodo * HORAS_POR_DIA;
  return horas > max ? `${horas} h em ${diasUteisPeriodo} dia(s) útil(eis) passa de ${HORAS_POR_DIA} h por dia (máximo de ${max} h para uma pessoa)` : '';
}
/** 6. Horas realizadas bem acima das planejadas (mais de 20%). */
export function avisoHorasRealizadas(realizadas: number, planejadas?: number): string {
  if (!(planejadas && planejadas > 0) || !(realizadas > planejadas * 1.2)) return '';
  return `as horas realizadas (${realizadas} h) passam ${Math.round((realizadas / planejadas - 1) * 100)}% das planejadas (${planejadas} h)`;
}

/* ---------------- cadastro do projeto (bloqueiam) ---------------- */

/** 7. Edital e Service Entitlement exigem o número do contrato e a data de assinatura. */
export function faltasFaturamento(f: { modeloFaturamento?: string; contrato?: string; dataAssinatura?: string }): string[] {
  if (f.modeloFaturamento !== 'Edital' && f.modeloFaturamento !== 'Service Entitlement') return [];
  return [!(f.contrato || '').trim() && `informe o número do contrato/pedido (exigido no modelo ${f.modeloFaturamento})`,
          !f.dataAssinatura && `informe a data de assinatura do contrato (exigida no modelo ${f.modeloFaturamento})`].filter((x): x is string => !!x);
}
