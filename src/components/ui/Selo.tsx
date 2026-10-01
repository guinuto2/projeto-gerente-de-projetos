import type { Cores } from '../../lib/constantes';

/** Etiqueta colorida (status, situação, farol). */
export function Selo({ valor, cores, forte = false }: { valor: string; cores: Record<string, Cores>; forte?: boolean }) {
  const [fundo, texto] = cores[valor] || ['#EEF0F3', '#3C4757'];
  return <span className={forte ? 'sf' : 'stp'} style={{ background: fundo, color: texto }}>{valor}</span>;
}
