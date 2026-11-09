import { Link } from 'react-router-dom';
import type { Atividade } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { usePapel } from '../../state/PapelContext';
import { lancadaParaTecnico } from '../../lib/dependencias';
import { SELO_STATUS } from '../../lib/constantes';
import { diasUteis, dm } from '../../lib/datas';
import { Selo } from '../ui/Selo';

const MAXIMO = 8;

/** Atividades abertas que já passaram da data de término prevista, das mais atrasadas para as menos. */
export function AtividadesAtrasadas() {
  const { dados, hoje } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const { papel } = usePapel();
  const { identidade } = useProjetosVisiveis();
  // técnico: é dele se ele é o responsável (pelo e-mail ou, no piloto, pelo nome)
  const minha = (a: { responsavel?: string }) => !!a.responsavel && (a.responsavel.toLowerCase() === (identidade.email || '').toLowerCase() || (!identidade.email && !!identidade.nome));
  const aberta = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';
  // dias úteis depois do término previsto até hoje
  const atraso = (a: Atividade) => Math.max(1, diasUteis(a.termino, hoje) - 1);
  const itens = projetos.flatMap(p => {
    const lista = dados.atividades[p.codigo] || [];
    return lista.filter(a => {
      if (!aberta(a) || !a.termino || a.termino >= hoje) return false;
      if (papel === 'Técnico' && (!a.pai || !lancadaParaTecnico(a) || !minha(a))) return false;   // técnico: só as tarefas dele
      if (a.pai) {
        const pai = lista.find(x => x.codigo === a.pai);
        if (pai && pai.inicio === a.inicio && pai.termino === a.termino) return false;   // repetiria a principal
      }
      return true;
    }).map(a => ({ a, cod: p.codigo, dias: atraso(a) }));
  }).sort((x, y) => y.dias - x.dias || x.a.termino.localeCompare(y.a.termino));

  return (
    <section className="card pad atrasadas">
      <div className="linha" style={{ alignItems: 'baseline' }}>
        <h2 className="h3">{papel === 'Técnico' ? 'Tarefas atrasadas' : 'Atividades atrasadas'}</h2>
        {itens.length > 0 && <span className="cnt">{itens.length}</span>}
      </div>
      <div className="lista" style={{ marginTop: 10 }}>
        {itens.slice(0, MAXIMO).map(({ a, cod, dias }) => (
          <Link key={cod + a.codigo} to={`/projeto/${encodeURIComponent(cod)}/cronograma`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="projTopo"><span className="projTag">{cod}</span><Selo valor={a.status} cores={SELO_STATUS} /></div>
            <div className="mTit">{papel === 'Técnico' ? a.nome : `${a.codigo} · ${a.nome}`}</div>
            <div className="sub" style={{ marginTop: 4 }}>
              <span className="atrasoTag">{dias} {dias > 1 ? 'dias úteis' : 'dia útil'} de atraso</span>
              {a.equipe} · {a.percentual}% · previsto {dm(a.termino)}
            </div>
          </Link>
        ))}
        {!itens.length && <div className="sub">{papel === 'Técnico' ? 'Nenhuma tarefa atrasada.' : 'Nenhuma atividade atrasada.'}</div>}
        {itens.length > MAXIMO && <Link to="/cronogramas" className="sub" style={{ display: 'block', paddingTop: 8 }}>Ver todas ({itens.length}) nos cronogramas →</Link>}
      </div>
    </section>
  );
}
