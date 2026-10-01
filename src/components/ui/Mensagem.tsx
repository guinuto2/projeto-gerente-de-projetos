import type { ReactNode } from 'react';

export function Mensagem({ tipo, children, className = '' }: { tipo: 'ok' | 'erro' | 'info'; children: ReactNode; className?: string }) {
  return <div className={`msg ${tipo} ${className}`} role={tipo === 'erro' ? 'alert' : undefined}>{children}</div>;
}
