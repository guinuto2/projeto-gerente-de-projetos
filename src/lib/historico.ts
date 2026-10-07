/**
 * Traduz cada ação do portal num registro de histórico legível ("Editou 1.7 · status: Planejado → Em andamento").
 * Recebe o nome da ação, os argumentos, os dados de antes e o resultado.
 */
import type { Atividade, Dados, MembroEquipe, NovaReuniao, NovoProjeto, Pendencia, Projeto, Risco } from '../types/models';
import { dma } from './datas';

export interface Lancamento { cod: string; tipo: string; acao: string; descricao: string }

const data = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? dma(s.slice(0, 10)) : s || '—');
const hora = (s?: string) => (s ? `${data(s)} ${s.slice(11, 16)}` : '—');
const fmt = (v: unknown, tipo?: 'data' | 'texto') => {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (tipo === 'data') return data(String(v));
  return String(v);
};

/** Diferenças entre o antes e os campos novos, só nos campos rotulados. */
function diferencas<T extends object>(antes: T, campos: Partial<T>, rotulos: Record<string, [string, ('data' | 'longo')?]>): string[] {
  const out: string[] = [];
  for (const [k, [rotulo, tipo]] of Object.entries(rotulos)) {
    if (!(k in campos)) continue;
    const a = (antes as Record<string, unknown>)[k], d = (campos as Record<string, unknown>)[k];
    // vazio, ausente e "Não" (falso) contam como a mesma coisa
    const n = (v: unknown) => (v === undefined || v === null || v === '' || v === false ? '' : v);
    if (JSON.stringify(n(a)) === JSON.stringify(n(d))) continue;
    if (tipo === 'longo') out.push(`${rotulo}: texto alterado`);
    else out.push(`${rotulo}: ${fmt(a, tipo === 'data' ? 'data' : undefined)} → ${fmt(d, tipo === 'data' ? 'data' : undefined)}`);
  }
  return out;
}

const ROTULOS_ATIVIDADE: Record<string, [string, ('data' | 'longo')?]> = {
  nome: ['nome'], fase: ['fase'], equipe: ['equipe'], inicio: ['início', 'data'], termino: ['término', 'data'], status: ['status'],
  percentual: ['%'], marco: ['marco'], responsavel: ['responsável'], descricao: ['descrição', 'longo'], observacao: ['observação', 'longo'],
  dataReal: ['data real', 'data'], dependeRdm: ['depende de RDM'], numeroRdm: ['nº RDM'], impedimento: ['impedimento'],
  causaAtraso: ['causa do atraso'], horasRealizadas: ['horas realizadas']
};
const ROTULOS_PROJETO: Record<string, [string, ('data' | 'longo')?]> = {
  nome: ['nome'], cliente: ['cliente'], tipo: ['tipo'], gerente: ['gerente'], arquiteto: ['arquiteto'], farol: ['farol'],
  inicio: ['início', 'data'], terminoPrevisto: ['término previsto', 'data'], objetivo: ['objetivo', 'longo'],
  escopoIncluido: ['escopo incluído', 'longo'], escopoExcluido: ['escopo excluído', 'longo'], premissas: ['premissas', 'longo'],
  dependencias: ['dependências', 'longo'], restricoes: ['restrições', 'longo']
};
const ROTULOS_RISCO: Record<string, [string, ('data' | 'longo')?]> = {
  probabilidade: ['probabilidade'], impacto: ['impacto'], situacao: ['situação'], responsavel: ['responsável'], mitigacao: ['mitigação', 'longo']
};
const ROTULOS_PENDENCIA: Record<string, [string, ('data' | 'longo')?]> = { situacao: ['situação'], resposta: ['resposta', 'longo'] };

function equipeMudou(antes: MembroEquipe[], depois?: MembroEquipe[]): string[] {
  if (!depois) return [];
  const nomes = (l: MembroEquipe[]) => new Set(l.map(m => m.nome));
  const a = nomes(antes), d = nomes(depois);
  return [...[...d].filter(n => !a.has(n)).map(n => `entrou na equipe: ${n}`), ...[...a].filter(n => !d.has(n)).map(n => `saiu da equipe: ${n}`)];
}

const atv = (d: Dados, cod: string, codigo: string) => (d.atividades[cod] || []).find(a => a.codigo === codigo);
const projetoDe = (d: Dados, cod: string) => d.projetos.find(p => p.codigo === cod);
const tipoAtv = (a?: Atividade) => (a?.pai ? 'Subatividade' : 'Atividade');
const juntar = (cab: string, partes: string[]) => (partes.length ? `${cab} · ${partes.join('; ')}` : cab);

export function descrever(nome: string, args: unknown[], d: Dados, resultado: unknown): Lancamento | null {
  const cod = String(args[0] ?? '');
  switch (nome) {
    case 'criarProjeto': {
      const { projeto: p, atividades, riscos } = args[0] as NovoProjeto;
      const situacao = p.situacaoCadastro === 'Rascunho' ? 'salvo como rascunho' : p.situacaoCadastro === 'Ativo' ? 'ativo (já aprovado)' : 'enviado para aprovação do patrocinador';
      return { cod: p.codigo, tipo: 'Projeto', acao: 'Criou', descricao: `Projeto ${p.codigo} criado · ${p.nome} · ${situacao} · ${atividades.length} atividades, ${riscos.length} riscos, ${p.equipe.length} pessoas na equipe` };
    }
    case 'editarProjeto': {
      const p = projetoDe(d, cod); if (!p) return null;
      const campos = args[1] as Partial<Projeto>;
      const partes = [...diferencas(p, campos, ROTULOS_PROJETO), ...equipeMudou(p.equipe, campos.equipe)];
      return partes.length ? { cod, tipo: 'Projeto', acao: 'Editou', descricao: juntar('Dados do projeto', partes) } : null;
    }
    case 'excluirProjeto': {
      const n = (k: 'atividades' | 'riscos' | 'pendencias') => (d[k][cod] || []).length;
      return { cod, tipo: 'Projeto', acao: 'Excluiu', descricao: `Projeto excluído com ${n('atividades')} atividades, ${n('riscos')} riscos e ${n('pendencias')} pendências${(args[1] as { documentos?: boolean })?.documentos ? '; pasta de documentos enviada para a lixeira' : ''}` };
    }
    case 'submeterRascunho':
      return { cod, tipo: 'Projeto', acao: args[1] === 'ativar' ? 'Ativou o rascunho' : 'Enviou o rascunho para aprovação', descricao: projetoDe(d, cod)?.nome || cod };
    case 'criarAtividade': {
      const a = args[1] as Atividade;
      return { cod, tipo: tipoAtv(a), acao: 'Criou', descricao: `${a.codigo} · ${a.nome} (${a.fase}, ${data(a.inicio)} a ${data(a.termino)})${a.pai ? ` dentro de ${a.pai}` : ''}` };
    }
    case 'salvarAtividade':
    case 'atualizarSemanal': {
      const a = atv(d, cod, String(args[1])); if (!a) return null;
      const partes = diferencas(a, args[2] as Partial<Atividade>, ROTULOS_ATIVIDADE);
      if (!partes.length) return null;
      return { cod, tipo: tipoAtv(a), acao: nome === 'atualizarSemanal' ? 'Atualização semanal' : 'Editou', descricao: juntar(`${a.codigo} · ${a.nome}`, partes) };
    }
    case 'excluirAtividade': {
      const a = atv(d, cod, String(args[1])); if (!a) return null;
      const subs = (d.atividades[cod] || []).filter(x => x.pai === a.codigo).length;
      return { cod, tipo: tipoAtv(a), acao: 'Excluiu', descricao: `${a.codigo} · ${a.nome}${subs ? ` (com ${subs} subatividades)` : ''}` };
    }
    case 'criarRisco': { const r = args[1] as Risco; return { cod, tipo: 'Risco', acao: 'Criou', descricao: `${r.codigo} · ${r.descricao} (probabilidade ${r.probabilidade}, impacto ${r.impacto})` }; }
    case 'salvarRisco': {
      const r = (d.riscos[cod] || []).find(x => x.codigo === args[1]); if (!r) return null;
      const partes = diferencas(r, args[2] as Partial<Risco>, ROTULOS_RISCO);
      return partes.length ? { cod, tipo: 'Risco', acao: 'Editou', descricao: juntar(`${r.codigo} · ${r.descricao}`, partes) } : null;
    }
    case 'excluirRisco': { const r = (d.riscos[cod] || []).find(x => x.codigo === args[1]); return { cod, tipo: 'Risco', acao: 'Excluiu', descricao: r ? `${r.codigo} · ${r.descricao}` : String(args[1]) }; }
    case 'criarPendencia': { const x = args[1] as Pendencia; return { cod, tipo: 'Pendência', acao: 'Criou', descricao: `${x.codigo} · ${x.pergunta}` }; }
    case 'salvarPendencia': {
      const x = (d.pendencias[cod] || []).find(y => y.codigo === args[1]); if (!x) return null;
      const campos = args[2] as Partial<Pendencia>;
      const partes = diferencas(x, campos, ROTULOS_PENDENCIA);
      return partes.length ? { cod, tipo: 'Pendência', acao: campos.situacao === 'Respondida' && x.situacao !== 'Respondida' ? 'Respondeu' : 'Editou', descricao: juntar(`${x.codigo} · ${x.pergunta}`, partes) } : null;
    }
    case 'excluirPendencia': { const x = (d.pendencias[cod] || []).find(y => y.codigo === args[1]); return { cod, tipo: 'Pendência', acao: 'Excluiu', descricao: x ? `${x.codigo} · ${x.pergunta}` : String(args[1]) }; }
    case 'solicitarGate': {
      const g = projetoDe(d, cod)?.fases.find(x => x.gate === args[1]);
      return { cod, tipo: 'Gate', acao: 'Solicitou aprovação', descricao: g?.nome || String(args[1]) };
    }
    case 'decidirGate': {
      const g = projetoDe(d, cod)?.fases.find(x => x.gate === args[1]);
      const o = args[2] as { aprovar: boolean; parecer: string; congelarBaseline?: boolean };
      return { cod, tipo: 'Gate', acao: o.aprovar ? 'Aprovou' : 'Devolveu ao PMO', descricao: `${g?.nome || args[1]}${o.parecer ? ` · parecer: ${o.parecer}` : ''}${o.congelarBaseline ? ' · linha de base congelada' : ''}` };
    }
    case 'removerGatesRepetidos': return { cod, tipo: 'Gate', acao: 'Removeu repetidos', descricao: `${resultado} gate(s) repetido(s) removido(s) da lista` };
    case 'agendarReuniao': {
      const a = args[1] as Atividade, r = args[2] as NovaReuniao, convidados = (resultado as string[]) || [];
      const prefixo = r.tipo && !r.titulo.startsWith(r.tipo) ? r.tipo + ' · ' : '';
      return { cod, tipo: 'Reunião', acao: 'Agendou', descricao: `${prefixo}${r.titulo} em ${hora(r.inicio)} (${r.duracaoMin} min) · atividade ${a.codigo} · ${convidados.length} convidado(s)` };
    }
    case 'atualizarReuniao': {
      const a = args[1] as Atividade, r = args[2] as NovaReuniao, antes = args[3] as NovaReuniao | undefined;
      const partes = [];
      if (antes && antes.inicio !== r.inicio) partes.push(`horário: ${hora(antes.inicio)} → ${hora(r.inicio)}`);
      if (antes && antes.duracaoMin !== r.duracaoMin) partes.push(`duração: ${antes.duracaoMin} → ${r.duracaoMin} min`);
      if (antes && (antes.tipo || '') !== (r.tipo || '')) partes.push(`tipo: ${antes.tipo || '—'} → ${r.tipo || '—'}`);
      if (antes && antes.titulo !== r.titulo) partes.push('título alterado');
      return { cod, tipo: 'Reunião', acao: 'Alterou', descricao: juntar(`${r.titulo} · atividade ${a.codigo}`, partes) };
    }
    case 'cancelarReuniao': {
      const a = args[1] as Atividade;
      return { cod, tipo: 'Reunião', acao: 'Cancelou', descricao: `${a.reuniaoTipo ? a.reuniaoTipo + ' · ' : ''}reunião de ${hora(a.reuniaoInicio)} da atividade ${a.codigo}${args[2] ? ` · mensagem: ${args[2]}` : ''}` };
    }
    case 'enviarDocumento': return { cod, tipo: 'Documento', acao: 'Enviou', descricao: `${(args[2] as File).name} em ${args[1]}` };
    case 'excluirDocumento': return { cod, tipo: 'Documento', acao: 'Excluiu', descricao: `${(args[2] as { nome: string }).nome} de ${args[1]}` };
    default: return null;
  }
}
