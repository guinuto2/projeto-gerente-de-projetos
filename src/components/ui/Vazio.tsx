import type { ReactNode } from 'react';

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>;
}
