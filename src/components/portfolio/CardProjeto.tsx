import { Link } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { avanco, faseAtual, proximoMarco } from '../../lib/calculos';
import { SELO_FAROL } from '../../lib/constantes';
import { dm } from '../../lib/datas';
import { TrilhaFases } from './TrilhaFases';
import { usePapel } from '../../state/PapelContext';
import { aguardando } from '../../lib/dependencias';

export function CardProjeto({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const { papel } = usePapel();
  const px = proximoMarco(dados, p.codigo, hoje);
  const [fundo, texto] = SELO_FAROL[p.farol] || SELO_FAROL.Verde;
  const curto = (s: string) => (s.length > 26 ? s.slice(0, 25) + '…' : s);
  // números do projeto (atividades e tarefas, sem as canceladas)
  const itens = (dados.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado');
  const abertas = itens.filter(a => a.status !== 'Concluído');
  const atrasadas = abertas.filter(a => a.termino && a.termino < hoje).length;
  const aguardandoPre = abertas.filter(a => aguardando(a, itens)).length;
  const realizadas = itens.reduce((s, a) => s + (a.horasRealizadas || 0), 0);
  const planejadas = itens.reduce((s, a) => s + (a.horasPlanejadas || 0), 0);
  const h = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (papel === 'Técnico' || papel === 'Patrocinador' || papel === 'Cliente') {
    return (
      <Link className="pcard pcardTec" to={`/projeto/${encodeURIComponent(p.codigo)}`}>
        <div className="pcardTecTopo">
          <span className="pcardTecCod">{p.codigo}</span>
        </div>
        <div className="pcardTecNome">{p.nome}</div>
        <div className="pcardTecLinhas">
          <div className="pcardTecLinha">
            <span className="pcardTecIco" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></svg>
            </span>
            <span><span className="pcardTecRot">Cliente</span>{p.cliente}</span>
          </div>
          <div className="pcardTecLinha">
            <span className="pcardTecIco" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01" /><path d="M7 17h.01" /></svg>
            </span>
            <span><span className="pcardTecRot">Tipo do projeto</span>{p.tipo}</span>
          </div>
        </div>
        <div className="pcardTecPe">
          <span className="pcardTecGp">GP: {p.gerente || '—'}</span>
          <span className="pcardTecAbrir">{papel === 'Técnico' ? 'Abrir tarefas do projeto' : 'Abrir projeto'} <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    );
  }
  return (
    <Link className="pcard" to={`/projeto/${encodeURIComponent(p.codigo)}`}>
      <div className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <div>
          <div className="pcod">{p.codigo} · {p.cliente.split(' · ')[0]}</div>
          <div className="pnome">{p.nome}</div>
        </div>
        {p.situacaoCadastro === 'Ativo'
          ? <span className="sf" style={{ background: fundo, color: texto }}>{p.farol}</span>
          : <span className="sf tagAviso">{p.situacaoCadastro}</span>}
      </div>
      <div className="tags"><span className="tg">{p.tipo}</span><span className="tg f">Fase: {faseAtual(dados, p)}</span></div>
      <TrilhaFases atual={faseAtual(dados, p)} />
      <div className="pnums">
        <span className={atrasadas ? 'alerta' : ''} title="Atividades e tarefas abertas que passaram do término previsto"><b>{atrasadas}</b> atrasada{atrasadas === 1 ? '' : 's'}</span>
        <span className={aguardandoPre ? 'aviso' : ''} title="Aguardando a conclusão de um pré-requisito"><b>{aguardandoPre}</b> aguardando pré-req.</span>
        <span title="Critério a definir"><b>—</b> críticas</span>
        <span title="Horas realizadas / horas planejadas"><b>{h(realizadas)}/{planejadas ? h(planejadas) : '—'}</b> h</span>
      </div>
      <div className="prod">
        <span>GP: {p.gerente || '—'}</span>
        <span>Avanço <strong>{avanco(dados, p.codigo)}%</strong></span>
        <span>Próximo: {px ? `${curto(px.nome)} · ${dm(px.termino)}` : '—'}</span>
      </div>
    </Link>
  );
}
