import { useState } from 'react';
import type { Fase, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { usePapel } from '../../../state/PapelContext';
import { macro } from '../../../lib/calculos';
import { dm } from '../../../lib/datas';
import { Chips } from '../../ui/Chips';
import { Vazio } from '../../ui/Vazio';
import { Gantt } from './Gantt';
import { TEMA } from '../../../lib/tema';
import { ExportarCsv } from './ExportarCsv';
import { EditarAtividade } from '../editores/EditarAtividade';

interface Props { projeto: Projeto; faseSel: Fase | null; limparFase: () => void }

export function AbaCronograma({ projeto, faseSel, limparFase }: Props) {
  const { dados, hoje, fonte } = usePortal();
  const { pode } = usePapel();
  const [equipe, setEquipe] = useState('Todas');
  /** código da atividade em edição, ou 'nova' */
  const [editando, setEditando] = useState<string | null>(null);
  const atividades = dados.atividades[projeto.codigo] || [];
  const editor = editando && (
    <EditarAtividade projeto={projeto} codigo={editando === 'nova' ? undefined : editando} faseInicial={faseSel} aoFechar={() => setEditando(null)} />
  );
  if (!atividades.length) return (
    <>
      <Vazio>Nenhuma atividade no cronograma ainda.{pode('gerenciarAtividades') && <><br /><br /><button type="button" className="btn pri" onClick={() => setEditando('nova')}>+ Nova atividade</button></>}</Vazio>
      {editor}
    </>
  );
  if (!atividades.some(a => a.inicio && a.termino)) return (
    <>
      <Vazio>As atividades ainda não têm datas. Abra cada uma para informar início e término.<br /><br />
        {pode('gerenciarAtividades') && <button type="button" className="btn pri" onClick={() => setEditando('nova')}>+ Nova atividade</button>}</Vazio>
      <ul className="ul">{atividades.map(a => <li key={a.codigo}><button type="button" className="btn pq" onClick={() => setEditando(a.codigo)}>{a.codigo} · {a.nome}</button></li>)}</ul>
      {editor}
    </>
  );
  const equipes = ['Todas', ...Array.from(new Set(macro(dados, projeto.codigo).map(a => a.equipe)))];
  const legenda: [string, string, number][] = [['Concluído', TEMA.concluido, 8], ['Em curso', TEMA.emCurso, 8], ['Atrasado', TEMA.atrasado, 8], ['Baseline', TEMA.baseline, 3]];
  return (
    <>
      <div className="linha" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {pode('gerenciarAtividades') && <button type="button" className="btn pri pq" onClick={() => setEditando('nova')}>+ Nova atividade</button>}
          <ExportarCsv projeto={projeto} tipo="cronograma" />
          <Chips rotulo="Filtrar por equipe" opcoes={equipes} valor={equipe} aoMudar={setEquipe} formatar={e => (e === 'Todas' ? 'Todas as equipes' : e)} />
        </div>
        <div className="legenda">
          {legenda.map(([t, c, h]) => <span key={t}><i className="pt" style={{ background: c, width: 18, height: h }} />{t}</span>)}
          <span><i style={{ width: 2, height: 14, background: TEMA.vinho, display: 'inline-block' }} />Hoje ({dm(hoje)})</span>
        </div>
      </div>
      {faseSel && (
        <div className="msg info linha" style={{ marginBottom: 12 }}>
          <span>Mostrando só a fase {faseSel}.</span>
          <button type="button" className="btn pq" onClick={limparFase}>Mostrar todas</button>
        </div>
      )}
      <Gantt projeto={projeto} atividades={atividades} aoAbrir={c => { if (pode('atualizarAtividade')) setEditando(c); }}
        filtro={a => (equipe === 'Todas' || a.equipe === equipe) && (!faseSel || a.fase === faseSel)} />
      <p className="sub" style={{ marginTop: 10 }}>
        {pode('gerenciarAtividades') ? 'Clique numa atividade para editar nome, fase, datas, status ou excluir.' : 'Clique numa atividade para atualizar status, % e observação.'} As alterações {fonte.modo === 'piloto' ? 'ficam neste navegador (modo piloto)' : 'são gravadas na lista Portal Atividades'}.
      </p>
      {editor}
    </>
  );
}
