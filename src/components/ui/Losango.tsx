import { GATE_COR } from '../../lib/constantes';

/** Gate de aprovação entre fases. */
export function Losango({ texto, situacao, grande = false, titulo }: { texto: string; situacao: string; grande?: boolean; titulo?: string }) {
  return (
    <div className={`los ${grande ? 'g' : ''}`} title={titulo} style={{ background: GATE_COR[situacao] || '#A3A6AB' }}>
      <span>{texto}</span>
    </div>
  );
}
