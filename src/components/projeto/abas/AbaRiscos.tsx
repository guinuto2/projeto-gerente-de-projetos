import { useState } from 'react';
import type { Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { usePapel } from '../../../state/PapelContext';
import { riscosAbertos } from '../../../lib/calculos';
import { SELO_RISCO, SITUACOES_RISCO } from '../../../lib/constantes';
import { Selo } from '../../ui/Selo';
import { Vazio } from '../../ui/Vazio';
import { MatrizRiscos } from './MatrizRiscos';
import { EditarRisco } from '../editores/EditarRisco';

export function AbaRiscos({ projeto }: { projeto: Projeto }) {
  const { dados } = usePortal();
  const [editando, setEditando] = useState<string | null>(null);
  const { pode } = usePapel();
  const abrir = (c: string) => { if (pode('editarRisco')) setEditando(c); };
  const editor = editando && <EditarRisco projeto={projeto} codigo={editando === 'novo' ? undefined : editando} aoFechar={() => setEditando(null)} />;
  const botaoNovo = pode('editarRisco') && <button type="button" className="btn pri pq" onClick={() => setEditando('novo')}>+ Novo risco</button>;
  const R = dados.riscos[projeto.codigo] || [];
  if (!R.length) return <><Vazio>Nenhum risco registrado.{botaoNovo && <><br /><br />{botaoNovo}</>}</Vazio>{editor}</>;
  return (
    <>
      <div className="linha" style={{ alignItems: 'flex-start', marginBottom: 18, gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{botaoNovo}</div>
          <MatrizRiscos abertos={riscosAbertos(dados, projeto.codigo)} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="nums">{SITUACOES_RISCO.map(s => <div key={s}><b>{R.filter(r => r.situacao === s).length}</b><span>{s}</span></div>)}</div>
          <p className="sub" style={{ marginTop: 12 }}>Riscos gerais e específicos de migração aplicáveis ao cenário adotado. Clique numa linha para atualizar a situação.</p>
        </div>
      </div>
      <div className="twrap">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Risco</th><th>Prob.</th><th>Imp.</th><th>Mitigação</th><th>Responsável</th><th>Situação</th></tr></thead>
          <tbody>
            {R.map(r => (
              <tr key={r.codigo} className="cl" tabIndex={0} onClick={() => abrir(r.codigo)} onKeyDown={e => { if (e.key === 'Enter') abrir(r.codigo); }}>
                <td className="mono">{r.codigo}</td>
                <td style={{ minWidth: 240, fontWeight: 500 }}>{r.descricao}</td>
                <td>{r.probabilidade}</td><td>{r.impacto}</td>
                <td style={{ minWidth: 260, color: 'var(--medio)' }}>{r.mitigacao}</td>
                <td>{r.responsavel}</td>
                <td><Selo valor={r.situacao} cores={SELO_RISCO} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editor}
    </>
  );
}
