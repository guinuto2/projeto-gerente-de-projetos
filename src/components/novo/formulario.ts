import { faltasFaturamento } from '../../lib/validacoes';
import type { Atividade, Dados, Fase, Gate, MembroEquipe, Nivel, NovoProjeto, Risco, SituacaoCadastro, Tecnico } from '../../types/models';
import { gerentesParaCadastro, tecnicoPorNome } from '../../lib/pessoas';
import { dia, diasUteis, diaUtil, diferencaDiasCorridos, linhas, somarDiasCorridos, somarDiasUteis, hojeIso } from '../../lib/datas';
import { CRONOGRAMA_SYSTECH, RISCOS_SYSTECH } from '../../lib/modeloSystech';
import { NUMERO_FASE, codigoDaFase } from '../../lib/constantes';

const diaUtilIso = (s: string) => { const d = dia(s); return !!d && diaUtil(d); };

export interface LinhaAtividade { codigo: string; nome: string; fase: Fase; equipe: string; inicio: string; termino: string; marco: boolean;
  /** vindos de um modelo de projeto */
  horasPlanejadas?: number; predecessoras?: string[]; descricao?: string }
/** Tarefa (subatividade) vinda de um modelo: criada junto com o projeto, em preparação (o PMO lança depois). */
export interface TarefaModelo extends LinhaAtividade { pai: string }
/** Move início e término juntos, mantendo a duração original em dias corridos. */
export function deslocarPeriodo<T extends { inicio: string; termino: string }>(linha: T, dias: number): T {
  if (!dias) return linha;
  return { ...linha, inicio: somarDiasCorridos(linha.inicio, dias), termino: somarDiasCorridos(linha.termino, dias) };
}

/**
 * Reprograma o cronograma durante o cadastro: alterar o início desloca também o término da
 * própria atividade; alterar o término mantém seu início. Em ambos os casos, todas as atividades
 * seguintes e as tarefas do modelo ligadas às atividades afetadas acompanham a diferença.
 */
export function reprogramarCronograma(
  atividades: LinhaAtividade[], tarefas: TarefaModelo[], indice: number,
  campo: 'inicio' | 'termino', valor: string
): { atividades: LinhaAtividade[]; tarefas: TarefaModelo[] } {
  const atual = atividades[indice];
  if (!atual) return { atividades, tarefas };
  const dias = diferencaDiasCorridos(atual[campo], valor);
  // Sem duas datas válidas, não há diferença confiável para propagar.
  if (dias === null || !dias) {
    return { atividades: atividades.map((a, i) => i === indice ? { ...a, [campo]: valor } : a), tarefas };
  }
  const novas = atividades.map((a, i) => {
    if (i < indice) return a;
    if (i > indice || campo === 'inicio') return {
      ...deslocarPeriodo(a, dias), ...(i === indice ? { inicio: valor } : {})
    };
    return { ...a, termino: valor };
  });
  const afetadas = new Set(atividades.slice(indice + (campo === 'inicio' ? 0 : 1)).map(a => a.codigo));
  const novasTarefas = tarefas.map(t => afetadas.has(t.pai) ? deslocarPeriodo(t, dias) : t);
  return { atividades: novas, tarefas: novasTarefas };
}

export interface LinhaRisco { codigo: string; descricao: string; probabilidade: Nivel; impacto: Nivel; mitigacao: string; responsavel: string }

export interface FormProjeto {
  codigo: string; nome: string; cliente: string; tipo: string; gerente: string; arquiteto: string;
  patrocinador: string; contrato: string; dataAssinatura: string; modeloFaturamento: string; parceiro: string; inicio: string; termino: string; objetivo: string;
  escopoIncluido: string; escopoExcluido: string; premissas: string; dependencias: string; restricoes: string;
  atividades: LinhaAtividade[];
  /** tarefas do modelo aplicado (criadas junto com o projeto) */
  tarefasModelo?: TarefaModelo[];
  riscos: LinhaRisco[];
  equipe: MembroEquipe[];
  /** e-mail do arquiteto escolhido na tabela de técnicos */
  arquitetoEmail?: string;
}

export const novaAtividade = (codigos: string[], fase: Fase = 'Iniciação'): LinhaAtividade =>
  ({ codigo: codigoDaFase(codigos, fase), nome: '', fase, equipe: 'Systech', inicio: '', termino: '', marco: false });

/** Renumera as atividades do cadastro pela fase, na ordem da lista: Iniciação 1.0, 1.1…; Planejamento 2.0…; etc. */
export function renumerar(linhas: LinhaAtividade[]): LinhaAtividade[] {
  const cont: Partial<Record<Fase, number>> = {};
  return linhas.map(l => { const k = cont[l.fase] ?? 0; cont[l.fase] = k + 1; return { ...l, codigo: `${NUMERO_FASE[l.fase]}.${k}` }; });
}
export const novoRisco = (n: number): LinhaRisco => ({ codigo: 'R-' + n, descricao: '', probabilidade: 'Médio', impacto: 'Médio', mitigacao: '', responsavel: '' });

export const formVazio = (): FormProjeto => ({
  codigo: '', nome: '', cliente: '', tipo: 'VMware', gerente: '', arquiteto: '', patrocinador: '', contrato: '', dataAssinatura: '', modeloFaturamento: '', parceiro: '',
  inicio: '', termino: '', objetivo: '', escopoIncluido: '', escopoExcluido: '', premissas: '', dependencias: '', restricoes: '',
  atividades: [novaAtividade([], 'Iniciação')], riscos: [novoRisco(1)], equipe: [], tarefasModelo: []
});

/** Lista do que falta para enviar (vazia = pode enviar). */
export function validar(f: FormProjeto, d: Dados, _hoje: string): string[] {   // datas passadas são permitidas (projetos anteriores)
  const e: string[] = [];
  if (!f.codigo.trim()) e.push('informe o código');
  else if (d.projetos.some(p => p.codigo.toLowerCase() === f.codigo.trim().toLowerCase())) e.push('esse código já existe');
  else if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(f.codigo.trim())) e.push('o código deve seguir o padrão CLIENTE-SIGLA (ex.: TRF1-VCF)');
  if (!f.nome.trim()) e.push('informe o nome');
  if (!f.cliente.trim()) e.push('informe o cliente');
  if (!f.modeloFaturamento) e.push('escolha o modelo de faturamento');
  e.push(...faltasFaturamento(f));
  if (!f.gerente.trim()) e.push('informe o GP');
  else if (!tecnicoPorNome(gerentesParaCadastro(d.tecnicos || []), f.gerente)) e.push('escolha um gerente ativo com função Gerente no Portal Tecnicos');
  if (!f.inicio || !f.termino) e.push('informe início e término');
  else if (f.termino < f.inicio) e.push('o término do projeto é antes do início');
  if (!f.objetivo.trim()) e.push('descreva o objetivo');
  const at = f.atividades.filter(a => a.nome.trim());
  if (!at.length) e.push('inclua ao menos uma atividade');
  if (f.equipe.some(m => /^fiscal$/i.test(m.funcao.trim()) && !(m.telefone || '').trim())) e.push('informe o telefone do fiscal');
  if (at.some(a => !a.inicio || !a.termino || a.termino < a.inicio)) e.push('confira as datas das atividades');
  return e;
}

/** Converte o formulário no projeto completo (atividades viram baseline; gates G1–G4 criados). */
export function montarProjeto(f: FormProjeto, situacao: SituacaoCadastro, aprovacaoPmo?: { por: string; em: string }, tecnicos: Tecnico[] = []): NovoProjeto {
  const codigo = f.codigo.trim().toUpperCase();
  const atividades: Atividade[] = f.atividades.filter(a => a.nome.trim()).map(a => ({
    codigo: a.codigo, nome: a.nome.trim(), fase: a.fase, equipe: a.equipe.trim() || 'Systech',
    duracao: Math.max(1, diasUteis(a.inicio, a.termino)), descricao: '', marco: a.marco,
    inicio: a.inicio, termino: a.termino, baselineInicio: a.inicio, baselineTermino: a.termino,
    status: 'Planejado', percentual: 0, pai: '', observacao: '',
    ...(a.horasPlanejadas ? { horasPlanejadas: a.horasPlanejadas } : {}), ...(a.predecessoras?.length ? { predecessoras: a.predecessoras } : {}),
    ...(a.descricao ? { descricao: a.descricao } : {})
  }));
  // tarefas do modelo: só as que ainda têm a atividade principal; entram em preparação (o PMO lança para os técnicos)
  const principais = new Set(atividades.map(a => a.codigo));
  for (const t of f.tarefasModelo || []) {
    if (!principais.has(t.pai) || !t.nome.trim()) continue;
    atividades.push({ codigo: t.codigo, nome: t.nome.trim(), fase: t.fase, equipe: t.equipe || 'Systech', duracao: Math.max(1, diasUteis(t.inicio, t.termino)),
      descricao: t.descricao || '', marco: !!t.marco, inicio: t.inicio, termino: t.termino, baselineInicio: t.inicio, baselineTermino: t.termino,
      status: 'Planejado', percentual: 0, pai: t.pai, observacao: '', lancada: false,
      ...(t.horasPlanejadas ? { horasPlanejadas: t.horasPlanejadas } : {}), ...(t.predecessoras?.length ? { predecessoras: t.predecessoras } : {}) });
  }
  const fimDaFase = (fase: Fase) => atividades.filter(a => a.fase === fase).map(a => a.termino).sort().pop() || '';
  const gate = (fase: Fase, g: string, nome: string, data: string, info = '', sit: Gate['situacao'] = 'Pendente'): Gate => ({ fase, gate: g, nome, situacao: sit, data, info });
  const riscos: Risco[] = f.riscos.filter(r => r.descricao.trim()).map(r => ({
    ...r, descricao: r.descricao.trim(), impactoProjeto: '', cenarios: '', contingencia: '', situacao: 'Aberto'
  }));
  return {
    projeto: {
      codigo, nome: f.nome.trim(), cliente: f.cliente.trim(), tipo: f.tipo, fase: aprovacaoPmo ? 'Planejamento' : 'Iniciação', farol: 'Verde', situacaoCadastro: situacao,
      gerente: f.gerente.trim(), arquiteto: f.arquiteto.trim(), patrocinador: f.patrocinador.trim(), contrato: f.contrato.trim(), dataAssinatura: f.dataAssinatura || undefined, modeloFaturamento: f.modeloFaturamento || undefined, parceiro: f.parceiro.trim() || undefined,
      inicio: f.inicio, terminoBaseline: f.termino, terminoPrevisto: f.termino, objetivo: f.objetivo.trim(),
      escopoIncluido: linhas(f.escopoIncluido), escopoExcluido: linhas(f.escopoExcluido), premissas: linhas(f.premissas),
      dependencias: linhas(f.dependencias), restricoes: linhas(f.restricoes), numeros: null,
      equipe: montarEquipe(f, tecnicos),
      fases: [
        aprovacaoPmo
          ? { ...gate('Iniciação', 'G1', 'G1 · Termo de abertura aprovado', fimDaFase('Iniciação') || f.inicio, 'Projeto criado e aprovado pelo patrocinador.', 'Aprovado'), aprovadoPor: aprovacaoPmo.por, dataAprovacao: aprovacaoPmo.em, parecer: 'Criado pelo patrocinador' }
          : gate('Iniciação', 'G1', 'G1 · Termo de abertura aprovado', fimDaFase('Iniciação') || f.inicio, 'Aprovação do cadastro pelo patrocinador.', situacao === 'Em aprovação' ? 'Aguardando aprovação' : 'Pendente'),
        gate('Planejamento', 'G2', 'G2 · Linha de base aprovada', fimDaFase('Planejamento')),
        gate('Execução', 'G3', 'G3 · Aceite por marco', fimDaFase('Execução')),
        gate('Encerramento', 'G4', 'G4 · Termo de aceite final', fimDaFase('Encerramento') || f.termino)
      ]
    },
    atividades,
    riscos
  };
}

/** Cronograma padrão Systech a partir do início informado (dias úteis, fases em sequência; Monitoramento acompanha o Encerramento). */
export function cronogramaModelo(inicio: string): LinhaAtividade[] {
  let cursor = inicio || hojeIso();
  if (!diaUtilIso(cursor)) cursor = somarDiasUteis(cursor, 1);
  const linhas: LinhaAtividade[] = [];
  let iniEnc = '', fimEnc = '';
  for (const a of CRONOGRAMA_SYSTECH.filter(x => !x.paralela)) {
    const ini = cursor, fim = somarDiasUteis(ini, a.dias - 1);
    if (a.fase === 'Encerramento') { iniEnc = iniEnc || ini; fimEnc = fim; }
    linhas.push({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: ini, termino: fim, marco: !!a.marco });
    cursor = somarDiasUteis(fim, 1);
  }
  const paralelas = CRONOGRAMA_SYSTECH.filter(x => x.paralela).map(a => ({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: iniEnc, termino: fimEnc, marco: false }));
  const posExec = linhas.findIndex(l => l.fase === 'Encerramento');
  linhas.splice(posExec < 0 ? linhas.length : posExec, 0, ...paralelas);
  return renumerar(linhas);
}

export function riscosModelo(): LinhaRisco[] {
  return RISCOS_SYSTECH.map(r => ({ ...r }));
}

/** Equipe informada + GP e arquiteto (se ainda não estiverem na lista). */
export function montarEquipe(f: FormProjeto, tecnicos: Tecnico[] = []): MembroEquipe[] {
  const lista = f.equipe.filter(m => m.nome.trim()).map(m => ({ nome: m.nome.trim(), funcao: m.funcao.trim(), empresa: m.empresa.trim(), email: m.email.trim(), ...(m.telefone?.trim() ? { telefone: m.telefone.trim() } : {}) }));
  const tem = (n: string) => lista.some(m => m.nome.toLowerCase() === n.toLowerCase());
  const extra: MembroEquipe[] = [];
  // gerente e arquiteto que estão na tabela de técnicos entram com o e-mail de lá
  if (f.gerente.trim() && !tem(f.gerente.trim())) extra.push({ nome: f.gerente.trim(), funcao: 'Gerente de projeto', empresa: 'Systech', email: tecnicoPorNome(tecnicos, f.gerente)?.email || '' });
  if (f.arquiteto.trim() && !tem(f.arquiteto.trim())) {
    extra.push({ nome: f.arquiteto.trim(), funcao: 'Arquiteto', empresa: 'Systech', email: f.arquitetoEmail || tecnicoPorNome(tecnicos, f.arquiteto)?.email || '' });
  }
  return [...extra, ...lista];
}

/**
 * Coloca uma pessoa na equipe com a função indicada, sem repetir: se ela já está na equipe (mesmo e-mail ou nome),
 * só troca a função daquela linha; se a função já tem outra pessoa (ex.: gerente), substitui; senão, acrescenta.
 */
export function colocarNaEquipe(equipe: FormProjeto['equipe'], funcao: string, nome: string, email: string): FormProjeto['equipe'] {
  const n = (s: string) => s.trim().toLowerCase();
  const mesma = (m: FormProjeto['equipe'][number]) => (!!email && n(m.email || '') === n(email)) || n(m.nome) === n(nome);
  const i = equipe.findIndex(mesma);
  if (i >= 0) return equipe.map((m, k) => (k === i ? { ...m, funcao, nome, email: email || m.email, empresa: m.empresa || 'Systech' } : m));
  const j = equipe.findIndex(m => m.funcao === funcao && (funcao === 'Gerente de projeto' || funcao === 'Arquiteto'));
  const pessoa = { nome, funcao, empresa: 'Systech', email };
  return j >= 0 ? equipe.map((m, k) => (k === j ? { ...m, ...pessoa } : m)) : [...equipe, pessoa];
}

/** Responsáveis indicados em Dados gerais são a fonte oficial das suas linhas na equipe. */
export function atualizarResponsavelEquipe(equipe: MembroEquipe[], funcao: 'Gerente de projeto' | 'Arquiteto', nome: string, email: string): MembroEquipe[] {
  const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const atual = equipe.find(m => m.funcao === funcao && igual(m.nome, nome));
  // Reescolher o mesmo responsável não pode apagar telefone ou outros dados existentes.
  if (atual && nome.trim()) return equipe.filter(m => m.funcao !== funcao || m === atual)
    .map(m => m === atual ? { ...m, nome, email: email || m.email } : m);
  const semAnterior = equipe.filter(m => m.funcao !== funcao);
  return nome.trim() ? colocarNaEquipe(semAnterior, funcao, nome, email) : semAnterior;
}
