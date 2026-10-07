import type { Fase } from '../../types/models';
import { FASES } from '../../lib/constantes';
import { novaAtividade, renumerar, type LinhaAtividade } from './formulario';

interface Props { linhas: LinhaAtividade[]; aoMudar: (l: LinhaAtividade[]) => void; aoUsarModelo: () => void; dataMinima?: string }

export function PassoCronograma({ linhas, aoMudar, aoUsarModelo, dataMinima }: Props) {
  const mudar = <K extends keyof LinhaAtividade>(i: number, c: K, v: LinhaAtividade[K]) => {
    const novas = linhas.map((l, k) => (k === i ? { ...l, [c]: v } : l));
    aoMudar(c === 'fase' ? renumerar(novas) : novas);   // o código acompanha a fase
  };
  return (
    <>
      <div className="linha">
        <p className="sub">Liste as atividades macro. As datas informadas viram a baseline do projeto. Marque como marco as entregas que exigem aceite do cliente.</p>
        <button type="button" className="btn pq" onClick={aoUsarModelo}>Usar cronograma padrão Systech</button>
      </div>
      <div className="twrap">
        <table className="tbl ftbl">
          <thead><tr><th>Cód.</th><th>Atividade *</th><th>Fase</th><th>Equipe</th><th>Início *</th><th>Término *</th><th>Marco</th><th /></tr></thead>
          <tbody>
            {linhas.map((a, i) => (
              <tr key={i}>
                <td style={{ width: 70 }}><input className="ctl mono" aria-label="Código" value={a.codigo} disabled title="Gerado pela fase: Iniciação 1.x, Planejamento 2.x, Execução 3.x, Monitoramento 4.x, Encerramento 5.x" /></td>
                <td style={{ minWidth: 240 }}><input className="ctl" aria-label="Atividade" value={a.nome} onChange={e => mudar(i, 'nome', e.target.value)} /></td>
                <td><select className="ctl" aria-label="Fase" value={a.fase} onChange={e => mudar(i, 'fase', e.target.value as Fase)}>{FASES.map(f => <option key={f}>{f}</option>)}</select></td>
                <td style={{ minWidth: 120 }}><input className="ctl" aria-label="Equipe" value={a.equipe} onChange={e => mudar(i, 'equipe', e.target.value)} /></td>
                <td><input className={`ctl ${dataMinima && a.inicio && a.inicio < dataMinima ? 'erro' : ''}`} type="date" aria-label="Início" min={dataMinima} value={a.inicio} onChange={e => mudar(i, 'inicio', e.target.value)} /></td>
                <td><input className="ctl" type="date" aria-label="Término" min={a.inicio || dataMinima} value={a.termino} onChange={e => mudar(i, 'termino', e.target.value)} /></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" aria-label="Marco" checked={a.marco} onChange={e => mudar(i, 'marco', e.target.checked)} /></td>
                <td><button type="button" className="rm" aria-label="Remover atividade" onClick={() => aoMudar(renumerar(linhas.filter((_, k) => k !== i)))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="linha">
        <button type="button" className="btn pq" onClick={() => aoMudar(renumerar([...linhas, novaAtividade(linhas.map(l => l.codigo), linhas[linhas.length - 1]?.fase || 'Iniciação')]))}>+ Adicionar atividade</button>
        <span className="sub">O código é gerado pela fase: Iniciação 1.0, 1.1…; Planejamento 2.0…; Execução 3.0…; Monitoramento 4.0…; Encerramento 5.0…</span>
      </div>
    </>
  );
}
