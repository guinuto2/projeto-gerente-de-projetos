import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { avanco } from '../../lib/calculos';
import { dm } from '../../lib/datas';
import { lancadaParaTecnico } from '../../lib/dependencias';
import { Kpi } from '../ui/Kpi';

/** Gráfico de pizza (rosca) em SVG, com o total de concluídas no centro. */
function Pizza({ fatias, centro, rotulo }: { fatias: { rotulo: string; valor: number; cor: string }[]; centro: string; rotulo: string }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = 70, c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <svg viewBox="0 0 200 200" className="pizza" role="img" aria-label={fatias.map(f => `${f.rotulo}: ${f.valor}`).join(', ')}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--g-barra)" strokeWidth="34" />
      {fatias.filter(f => f.valor > 0).map(f => {
        const parte = (f.valor / total) * c;
        const el = <circle key={f.rotulo} cx="100" cy="100" r={r} fill="none" stroke={f.cor} strokeWidth="34"
          strokeDasharray={`${parte} ${c - parte}`} strokeDashoffset={-acumulado} transform="rotate(-90 100 100)"><title>{`${f.rotulo}: ${f.valor}`}</title></circle>;
        acumulado += parte;
        return el;
      })}
      <text x="100" y="98" textAnchor="middle" className="pizzaValor">{centro}</text>
      <text x="100" y="120" textAnchor="middle" className="pizzaRotulo">{rotulo}</text>
    </svg>
  );
}

/** Dashboard do cliente: números do projeto, pizza das atividades por situação e as últimas concluídas. */
export function DashboardCliente({ projeto: p }: { projeto: Projeto }) {
  const { dados } = usePortal();
  const itens = (dados.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado' && lancadaParaTecnico(a));
  const concl = itens.filter(a => a.status === 'Concluído');
  const fatias = [
    { rotulo: 'Concluídas', valor: concl.length, cor: 'var(--g-concluido)' },
    { rotulo: 'Em andamento', valor: itens.filter(a => a.status === 'Em andamento').length, cor: 'var(--g-emcurso)' },
    { rotulo: 'Pendentes', valor: itens.filter(a => a.status === 'Bloqueado').length, cor: 'var(--g-atrasado)' },
    { rotulo: 'A iniciar', valor: itens.filter(a => a.status === 'Planejado' || a.status === 'A confirmar').length, cor: 'var(--cinzaMarca)' }
  ];
  const pctConcl = itens.length ? Math.round((concl.length / itens.length) * 100) : 0;
  const ultimas = [...concl].sort((x, y) => (y.dataReal || y.termino || '').localeCompare(x.dataReal || x.termino || '')).slice(0, 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="kpis kpis4">
        <Kpi rotulo="Atividades" valor={itens.length} nota="atividades e tarefas do projeto" />
        <Kpi rotulo="Concluídas" valor={concl.length} nota={`${pctConcl}% das atividades`} />
        <Kpi rotulo="Em andamento" valor={fatias[1].valor} nota={fatias[2].valor ? `${fatias[2].valor} pendente(s)` : 'nenhuma pendente'} />
        <Kpi rotulo="Progresso do projeto" valor={`${avanco(dados, p.codigo)}%`} nota="avanço ponderado das atividades" />
      </div>
      <div className="cliDash">
        <section className="card pad">
          <h3 className="h3" style={{ fontSize: 15 }}>Atividades por situação</h3>
          <div className="pizzaArea">
            <Pizza fatias={fatias} centro={`${pctConcl}%`} rotulo="concluídas" />
            <ul className="pizzaLegenda">
              {fatias.map(f => (
                <li key={f.rotulo}><i style={{ background: f.cor }} /><span>{f.rotulo}</span><b className="mono">{f.valor}</b>
                  <span className="sub">{itens.length ? Math.round((f.valor / itens.length) * 100) : 0}%</span></li>
              ))}
            </ul>
          </div>
        </section>
        <section className="card pad">
          <h3 className="h3" style={{ fontSize: 15 }}>Últimas atividades concluídas</h3>
          {!ultimas.length && <p className="sub" style={{ marginTop: 10 }}>Nenhuma atividade concluída ainda.</p>}
          <ul className="cliUltimas">
            {ultimas.map(a => (
              <li key={a.codigo}><span className="cliOk" aria-hidden="true">✓</span><span>{a.nome}</span><span className="sub">{dm(a.dataReal || a.termino)}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
