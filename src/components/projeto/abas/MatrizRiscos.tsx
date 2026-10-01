import type { Risco } from '../../../types/models';
import { NIVEIS } from '../../../lib/constantes';

/** Mapa de calor probabilidade × impacto dos riscos abertos. */
export function MatrizRiscos({ abertos }: { abertos: Risco[] }) {
  const celula = (pr: string, im: string) => {
    const n = abertos.filter(r => r.probabilidade === pr && r.impacto === im).length;
    const peso = NIVEIS.indexOf(pr as Risco['impacto']) + NIVEIS.indexOf(im as Risco['impacto']);
    const [bg, fg] = peso >= 3 ? ['#FBE3DC', '#9A2E12'] : peso === 2 ? ['#FFF1D1', '#7A5200'] : ['#EAF5F1', '#145C3C'];
    return <div key={im} className="c" style={{ background: bg, color: fg }}>{n || ''}</div>;
  };
  return (
    <div>
      <div className="h3" style={{ fontSize: 15, marginBottom: 10 }}>Matriz dos riscos abertos</div>
      <div className="heat">
        <div />
        {NIVEIS.map(i => <div key={i} className="sub">Imp. {i.toLowerCase()}</div>)}
        {[...NIVEIS].reverse().map(pr => (
          <div key={pr} style={{ display: 'contents' }}>
            <div className="sub" style={{ textAlign: 'right', paddingRight: 6 }}>Prob. {pr.toLowerCase()}</div>
            {NIVEIS.map(im => celula(pr, im))}
          </div>
        ))}
      </div>
    </div>
  );
}
