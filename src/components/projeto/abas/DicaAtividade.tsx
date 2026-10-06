import type { Atividade } from '../../../types/models';
import { SELO_STATUS } from '../../../lib/constantes';
import { dia, diasUteis, dma } from '../../../lib/datas';
import { Selo } from '../../ui/Selo';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const comDia = (s: string) => { const d = dia(s); return d ? `${dma(s)} (${SEMANA[d.getDay()]})` : '—'; };

/** Janela pequena que acompanha o mouse sobre a atividade: datas de início e fim. */
export function DicaAtividade({ a, x, y }: { a: Atividade; x: number; y: number }) {
  const largura = 280, altura = 170;
  const left = Math.min(x + 16, window.innerWidth - largura - 12);
  const top = y + 16 + altura > window.innerHeight ? y - altura - 8 : y + 16;
  const mudou = a.baselineInicio && (a.baselineInicio !== a.inicio || a.baselineTermino !== a.termino);
  return (
    <div className="dicaAtv" role="tooltip" style={{ left, top, width: largura }}>
      <div className="dicaTit">{a.codigo} · {a.nome}</div>
      <div className="dicaLinha"><span>Início</span><b>{comDia(a.inicio)}</b></div>
      <div className="dicaLinha"><span>Término</span><b>{comDia(a.termino)}</b></div>
      {a.inicio && a.termino && <div className="dicaLinha"><span>Duração</span><b>{diasUteis(a.inicio, a.termino)} dia(s) útil(eis)</b></div>}
      {mudou && <div className="dicaLinha"><span>Baseline</span><span>{dma(a.baselineInicio)} a {dma(a.baselineTermino)}</span></div>}
      <div className="dicaLinha"><span>Situação</span><span><Selo valor={a.status} cores={SELO_STATUS} /> {a.percentual}%</span></div>
    </div>
  );
}
