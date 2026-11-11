/** Eixo de datas do Gantt: mantém rótulos legíveis mesmo em projetos de vários anos. */
export interface MarcaCronograma { data: string; rotulo: string }

const DIA_MS = 86_400_000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Diferença exata de dias de calendário, sem deslocamentos por horário de verão/fuso. */
export function diasCorridos(inicio: string, fim: string): number {
  const [ai, mi, di] = inicio.slice(0, 10).split('-').map(Number);
  const [af, mf, df] = fim.slice(0, 10).split('-').map(Number);
  return (Date.UTC(af, mf - 1, df) - Date.UTC(ai, mi - 1, di)) / DIA_MS;
}

/** Marcas semanais em períodos curtos; mensais com intervalos adaptativos em períodos longos. */
export function marcasCronograma(inicio: string, fim: string): MarcaCronograma[] {
  const total = diasCorridos(inicio, fim);
  if (total <= 105) {
    const marcas: MarcaCronograma[] = [];
    const [a, m, d] = inicio.split('-').map(Number);
    const cursor = new Date(Date.UTC(a, m - 1, d));
    while (cursor.toISOString().slice(0, 10) <= fim) {
      const data = cursor.toISOString().slice(0, 10);
      marcas.push({ data, rotulo: `${data.slice(8, 10)}/${data.slice(5, 7)}` });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return marcas;
  }

  const [ai, mi] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  const meses = (af - ai) * 12 + mf - mi + 1;
  // Evita rótulos sobrepostos no espaço mínimo de 700 px reservado ao eixo.
  const passo = [1, 2, 3, 4, 6, 12, 18, 24, 36].find(p => Math.ceil(meses / p) <= 10) || Math.ceil(meses / 10);
  const cursor = new Date(Date.UTC(ai, mi - 1, 1));
  if (cursor.toISOString().slice(0, 10) < inicio) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  const marcas: MarcaCronograma[] = [];
  while (cursor.toISOString().slice(0, 10) <= fim) {
    const data = cursor.toISOString().slice(0, 10);
    marcas.push({ data, rotulo: `${MESES[cursor.getUTCMonth()]}/${String(cursor.getUTCFullYear()).slice(-2)}` });
    cursor.setUTCMonth(cursor.getUTCMonth() + passo);
  }
  return marcas;
}
