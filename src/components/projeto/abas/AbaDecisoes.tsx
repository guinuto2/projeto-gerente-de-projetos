import type { Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { Vazio } from '../../ui/Vazio';
import { porCodigo } from '../../../lib/constantes';

export function AbaDecisoes({ projeto }: { projeto: Projeto }) {
  const { dados } = usePortal();
  const L = [...(dados.decisoes[projeto.codigo] || [])].sort(porCodigo);
  if (!L.length) return <Vazio>Nenhuma decisão de arquitetura registrada.</Vazio>;
  return (
    <div className="twrap">
      <table className="tbl">
        <thead><tr><th>ID</th><th>Decisão</th><th>Descrição</th><th>Justificativa</th></tr></thead>
        <tbody>
          {L.map(x => (
            <tr key={x.codigo}>
              <td className="mono">{x.codigo}</td>
              <td style={{ minWidth: 200, fontWeight: 500 }}>{x.decisao}</td>
              <td style={{ minWidth: 280, color: 'var(--medio)' }}>{x.descricao}</td>
              <td style={{ minWidth: 240, color: 'var(--medio)' }}>{x.justificativa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
