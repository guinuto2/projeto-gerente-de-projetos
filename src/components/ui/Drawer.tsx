import { useEffect, type FormEvent, type ReactNode } from 'react';
import { useBloqueioSincronizacao } from '../../state/PortalContext';

interface DrawerProps {
  titulo: string;
  subtitulo: string;
  aberto: boolean;
  salvando: boolean;
  erro?: string;
  aoFechar: () => void;
  aoSalvar: () => void;
  /** texto do botão principal (padrão: Salvar) */
  rotuloSalvar?: string;
  /** botões extras no rodapé, à esquerda (ex.: Excluir, Devolver) */
  acoes?: ReactNode;
  children: ReactNode;
}

/** Painel lateral de edição. Enquanto aberto, a releitura automática espera. */
export function Drawer({ titulo, subtitulo, aberto, salvando, erro, aoFechar, aoSalvar, rotuloSalvar = 'Salvar', acoes, children }: DrawerProps) {
  useBloqueioSincronizacao('drawer', aberto);
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [aberto, aoFechar]);
  if (!aberto) return null;
  const enviar = (e: FormEvent) => { e.preventDefault(); aoSalvar(); };
  return (
    <>
      <div className="fundoDr" onClick={aoFechar} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="drCab">
          <div><div className="sub">{subtitulo}</div><h2 className="h3" style={{ marginTop: 4 }}>{titulo}</h2></div>
          <button className="fechar" type="button" onClick={aoFechar} aria-label="Fechar">×</button>
        </div>
        <form className="drCorpo" id="drForm" onSubmit={enviar}>
          {children}
          {erro && <div className="msg erro">{erro}</div>}
        </form>
        <div className="drPe">
          {acoes && <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>{acoes}</div>}
          <button className="btn" type="button" onClick={aoFechar}>Cancelar</button>
          <button className="btn pri" type="submit" form="drForm" disabled={salvando}>{salvando ? 'Salvando…' : rotuloSalvar}</button>
        </div>
      </aside>
    </>
  );
}
