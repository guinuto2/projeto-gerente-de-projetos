import { Link } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { avanco, faseAtual, proximoMarco } from '../../lib/calculos';
import { SELO_FAROL } from '../../lib/constantes';
import { dm } from '../../lib/datas';
import { TrilhaFases } from './TrilhaFases';

export function CardProjeto({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const px = proximoMarco(dados, p.codigo, hoje);
  const [fundo, texto] = SELO_FAROL[p.farol] || SELO_FAROL.Verde;
  const curto = (s: string) => (s.length > 26 ? s.slice(0, 25) + '…' : s);
  return (
    <Link className="pcard" to={`/projeto/${encodeURIComponent(p.codigo)}`}>
      <div className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <div>
          <div className="pcod">{p.codigo} · {p.cliente.split(' · ')[0]}</div>
          <div className="pnome">{p.nome}</div>
        </div>
        {p.situacaoCadastro === 'Ativo'
          ? <span className="sf" style={{ background: fundo, color: texto }}>{p.farol}</span>
          : <span className="sf" style={{ background: '#FFF1D1', color: '#7A5200' }}>{p.situacaoCadastro}</span>}
      </div>
      <div className="tags"><span className="tg">{p.tipo}</span><span className="tg f">Fase: {faseAtual(dados, p)}</span></div>
      <TrilhaFases atual={faseAtual(dados, p)} />
      <div className="prod">
        <span>GP: {p.gerente || '—'}</span>
        <span>Avanço <strong>{avanco(dados, p.codigo)}%</strong></span>
        <span>Próximo: {px ? `${curto(px.nome)} · ${dm(px.termino)}` : '—'}</span>
      </div>
    </Link>
  );
}
