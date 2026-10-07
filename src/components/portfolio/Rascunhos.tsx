import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { pendenciasRascunho } from '../../lib/rascunho';

/** Projetos salvos como rascunho: ficam fora do portfólio até serem enviados ou ativados. */
export function Rascunhos({ projetos }: { projetos: Projeto[] }) {
  const { dados, hoje } = usePortal();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);   // começa fechada
  if (!projetos.length) return null;
  const abrir = (p: Projeto) => navegar(`/projeto/${encodeURIComponent(p.codigo)}`);
  return (
    <section className="card" id="rascunhos">
      <button type="button" className="secaoToggle" aria-expanded={aberto} onClick={() => setAberto(a => !a)}>
        <span className="h3">Rascunhos <span className="cnt">{projetos.length}</span></span>
        <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
      </button>
      {aberto && <div className="twrap" style={{ margin: '0 20px 20px' }}>
        <table className="tbl">
          <thead><tr><th>Código</th><th>Projeto</th><th>Cliente</th><th>Gerente</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {projetos.map(p => {
              const faltam = pendenciasRascunho(dados, p, hoje);
              return (
                <tr key={p.codigo} className="cl" tabIndex={0} onClick={() => abrir(p)} onKeyDown={e => { if (e.key === 'Enter') abrir(p); }}>
                  <td className="mono">{p.codigo}</td>
                  <td style={{ minWidth: 200, fontWeight: 500 }}>{p.nome}</td>
                  <td>{p.cliente || '—'}</td>
                  <td>{p.gerente || '—'}</td>
                  <td>{faltam.length
                    ? <span className="stp" style={{ background: '#FFF1D1', color: '#7A5200' }}>Falta: {faltam.length} item(ns)</span>
                    : <span className="stp" style={{ background: '#D7F0E3', color: '#145C3C' }}>Pronto para enviar</span>}</td>
                  <td><button type="button" className="btn pq" onClick={e => { e.stopPropagation(); abrir(p); }}>Continuar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </section>
  );
}
