import type { ReactNode } from 'react';

export function Kpi({ rotulo, valor, nota, alerta = false, children }: { rotulo: string; valor?: ReactNode; nota?: string; alerta?: boolean; children?: ReactNode }) {
  return (
    <div className="kpi">
      <div className="kpiR">{rotulo}</div>
      {valor !== undefined && <div className={`kpiV ${alerta ? 'alerta' : ''}`}>{valor}</div>}
      {children}
      {nota && <div className="kpiN">{nota}</div>}
    </div>
  );
}
