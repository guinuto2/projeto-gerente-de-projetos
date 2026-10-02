import { useEffect, type ReactNode } from 'react';
import { useBloqueioSincronizacao } from '../../state/PortalContext';

interface Props {
  titulo: string;
  children: ReactNode;
  rotuloConfirmar: string;
  ocupado?: boolean;
  erro?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/** Janela de confirmação centralizada (usada nas ações diretas do PMO). */
export function Confirmacao({ titulo, children, rotuloConfirmar, ocupado = false, erro, aoConfirmar, aoCancelar }: Props) {
  useBloqueioSincronizacao('confirmacao', true);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ocupado) aoCancelar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [aoCancelar, ocupado]);
  return (
    <>
      <div className="fundoDr" onClick={() => !ocupado && aoCancelar()} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirmacao-titulo">
        <h2 id="confirmacao-titulo" className="h3">{titulo}</h2>
        {children}
        {erro && <div className="msg erro">{erro}</div>}
        <div className="linha" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" disabled={ocupado} onClick={aoCancelar}>Cancelar</button>
          <button type="button" className="btn pri" disabled={ocupado} onClick={aoConfirmar} autoFocus>{ocupado ? 'Salvando…' : rotuloConfirmar}</button>
        </div>
      </div>
    </>
  );
}
