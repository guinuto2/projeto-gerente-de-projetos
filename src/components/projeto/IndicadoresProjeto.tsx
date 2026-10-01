import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { avanco, desvio, planejado, proximoMarco, riscosAbertos, riscosAltos } from '../../lib/calculos';
import { dm } from '../../lib/datas';

export function IndicadoresProjeto({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const av = avanco(dados, p.codigo), pl = planejado(dados, p.codigo, hoje), dv = desvio(p), px = proximoMarco(dados, p.codigo, hoje);
  return (
    <div className="ind">
      <div><div className="r">Avanço ponderado</div><div className="v">{av}%</div><div className="n">planejado para hoje: {pl}%</div></div>
      <div><div className="r">SPI</div><div className="v">{pl ? (av / pl).toFixed(2).replace('.', ',') : '—'}</div><div className="n">realizado ÷ planejado</div></div>
      <div><div className="r">Desvio no término</div><div className="v" style={{ color: dv > 0 ? '#9A2E12' : 'inherit' }}>{dv > 0 ? '+' : ''}{dv} d</div><div className="n">dias úteis × baseline</div></div>
      <div><div className="r">Riscos abertos</div><div className="v">{riscosAbertos(dados, p.codigo).length}</div><div className="n">{riscosAltos(dados, p.codigo).length} de impacto alto</div></div>
      <div><div className="r">Próximo marco</div><div className="v" style={{ fontSize: 18 }}>{px ? dm(px.termino) : '—'}</div><div className="n">{px ? px.nome : 'nenhum marco pendente'}</div></div>
    </div>
  );
}
