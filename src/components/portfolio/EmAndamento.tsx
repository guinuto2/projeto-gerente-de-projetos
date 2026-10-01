import { Link } from 'react-router-dom';
import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { macro } from '../../lib/calculos';
import { SELO_STATUS } from '../../lib/constantes';
import { dm } from '../../lib/datas';
import { Selo } from '../ui/Selo';

export function EmAndamento() {
  const { dados } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const itens = projetos.flatMap(p => macro(dados, p.codigo)
    .filter(a => a.status === 'Em andamento' || a.status === 'Bloqueado').map(a => ({ a, cod: p.codigo })));
  return (
    <section className="card pad">
      <h2 className="h3">Em andamento agora</h2>
      <div className="lista" style={{ marginTop: 10 }}>
        {itens.slice(0, 6).map(({ a, cod }) => (
          <Link key={cod + a.codigo} to={`/projeto/${encodeURIComponent(cod)}/cronograma`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="linha"><span className="mTit">{a.codigo} · {a.nome}</span><Selo valor={a.status} cores={SELO_STATUS} /></div>
            <div className="sub" style={{ marginTop: 4 }}>{cod} · {a.equipe} · {a.percentual}% · até {dm(a.termino)}</div>
          </Link>
        ))}
        {!itens.length && <div className="sub">Nada em andamento.</div>}
      </div>
    </section>
  );
}
