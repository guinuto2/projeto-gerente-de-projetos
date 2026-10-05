/**
 * CSV no formato que o Excel em português abre direto: separador ";", UTF-8 com BOM (acentos certos),
 * datas dd/mm/aaaa e números com vírgula.
 */
import type { Dados, Projeto } from '../types/models';
import { dma, diasUteis } from './datas';

const celula = (v: unknown): string => {
  const s = v === undefined || v === null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const data = (s?: string) => (s ? dma(s) : '');

function montarCsv(cabecalho: string[], linhas: unknown[][]): string {
  return '\uFEFF' + [cabecalho, ...linhas].map(l => l.map(celula).join(';')).join('\r\n');
}

/** Baixa o arquivo no navegador. */
export function baixarCsv(nomeArquivo: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Planejamento: todas as atividades do cronograma (macro e subatividades). */
export function csvCronograma(d: Dados, p: Projeto): string {
  const lista = [...(d.atividades[p.codigo] || [])].sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }));
  return montarCsv(
    ['Projeto', 'Código', 'Atividade', 'Atividade pai', 'Fase', 'Equipe', 'Início previsto', 'Término previsto', 'Dias úteis',
      'Início baseline', 'Término baseline', 'Desvio no término (dias úteis)', 'Status', '% concluído', 'Marco',
      'Reunião (tipo)', 'Reunião (data e hora)', 'Descrição', 'Observação'],
    lista.map(a => {
      const desvio = a.termino && a.baselineTermino && a.termino !== a.baselineTermino
        ? diasUteis(a.baselineTermino, a.termino) + (a.termino > a.baselineTermino ? -1 : 1) : 0;
      return [p.codigo, a.codigo, a.nome, a.pai, a.fase, a.equipe, data(a.inicio), data(a.termino),
        a.inicio && a.termino ? diasUteis(a.inicio, a.termino) : '', data(a.baselineInicio), data(a.baselineTermino), desvio,
        a.status, a.percentual, a.marco ? 'Sim' : 'Não', a.reuniaoTipo || '',
        a.reuniaoInicio ? `${dma(a.reuniaoInicio.slice(0, 10))} ${a.reuniaoInicio.slice(11, 16)}` : '', a.descricao, a.observacao];
    })
  );
}

export function csvRiscos(d: Dados, p: Projeto): string {
  return montarCsv(
    ['Projeto', 'ID', 'Risco', 'Impacto no projeto', 'Probabilidade', 'Impacto', 'Mitigação', 'Contingência', 'Responsável', 'Situação'],
    (d.riscos[p.codigo] || []).map(r => [p.codigo, r.codigo, r.descricao, r.impactoProjeto, r.probabilidade, r.impacto, r.mitigacao, r.contingencia, r.responsavel, r.situacao])
  );
}

export function csvPendencias(d: Dados, p: Projeto): string {
  return montarCsv(
    ['Projeto', 'ID', 'Pendência', 'Detalhamento', 'Impacto', 'Situação', 'Resposta'],
    (d.pendencias[p.codigo] || []).map(x => [p.codigo, x.codigo, x.pergunta, x.detalhe, x.impacto, x.situacao, x.resposta || ''])
  );
}
