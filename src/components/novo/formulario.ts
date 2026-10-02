import type { Atividade, Dados, Fase, Gate, MembroEquipe, Nivel, NovoProjeto, Risco, SituacaoCadastro } from '../../types/models';
import { dia, diasUteis, diaUtil, linhas, somarDiasUteis, hojeIso } from '../../lib/datas';
import { CRONOGRAMA_SYSTECH, RISCOS_SYSTECH } from '../../lib/modeloSystech';

const diaUtilIso = (s: string) => { const d = dia(s); return !!d && diaUtil(d); };
import { pessoaPorNome } from '../../lib/pessoas';

export interface LinhaAtividade { codigo: string; nome: string; fase: Fase; equipe: string; inicio: string; termino: string; marco: boolean }
export interface LinhaRisco { codigo: string; descricao: string; probabilidade: Nivel; impacto: Nivel; mitigacao: string; responsavel: string }

export interface FormProjeto {
  codigo: string; nome: string; cliente: string; tipo: string; gerente: string; arquiteto: string;
  patrocinador: string; contrato: string; inicio: string; termino: string; objetivo: string;
  escopoIncluido: string; escopoExcluido: string; premissas: string; dependencias: string; restricoes: string;
  atividades: LinhaAtividade[];
  riscos: LinhaRisco[];
  equipe: MembroEquipe[];
}

export const novaAtividade = (n: number): LinhaAtividade => ({ codigo: String(n), nome: '', fase: n === 1 ? 'Iniciação' : 'Execução', equipe: 'Systech', inicio: '', termino: '', marco: false });
export const novoRisco = (n: number): LinhaRisco => ({ codigo: 'R-' + n, descricao: '', probabilidade: 'Médio', impacto: 'Médio', mitigacao: '', responsavel: '' });

export const formVazio = (): FormProjeto => ({
  codigo: '', nome: '', cliente: '', tipo: 'VMware', gerente: '', arquiteto: '', patrocinador: '', contrato: '',
  inicio: '', termino: '', objetivo: '', escopoIncluido: '', escopoExcluido: '', premissas: '', dependencias: '', restricoes: '',
  atividades: [novaAtividade(1)], riscos: [novoRisco(1)], equipe: []
});

/** Lista do que falta para enviar (vazia = pode enviar). */
export function validar(f: FormProjeto, d: Dados): string[] {
  const e: string[] = [];
  if (!f.codigo.trim()) e.push('informe o código');
  else if (d.projetos.some(p => p.codigo.toLowerCase() === f.codigo.trim().toLowerCase())) e.push('esse código já existe');
  if (!f.nome.trim()) e.push('informe o nome');
  if (!f.cliente.trim()) e.push('informe o cliente');
  if (!f.gerente.trim()) e.push('informe o GP');
  if (!f.inicio || !f.termino) e.push('informe início e término');
  else if (f.termino < f.inicio) e.push('o término do projeto é antes do início');
  if (!f.objetivo.trim()) e.push('descreva o objetivo');
  const at = f.atividades.filter(a => a.nome.trim());
  if (!at.length) e.push('inclua ao menos uma atividade');
  if (at.some(a => !a.inicio || !a.termino || a.termino < a.inicio)) e.push('confira as datas das atividades');
  return e;
}

/** Converte o formulário no projeto completo (atividades viram baseline; gates G1–G4 criados). */
export function montarProjeto(f: FormProjeto, situacao: SituacaoCadastro, aprovacaoPmo?: { por: string; em: string }): NovoProjeto {
  const codigo = f.codigo.trim().toUpperCase();
  const atividades: Atividade[] = f.atividades.filter(a => a.nome.trim()).map(a => ({
    codigo: a.codigo, nome: a.nome.trim(), fase: a.fase, equipe: a.equipe.trim() || 'Systech',
    duracao: Math.max(1, diasUteis(a.inicio, a.termino)), descricao: '', marco: a.marco,
    inicio: a.inicio, termino: a.termino, baselineInicio: a.inicio, baselineTermino: a.termino,
    status: 'Planejado', percentual: 0, pai: '', observacao: ''
  }));
  const fimDaFase = (fase: Fase) => atividades.filter(a => a.fase === fase).map(a => a.termino).sort().pop() || '';
  const gate = (fase: Fase, g: string, nome: string, data: string, info = '', sit: Gate['situacao'] = 'Pendente'): Gate => ({ fase, gate: g, nome, situacao: sit, data, info });
  const riscos: Risco[] = f.riscos.filter(r => r.descricao.trim()).map(r => ({
    ...r, descricao: r.descricao.trim(), impactoProjeto: '', cenarios: '', contingencia: '', situacao: 'Aberto'
  }));
  return {
    projeto: {
      codigo, nome: f.nome.trim(), cliente: f.cliente.trim(), tipo: f.tipo, fase: aprovacaoPmo ? 'Planejamento' : 'Iniciação', farol: 'Verde', situacaoCadastro: situacao,
      gerente: f.gerente.trim(), arquiteto: f.arquiteto.trim(), patrocinador: f.patrocinador.trim(), contrato: f.contrato.trim(),
      inicio: f.inicio, terminoBaseline: f.termino, terminoPrevisto: f.termino, objetivo: f.objetivo.trim(),
      escopoIncluido: linhas(f.escopoIncluido), escopoExcluido: linhas(f.escopoExcluido), premissas: linhas(f.premissas),
      dependencias: linhas(f.dependencias), restricoes: linhas(f.restricoes), numeros: null,
      equipe: montarEquipe(f),
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

/** Cronograma padrão Systech a partir do início informado (dias úteis, fases em sequência; Monitoramento acompanha a Execução). */
export function cronogramaModelo(inicio: string): LinhaAtividade[] {
  let cursor = inicio || hojeIso();
  if (!diaUtilIso(cursor)) cursor = somarDiasUteis(cursor, 1);
  const linhas: LinhaAtividade[] = [];
  let iniExec = '', fimExec = '';
  for (const a of CRONOGRAMA_SYSTECH.filter(x => !x.paralela)) {
    const ini = cursor, fim = somarDiasUteis(ini, a.dias - 1);
    if (a.fase === 'Execução') { iniExec = iniExec || ini; fimExec = fim; }
    linhas.push({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: ini, termino: fim, marco: !!a.marco });
    cursor = somarDiasUteis(fim, 1);
  }
  const paralelas = CRONOGRAMA_SYSTECH.filter(x => x.paralela).map(a => ({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: iniExec, termino: fimExec, marco: false }));
  const posExec = linhas.findIndex(l => l.fase === 'Encerramento');
  linhas.splice(posExec < 0 ? linhas.length : posExec, 0, ...paralelas);
  return linhas;
}

export function riscosModelo(): LinhaRisco[] {
  return RISCOS_SYSTECH.map(r => ({ ...r }));
}

/** Equipe informada + GP e arquiteto (se ainda não estiverem na lista). */
export function montarEquipe(f: FormProjeto): MembroEquipe[] {
  const lista = f.equipe.filter(m => m.nome.trim()).map(m => ({ nome: m.nome.trim(), funcao: m.funcao.trim(), empresa: m.empresa.trim(), email: m.email.trim() }));
  const tem = (n: string) => lista.some(m => m.nome.toLowerCase() === n.toLowerCase());
  const extra: MembroEquipe[] = [];
  if (f.gerente.trim() && !tem(f.gerente.trim())) extra.push({ nome: f.gerente.trim(), funcao: 'Gerente de projeto', empresa: 'Systech', email: '' });
  if (f.arquiteto.trim() && !tem(f.arquiteto.trim())) {
    const cad = pessoaPorNome(f.arquiteto);
    extra.push({ nome: f.arquiteto.trim(), funcao: 'Arquiteto', empresa: cad?.empresa || 'Systech', email: cad?.email || '' });
  }
  return [...extra, ...lista];
}
