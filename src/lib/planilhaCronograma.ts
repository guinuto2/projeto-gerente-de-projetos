/** Planilha do cronograma: só as atividades e as datas previstas, agrupadas por fase. */
import type { Dados, Projeto } from '../types/models';
import { FASES } from './constantes';
import { dma } from './datas';
import { macro } from './calculos';
import { ESTILO, gerarXlsx, serialExcel, type Celula } from './xlsx';

export function planilhaCronograma(d: Dados, p: Projeto, hoje: string): Blob {
  const linhas: Celula[][] = [
    [{ v: `Cronograma · ${p.codigo} · ${p.nome}`, s: ESTILO.titulo }],
    [{ v: `${p.cliente || 'Cliente não informado'}  ·  Gerente: ${p.gerente || '—'}  ·  ${dma(hoje)}`, s: ESTILO.subtitulo }],
    [],
    [{ v: 'Código', s: ESTILO.cabecalho }, { v: 'Atividade', s: ESTILO.cabecalho }, { v: 'Início previsto', s: ESTILO.cabecalho }, { v: 'Término previsto', s: ESTILO.cabecalho }]
  ];
  const mesclas: string[] = [];   // título e subtítulo sem mesclar: o texto se estende pela linha
  // ordem do planejamento: pela data de início; no empate, pelo código
  const ordem = (a: { inicio: string; codigo: string }, b: { inicio: string; codigo: string }) =>
    (a.inicio || '9999').localeCompare(b.inicio || '9999') || a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true });
  for (const fase of FASES) {
    const lista = macro(d, p.codigo).filter(a => a.fase === fase).sort(ordem);
    if (!lista.length) continue;
    const r = linhas.length + 1;
    linhas.push([{ v: fase, s: ESTILO.fase }, { v: null, s: ESTILO.fase }, { v: null, s: ESTILO.fase }, { v: null, s: ESTILO.fase }]);
    mesclas.push(`A${r}:D${r}`);
    lista.forEach((a, i) => {
      const z = i % 2 === 1;
      const data = (s: string): Celula => (s ? { v: serialExcel(s), s: z ? ESTILO.dataZebra : ESTILO.data } : { v: '—', s: z ? ESTILO.dataZebra : ESTILO.data });
      linhas.push([
        { v: a.codigo, s: z ? ESTILO.codigoZebra : ESTILO.codigo },
        { v: a.nome, s: z ? ESTILO.textoZebra : ESTILO.texto },
        data(a.inicio), data(a.termino)
      ]);
    });
  }
  return gerarXlsx({
    nomeAba: 'Cronograma', larguras: [10, 62, 17, 17], linhas, mesclas,
    congelarLinhas: 4, filtro: `A4:D${linhas.length}`
  });
}
