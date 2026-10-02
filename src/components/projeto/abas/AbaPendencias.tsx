import { useState } from 'react';
import type { Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { usePapel } from '../../../state/PapelContext';
import { SELO_PENDENCIA, porCodigo } from '../../../lib/constantes';
import { Selo } from '../../ui/Selo';
import { Vazio } from '../../ui/Vazio';
import { EditarPendencia } from '../editores/EditarPendencia';

export function AbaPendencias({ projeto }: { projeto: Projeto }) {
  const { dados } = usePortal();
  const [editando, setEditando] = useState<string | null>(null);
  const { pode } = usePapel();
  const abrir = (c: string) => { if (pode('responderPendencia')) setEditando(c); };
  const L = [...(dados.pendencias[projeto.codigo] || [])].sort(porCodigo);
  if (!L.length) return <Vazio>Nenhuma pendência registrada.</Vazio>;
  return (
    <>
      <p className="sub" style={{ marginBottom: 12 }}>Questionamentos ao cliente que condicionam arquitetura, cronograma ou proposta. Clique para registrar a resposta.</p>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Pendência</th><th>Impacto</th><th>Situação</th></tr></thead>
          <tbody>
            {L.map(x => (
              <tr key={x.codigo} className="cl" tabIndex={0} onClick={() => abrir(x.codigo)} onKeyDown={e => { if (e.key === 'Enter') abrir(x.codigo); }}>
                <td className="mono">{x.codigo}</td>
                <td style={{ minWidth: 300 }}>
                  <div style={{ fontWeight: 500 }}>{x.pergunta}</div>
                  {x.resposta && <div className="sub" style={{ marginTop: 4, color: '#145C3C' }}>Resposta: {x.resposta}</div>}
                </td>
                <td style={{ minWidth: 260, color: 'var(--medio)' }}>{x.impacto}</td>
                <td><Selo valor={x.situacao} cores={SELO_PENDENCIA} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editando && <EditarPendencia projeto={projeto} codigo={editando} aoFechar={() => setEditando(null)} />}
    </>
  );
}
