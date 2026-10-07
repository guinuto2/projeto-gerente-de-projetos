import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { desvio } from '../../lib/calculos';
import { dma } from '../../lib/datas';

/** Data de encerramento: aprovação do G4 ou, sem ela, o término previsto. */
const encerradoEm = (p: Projeto) => p.fases.find(g => g.gate === 'G4')?.dataAprovacao || p.terminoPrevisto || p.terminoBaseline;

/** Lista compacta dos projetos com o G4 aprovado. */
export function ProjetosEncerrados({ projetos }: { projetos: Projeto[] }) {
  const [aberto, setAberto] = useState(false);   // começa fechada
  const navegar = useNavigate();
  const lista = [...projetos].sort((a, b) => encerradoEm(b).localeCompare(encerradoEm(a)));
  const abrir = (p: Projeto) => navegar(`/projeto/${encodeURIComponent(p.codigo)}`);
  return (
    <section className="card" id="encerrados">
      <button type="button" className="secaoToggle" aria-expanded={aberto} onClick={() => setAberto(a => !a)}>
        <span className="h3">Projetos encerrados <span className="cnt">{lista.length}</span></span>
        <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
      </button>
      {aberto && (lista.length ? (
        <div className="twrap" style={{ margin: '0 20px 20px' }}>
          <table className="tbl">
            <thead><tr><th>Código</th><th>Projeto</th><th>Cliente</th><th>Tipo</th><th>GP</th><th>Encerrado em</th><th>Desvio</th></tr></thead>
            <tbody>
              {lista.map(p => {
                const dv = desvio(p);
                return (
                  <tr key={p.codigo} className="cl" tabIndex={0} onClick={() => abrir(p)} onKeyDown={e => { if (e.key === 'Enter') abrir(p); }}>
                    <td className="mono">{p.codigo}</td>
                    <td style={{ minWidth: 220, fontWeight: 500 }}>{p.nome}</td>
                    <td>{p.cliente}</td>
                    <td>{p.tipo}</td>
                    <td>{p.gerente || '—'}</td>
                    <td className="mono">{dma(encerradoEm(p))}</td>
                    <td className="mono" style={{ color: dv > 0 ? '#9A2E12' : 'inherit' }}>{dv > 0 ? `+${dv} d` : dv < 0 ? `${dv} d` : 'no prazo'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <p className="sub" style={{ padding: '0 20px 20px' }}>Nenhum projeto encerrado ainda. Um projeto vem para cá quando o patrocinador aprova o G4.</p>)}
    </section>
  );
}
