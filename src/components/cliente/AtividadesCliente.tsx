import { useState } from 'react';
import type { Atividade, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { FASES, SELO_STATUS } from '../../lib/constantes';
import { dm } from '../../lib/datas';
import { lancadaParaTecnico } from '../../lib/dependencias';
import { Selo } from '../ui/Selo';
import { Chips } from '../ui/Chips';

type Filtro = 'Todas' | 'Em andamento' | 'Concluídas' | 'A iniciar';

/** Atividades do projeto para o cliente: agrupadas por fase, com as tarefas de cada atividade. */
export function AtividadesCliente({ projeto: p }: { projeto: Projeto }) {
  const { dados } = usePortal();
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const todas = (dados.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado' && lancadaParaTecnico(a));
  const passa = (a: Atividade) => filtro === 'Todas' || (filtro === 'Concluídas' ? a.status === 'Concluído'
    : filtro === 'Em andamento' ? a.status === 'Em andamento' || a.status === 'Bloqueado' : a.status === 'Planejado' || a.status === 'A confirmar');
  const principais = todas.filter(a => !a.pai);
  const tarefas = (pai: Atividade) => todas.filter(t => t.pai === pai.codigo);
  const conta = (f: Filtro) => todas.filter(a => f === 'Todas' || (f === 'Concluídas' ? a.status === 'Concluído'
    : f === 'Em andamento' ? a.status === 'Em andamento' || a.status === 'Bloqueado' : a.status === 'Planejado' || a.status === 'A confirmar')).length;
  const quando = (a: Atividade) => (a.status === 'Concluído' ? (a.dataReal ? `concluída em ${dm(a.dataReal)}` : `prevista ${dm(a.termino)}`) : `${dm(a.inicio)} a ${dm(a.termino)}`);

  const linha = (a: Atividade, sub: boolean) => (
    <div key={a.codigo} className={`cliLinha ${sub ? 'sub' : ''} ${a.status === 'Concluído' ? 'feita' : ''}`}>
      <span className="cliNome">{sub && <span className="tecSeta" aria-hidden="true">↳</span>}{a.nome}</span>
      <span className="cliInfo">
        <Selo valor={a.status === 'Bloqueado' ? 'Pendente' : a.status} cores={{ ...SELO_STATUS, Pendente: SELO_STATUS.Bloqueado }} />
        <span className="cliPct"><i style={{ width: `${a.status === 'Concluído' ? 100 : a.percentual}%` }} /></span>
        <span className="mono">{a.status === 'Concluído' ? 100 : a.percentual}%</span>
        <span className="sub">{quando(a)}</span>
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Chips rotulo="Filtrar atividades" opcoes={['Todas', 'Em andamento', 'Concluídas', 'A iniciar'] as const} valor={filtro} aoMudar={setFiltro}
        formatar={f => `${f} (${conta(f)})`} />
      {FASES.map(fase => {
        const grupo = principais.filter(a => a.fase === fase && (passa(a) || tarefas(a).some(passa)));
        if (!grupo.length) return null;
        return (
          <section key={fase} className="cliFase">
            <h3 className="cliFaseTit">{fase}</h3>
            <div className="cliGrupo">
              {grupo.map(a => (
                <div key={a.codigo}>
                  {linha(a, false)}
                  {tarefas(a).filter(passa).map(t => linha(t, true))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!principais.some(a => passa(a) || tarefas(a).some(passa)) && <p className="sub">Nenhuma atividade nesse filtro.</p>}
    </div>
  );
}
