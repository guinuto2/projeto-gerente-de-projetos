/** Datas trafegam como texto ISO 'aaaa-mm-dd' (sem fuso) em todo o portal. */

const FERIADOS = new Set([
  '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-20', '2026-12-25',
  '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21', '2027-05-01', '2027-05-27'
]);

export function dia(iso?: string | null): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function iso(d?: Date | null): string {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Converte data/hora vinda do SharePoint (UTC) para a data local. */
export const isoDeDataHora = (v?: string | null): string => (v ? iso(new Date(v)) : '');

export function dm(s?: string): string {
  const d = dia(s);
  return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '—';
}

export function dma(s?: string): string {
  const d = dia(s);
  return d ? `${dm(s)}/${d.getFullYear()}` : '—';
}

export const diaUtil = (d: Date): boolean => d.getDay() > 0 && d.getDay() < 6 && !FERIADOS.has(iso(d));

/** Dias úteis de a até b, contando os dois extremos (negativo se b < a). */
export function diasUteis(a?: string, b?: string): number {
  const da = dia(a), db = dia(b);
  if (!da || !db) return 0;
  const sinal = db >= da ? 1 : -1;
  let n = 0;
  const d = new Date(da);
  while (sinal > 0 ? d <= db : d >= db) {
    if (diaUtil(d)) n++;
    d.setDate(d.getDate() + sinal);
  }
  return sinal * n;
}

/** Desloca uma data em n dias úteis. */
export function somarDiasUteis(s: string, n: number): string {
  const d = dia(s);
  if (!d) return s;
  let falta = Math.abs(n);
  const sinal = n >= 0 ? 1 : -1;
  while (falta > 0) {
    d.setDate(d.getDate() + sinal);
    if (diaUtil(d)) falta--;
  }
  return iso(d);
}

export const hojeIso = (): string => iso(new Date());
export const horaAgora = (): string => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Texto multilinha → lista sem linhas vazias. */
export const linhas = (t?: string | string[] | null): string[] =>
  (Array.isArray(t) ? t : String(t || '').split(/\r?\n/)).map(x => String(x).trim()).filter(Boolean);

export const extensao = (nome: string): string => (nome.split('.').pop() || '').toLowerCase();
