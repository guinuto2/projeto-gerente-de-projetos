import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../state/PortalContext';
import type { Notificacao } from '../../types/models';

const ICONE: Record<string, string> = { tarefa: '🗂', atraso: '⏰', aprovacao: '✅', reprogramacao: '📅', status: '🔄', projeto: '📁' };

function haQuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d < 7 ? `há ${d} dia(s)` : new Date(iso).toLocaleDateString('pt-BR');
}

/** Sino do cabeçalho: avisos do portal para quem está logado. */
export function Sino() {
  const { notificacoes, marcarNotificacoesLidas } = usePortal();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const naoLidas = notificacoes.filter(n => !n.lida);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);
  const abrir = (n: Notificacao) => {
    if (!n.lida) marcarNotificacoesLidas([n.id]);
    setAberto(false);
    if (n.link) navegar(n.link);
  };
  return (
    <div className="sino" ref={caixa}>
      <button type="button" className="sinoBtn" aria-label={`Avisos${naoLidas.length ? `: ${naoLidas.length} não lido(s)` : ''}`} aria-expanded={aberto} onClick={() => setAberto(v => !v)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {naoLidas.length > 0 && <span className="sinoN">{naoLidas.length > 9 ? '9+' : naoLidas.length}</span>}
      </button>
      {aberto && (
        <div className="sinoCaixa" role="dialog" aria-label="Avisos">
          <div className="sinoTopo">
            <b>Avisos</b>
            {naoLidas.length > 0 && <button type="button" className="linkBtn" onClick={() => marcarNotificacoesLidas(naoLidas.map(n => n.id))}>Marcar todos como lidos</button>}
          </div>
          {!notificacoes.length && <p className="sub" style={{ padding: '14px 16px' }}>Nenhum aviso por enquanto.</p>}
          <div className="sinoLista">
            {notificacoes.slice(0, 30).map(n => (
              <button key={n.id} type="button" className={`sinoItem ${n.lida ? '' : 'nova'}`} onClick={() => abrir(n)}>
                <span className="sinoIco" aria-hidden="true">{ICONE[n.tipo] || '🔔'}</span>
                <span className="sinoTxt">
                  <span className="sinoTit">{n.titulo}</span>
                  <span className="sinoDesc">{n.texto}</span>
                  <span className="sinoQuando">{haQuanto(n.quando)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
