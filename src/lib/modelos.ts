import type { Atividade, Fase } from '../types/models';
import { CRONOGRAMA_SYSTECH } from './modeloSystech';
import { dia, diasUteis, diaUtil, somarDiasUteis } from './datas';

const diaUtilIso = (s: string) => { const d = dia(s); return !!d && diaUtil(d); };

/**
 * Modelos de projeto: cronograma (atividades e tarefas) com datas relativas ao início do projeto, em dias úteis.
 * "inicio" = quantos dias úteis depois do início do projeto a atividade começa (0 = no primeiro dia); "dias" = duração.
 */
export interface ItemModelo {
  codigo: string; nome: string; fase: Fase; equipe: string; inicio: number; dias: number;
  marco?: boolean; pai?: string; horasPlanejadas?: number; predecessoras?: string[]; descricao?: string;
}
export interface ModeloProjeto { id: string; nome: string; tipo: string; descricao: string; itens: ItemModelo[]; padrao?: boolean; atualizadoPor?: string; atualizado?: string }

/** Modelo padrão Systech (o cronograma de 5 fases que já existia), valendo para qualquer tipo de projeto. */
export function modeloPadrao(): ModeloProjeto {
  const itens: ItemModelo[] = [];
  let cursor = 0, iniEnc = -1, fimEnc = 0;
  for (const a of CRONOGRAMA_SYSTECH.filter(x => !x.paralela)) {
    itens.push({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: cursor, dias: a.dias, marco: !!a.marco });
    if (a.fase === 'Encerramento') { if (iniEnc < 0) iniEnc = cursor; fimEnc = cursor + a.dias - 1; }
    cursor += a.dias;
  }
  for (const a of CRONOGRAMA_SYSTECH.filter(x => x.paralela))
    itens.push({ codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe, inicio: Math.max(0, iniEnc), dias: Math.max(1, fimEnc - Math.max(0, iniEnc) + 1) });
  return { id: 'padrao-systech', nome: 'Padrão Systech (5 fases)', tipo: '', descricao: 'Cronograma padrão em 5 fases, para qualquer tipo de projeto.', itens, padrao: true };
}

/** Datas reais a partir do início do projeto. */
export function datasDoItem(it: ItemModelo, inicioProjeto: string): { inicio: string; termino: string } {
  let base = inicioProjeto;
  if (!diaUtilIso(base)) base = somarDiasUteis(base, 1);
  const inicio = it.inicio > 0 ? somarDiasUteis(base, it.inicio) : base;
  return { inicio, termino: somarDiasUteis(inicio, Math.max(1, it.dias) - 1) };
}

/** Transforma as atividades de um projeto em itens de modelo (datas relativas ao início do projeto). */
export function itensDoProjeto(atividades: Atividade[], inicioProjeto: string): ItemModelo[] {
  return atividades.filter(a => a.status !== 'Cancelado').map(a => ({
    codigo: a.codigo, nome: a.nome, fase: a.fase, equipe: a.equipe || 'Systech',
    inicio: a.inicio && a.inicio > inicioProjeto ? Math.max(0, diasUteis(inicioProjeto, a.inicio) - 1) : 0,
    dias: Math.max(1, diasUteis(a.inicio, a.termino)), marco: !!a.marco, pai: a.pai || undefined,
    horasPlanejadas: a.horasPlanejadas, predecessoras: a.predecessoras?.length ? a.predecessoras : undefined, descricao: a.descricao || undefined
  })).sort((x, y) => x.codigo.localeCompare(y.codigo, 'pt-BR', { numeric: true }));
}

/** Identificador do modelo a partir do nome. */
export const idDoModelo = (nome: string) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'modelo';
