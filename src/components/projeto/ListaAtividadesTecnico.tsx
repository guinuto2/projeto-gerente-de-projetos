import { useState } from 'react';
import type { Atividade, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { SELO_STATUS } from '../../lib/constantes';
import { diasUteis, dm } from '../../lib/datas';
import { Selo } from '../ui/Selo';
import { EditarAtividade } from './editores/EditarAtividade';
import { aguardando, lancadaParaTecnico, situacaoPrazo } from '../../lib/dependencias';

/**
 * Aba "Cronograma" do técnico: só as tarefas (subatividades) do projeto, da mais atrasada para a de prazo mais
 * distante; as concluídas aparecem no fim.
 */
export function ListaAtividadesTecnico({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const { identidade } = useProjetosVisiveis();
  const [aberta, setAberta] = useState<string | null>(null);
  const meuEmail = (identidade.email || p.equipe.find(m => m.nome.toLowerCase() === identidade.nome.toLowerCase())?.email || '').toLowerCase();
  const todas = dados.atividades[p.codigo] || [];
  const abertaSt = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';
  const atraso = (a: Atividade) => (a.termino && a.termino < hoje ? Math.max(1, diasUteis(a.termino, hoje) - 1) : 0);
  const ordem = (x: Atividade, y: Atividade) => atraso(y) - atraso(x) || (x.termino || '9999').localeCompare(y.termino || '9999');
  const nome = (e?: string) => (e ? p.equipe.find(m => m.email.toLowerCase() === e.toLowerCase())?.nome || e : '');

  const linha = (a: Atividade, sub: boolean) => {
    const d = abertaSt(a) ? atraso(a) : 0;
    return (
      <button key={a.codigo} type="button" className={`tecLinha ${sub ? 'sub' : ''} ${abertaSt(a) ? '' : 'feita'} prazo-${situacaoPrazo(a, hoje) || 'ok'}`}
        onClick={() => setAberta(a.codigo)}>
        <span className="tecNome">
          {sub && <span className="tecSeta" aria-hidden="true">↳</span>}<span className="tecProj">{p.codigo}</span>{a.nome}
          {a.responsavel && a.responsavel.toLowerCase() === meuEmail && <span className="minhaTag">minha</span>}
          {aguardando(a, todas) && <span className="tagLock">aguarda pré-req.</span>}
        </span>
        <span className="tecInfo">
          {a.responsavel && <span className="sub">{nome(a.responsavel)}</span>}
          <Selo valor={a.status} cores={SELO_STATUS} />
          <span className="mono">{a.percentual}%</span>
          <span className={d ? 'tecAtraso' : situacaoPrazo(a, hoje) === 'perto' ? 'tecPerto' : 'sub'}>{!abertaSt(a) ? (a.dataReal ? `concluída ${dm(a.dataReal)}` : `prevista ${dm(a.termino)}`) : d ? `${d} ${d > 1 ? 'dias úteis' : 'dia útil'} de atraso` : `prevista ${dm(a.termino)}`}</span>
        </span>
      </button>
    );
  };

  // só as tarefas (subatividades): abertas da mais atrasada para a mais distante, concluídas no fim
  const tarefasDoProjeto = todas.filter(a => a.pai && lancadaParaTecnico(a))
    .sort((x, y) => Number(abertaSt(y)) - Number(abertaSt(x)) || (abertaSt(x) ? ordem(x, y) : (y.termino || '').localeCompare(x.termino || '')));
  return (
    <div>
      <p className="sub" style={{ marginBottom: 10, fontSize: 12.5 }}>Tarefas do projeto, da mais atrasada para a mais distante. As concluídas aparecem no fim.</p>
      {!tarefasDoProjeto.length && <p className="sub">Este projeto ainda não tem tarefas.</p>}
      <div className="tecGrupo tecPlano">
        {tarefasDoProjeto.map(t => linha(t, false))}
      </div>
      {aberta && <EditarAtividade projeto={p} codigo={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  );
}
