import type { Nivel } from '../../types/models';
import { NIVEIS } from '../../lib/constantes';
import { novoRisco, type LinhaRisco } from './formulario';

interface Props { linhas: LinhaRisco[]; aoMudar: (l: LinhaRisco[]) => void; aoUsarModelo: () => void }

export function PassoRiscos({ linhas, aoMudar, aoUsarModelo }: Props) {
  const mudar = <K extends keyof LinhaRisco>(i: number, c: K, v: LinhaRisco[K]) =>
    aoMudar(linhas.map((l, k) => (k === i ? { ...l, [c]: v } : l)));
  return (
    <>
      <div className="linha">
        <p className="sub">Registre os riscos conhecidos no início. Depois eles são atualizados na aba Riscos do projeto.</p>
        <button type="button" className="btn pq" onClick={aoUsarModelo}>Copiar riscos padrão (R-1 a R-13)</button>
      </div>
      <div className="twrap">
        <table className="tbl ftbl">
          <thead><tr><th>ID</th><th>Risco *</th><th>Prob.</th><th>Imp.</th><th>Mitigação</th><th>Responsável</th><th /></tr></thead>
          <tbody>
            {linhas.map((r, i) => (
              <tr key={i}>
                <td style={{ width: 80 }}><input className="ctl" aria-label="ID" value={r.codigo} onChange={e => mudar(i, 'codigo', e.target.value)} /></td>
                <td style={{ minWidth: 240 }}><input className="ctl" aria-label="Risco" value={r.descricao} onChange={e => mudar(i, 'descricao', e.target.value)} /></td>
                {(['probabilidade', 'impacto'] as const).map(c => (
                  <td key={c}><select className="ctl" aria-label={c} value={r[c]} onChange={e => mudar(i, c, e.target.value as Nivel)}>{NIVEIS.map(n => <option key={n}>{n}</option>)}</select></td>
                ))}
                <td style={{ minWidth: 220 }}><input className="ctl" aria-label="Mitigação" value={r.mitigacao} onChange={e => mudar(i, 'mitigacao', e.target.value)} /></td>
                <td style={{ minWidth: 130 }}><input className="ctl" aria-label="Responsável" value={r.responsavel} onChange={e => mudar(i, 'responsavel', e.target.value)} /></td>
                <td><button type="button" className="rm" aria-label="Remover risco" onClick={() => aoMudar(linhas.filter((_, k) => k !== i))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn pq" onClick={() => aoMudar([...linhas, novoRisco(linhas.length + 1)])}>+ Adicionar risco</button>
    </>
  );
}
