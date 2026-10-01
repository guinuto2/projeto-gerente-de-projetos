import { Link } from 'react-router-dom';
import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { macro } from '../../lib/calculos';
import { dm } from '../../lib/datas';

export function ProximosMarcos() {
  const { dados, hoje } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const itens: { data: string; titulo: string; cod: string }[] = [];
  for (const p of projetos) {
    for (const a of macro(dados, p.codigo)) if (a.marco && a.status !== 'Concluído' && a.termino >= hoje) itens.push({ data: a.termino, titulo: 'Marco · ' + a.nome, cod: p.codigo });
    for (const g of p.fases) if (g.gate && g.situacao !== 'Aprovado' && g.data && g.data >= hoje) itens.push({ data: g.data, titulo: g.nome, cod: p.codigo });
  }
  itens.sort((a, b) => a.data.localeCompare(b.data));
  return (
    <section className="card pad">
      <h2 className="h3">Próximos gates e marcos</h2>
      <div className="lista" style={{ marginTop: 10 }}>
        {itens.slice(0, 5).map((m, i) => (
          <Link key={i} className="mItem" to={`/projeto/${encodeURIComponent(m.cod)}/cronograma`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="mData">{dm(m.data)}</div>
            <div><div className="mTit">{m.titulo}</div><div className="sub">{m.cod}</div></div>
          </Link>
        ))}
        {!itens.length && <div className="sub">Nenhum marco previsto.</div>}
      </div>
    </section>
  );
}
