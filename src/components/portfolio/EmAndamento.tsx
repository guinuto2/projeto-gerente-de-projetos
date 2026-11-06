import { Link } from 'react-router-dom';
import type { Atividade } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { usePapel } from '../../state/PapelContext';
import { lancadaParaTecnico } from '../../lib/dependencias';
import { SELO_STATUS } from '../../lib/constantes';
import { dm } from '../../lib/datas';
import { Selo } from '../ui/Selo';

const MAXIMO = 8;

/**
 * O que está acontecendo hoje: tarefas (subatividades) abertas cujo período inclui hoje (mesmo ainda "Planejado"),
 * mais as marcadas como em andamento ou bloqueadas e ainda no prazo. As que começam hoje aparecem primeiro.
 */
export function EmAndamento() {
  const { dados, hoje } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const { papel } = usePapel();
  const aberta = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';
  const noPeriodo = (a: Atividade) => !!a.inicio && !!a.termino && a.inicio <= hoje && a.termino >= hoje;
  // só as tarefas (subatividades) abertas, no prazo, que estão no período de hoje ou marcadas em andamento/bloqueadas
  const itens = projetos.flatMap(p => {
    const lista = dados.atividades[p.codigo] || [];
    return lista.filter(a => {
      if (!a.pai || !aberta(a)) return false;
      if (papel === 'Técnico' && !lancadaParaTecnico(a)) return false;   // técnico não vê tarefa não lançada
      if (a.termino && a.termino < hoje) return false;   // atrasadas aparecem na seção "Atividades atrasadas"
      return noPeriodo(a) || a.status === 'Em andamento' || a.status === 'Bloqueado';
    }).map(a => ({ a, cod: p.codigo, equipe: p.equipe }));
  }).sort((x, y) =>
    Number(y.a.inicio === hoje) - Number(x.a.inicio === hoje) ||
    Number(y.a.status === 'Bloqueado') - Number(x.a.status === 'Bloqueado') ||
    (x.a.termino || '').localeCompare(y.a.termino || ''));

  return (
    <section className="card pad">
      <div className="linha" style={{ alignItems: 'baseline' }}>
        <h2 className="h3">{papel === 'Técnico' ? 'Tarefas em andamento agora' : 'Atividades em andamento agora'}</h2>
        {itens.length > 0 && <span className="cnt">{itens.length}</span>}
      </div>
      <div className="lista" style={{ marginTop: 10 }}>
        {itens.slice(0, MAXIMO).map(({ a, cod, equipe }) => (
          <Link key={cod + a.codigo} to={`/projeto/${encodeURIComponent(cod)}/cronograma`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="projTopo"><span className="projTag">{cod}</span><Selo valor={a.status} cores={SELO_STATUS} /></div>
            <div className="mTit">{papel === 'Técnico' ? a.nome : `${a.codigo} · ${a.nome}`}</div>
            <div className="sub" style={{ marginTop: 4 }}>
              {a.inicio === hoje && <span className="hojeTag">começa hoje</span>}
              {(a.responsavel && equipe.find(m => m.email.toLowerCase() === a.responsavel!.toLowerCase())?.nome) || a.equipe} · {a.percentual}% · {a.inicio === a.termino ? `em ${dm(a.termino)}` : `até ${dm(a.termino)}`}
            </div>
          </Link>
        ))}
        {!itens.length && <div className="sub">Nenhuma tarefa em andamento hoje.</div>}
        {itens.length > MAXIMO && <Link to="/cronogramas" className="sub" style={{ display: 'block', paddingTop: 8 }}>Ver todas ({itens.length}) nos cronogramas →</Link>}
      </div>
    </section>
  );
}
