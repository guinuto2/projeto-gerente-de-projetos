import type { ReactNode } from 'react';

export interface Aba { id: string; rotulo: string; contagem?: number }

export function Abas({ abas, ativa, aoMudar, direita }: { abas: Aba[]; ativa: string; aoMudar: (id: string) => void; direita?: ReactNode }) {
  return (
    <div className="abas" role="tablist">
      {abas.map(a => (
        <button key={a.id} type="button" role="tab" className={`aba ${a.id === ativa ? 'on' : ''}`} aria-selected={a.id === ativa} onClick={() => aoMudar(a.id)}>
          {a.rotulo}{a.contagem !== undefined && <span className="cnt">{a.contagem}</span>}
        </button>
      ))}
      {direita && <div className="abasDireita">{direita}</div>}
    </div>
  );
}
