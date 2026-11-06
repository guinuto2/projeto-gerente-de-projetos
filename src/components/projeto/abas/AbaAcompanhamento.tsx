import { Fragment, useState } from 'react';
import type { Atividade, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { usePapel } from '../../../state/PapelContext';
import { lancadaParaTecnico } from '../../../lib/dependencias';
import { SELO_STATUS } from '../../../lib/constantes';
import { dm } from '../../../lib/datas';
import { Selo } from '../../ui/Selo';
import { Chips } from '../../ui/Chips';
import { Vazio } from '../../ui/Vazio';
import { AcompanhamentoAtividade } from '../AcompanhamentoAtividade';

type Filtro = 'Abertas' | 'Concluídas' | 'Todas';

/** Acompanhamento das subatividades do projeto (técnico, PMO e patrocinador): situação atual e cada atualização. */
export function AbaAcompanhamento({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const [filtro, setFiltro] = useState<Filtro>('Abertas');
  const [aberta, setAberta] = useState<string | null>(null);
  const todas = dados.atividades[p.codigo] || [];
  const { papel } = usePapel();
  const subs = todas.filter(a => a.pai && (papel !== 'Técnico' || lancadaParaTecnico(a)));
  const passa = (a: Atividade) => filtro === 'Todas' || (filtro === 'Concluídas' ? a.status === 'Concluído' : a.status !== 'Concluído' && a.status !== 'Cancelado');
  const principais = todas.filter(a => !a.pai && subs.some(s => s.pai === a.codigo && passa(s)));
  const nome = (email?: string) => (email ? p.equipe.find(m => m.email.toLowerCase() === email.toLowerCase())?.nome || email : '—');
  const ordem = (x: Atividade, y: Atividade) => x.codigo.localeCompare(y.codigo, 'pt-BR', { numeric: true });

  if (!subs.length) return <Vazio>Este projeto ainda não tem subatividades. Elas são criadas no cronograma ou na atualização semanal.</Vazio>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Chips rotulo="Quais subatividades" opcoes={['Abertas', 'Concluídas', 'Todas'] as const} valor={filtro} aoMudar={setFiltro}
        formatar={f => `${f} (${subs.filter(a => f === 'Todas' || (f === 'Concluídas' ? a.status === 'Concluído' : a.status !== 'Concluído' && a.status !== 'Cancelado')).length})`} />
      {!principais.length && <p className="sub">Nenhuma subatividade nesse filtro.</p>}
      {principais.sort(ordem).map(pr => (
        <section key={pr.codigo} className="acompGrupo">
          <div className="acompPrincipal"><span className="mono">{pr.codigo}</span> {pr.nome} <span className="sub">· {pr.fase}</span></div>
          <div className="twrap">
            <table className="tbl">
              <thead><tr><th>Código</th><th>Subatividade</th><th>Responsável</th><th>Status</th><th>%</th><th>Previsto</th><th>Última atualização</th></tr></thead>
              <tbody>
                {subs.filter(s => s.pai === pr.codigo && passa(s)).sort(ordem).map(s => (
                  <Fragment key={s.codigo}>
                    <tr className="cl" tabIndex={0} aria-expanded={aberta === s.codigo}
                      onClick={() => setAberta(aberta === s.codigo ? null : s.codigo)} onKeyDown={e => { if (e.key === 'Enter') setAberta(aberta === s.codigo ? null : s.codigo); }}>
                      <td className="mono">{aberta === s.codigo ? '▾' : '▸'} {s.codigo}</td>
                      <td style={{ minWidth: 200 }}>{s.nome}</td>
                      <td>{nome(s.responsavel)}</td>
                      <td><Selo valor={s.status} cores={SELO_STATUS} /></td>
                      <td className="mono">{s.percentual}%</td>
                      <td className="mono" style={{ color: s.status !== 'Concluído' && s.termino < hoje ? 'var(--txt-erro)' : undefined }}>{dm(s.termino)}</td>
                      <td className="sub">{s.dataUltimaAtualizacao ? `${dm(s.dataUltimaAtualizacao)}${s.atualizadoPor ? ` · ${s.atualizadoPor}` : ''}` : '—'}</td>
                    </tr>
                    {aberta === s.codigo && (
                      <tr><td colSpan={7} style={{ background: 'var(--cinza)' }}>
                        {s.realizado && <p style={{ margin: '4px 0 10px', fontSize: 13.5 }}><b>O que foi feito:</b> {s.realizado}</p>}
                        <AcompanhamentoAtividade projeto={p} a={s} />
                      </td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
