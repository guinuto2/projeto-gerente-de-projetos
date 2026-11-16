import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../state/PortalContext';
import { agruparPorDia, horarioEvento, AgendaSemPermissao, type EventoAgenda } from '../../lib/agenda';
import { somarDiasCorridos } from '../../lib/datas';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function rotuloDia(diaIso: string, hoje: string): string {
  const dm = diaIso.slice(8, 10) + '/' + diaIso.slice(5, 7);
  const sem = DIAS_SEMANA[new Date(`${diaIso}T12:00:00Z`).getUTCDay()];
  if (diaIso === hoje) return `Hoje · ${sem} ${dm}`;
  if (diaIso === somarDiasCorridos(hoje, 1)) return `Amanhã · ${sem} ${dm}`;
  return `${sem} ${dm}`;
}

/**
 * Agenda do Outlook/Teams de quem está logado, no cabeçalho: hoje ou os próximos 7 dias.
 * A leitura automática não abre janela de permissão; se faltar, mostra o botão "Conectar agenda".
 */
export function AgendaCabecalho() {
  const { agenda, hoje, fonte } = usePortal();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana'>('hoje');
  const [eventos, setEventos] = useState<EventoAgenda[] | null>(null);
  const [semPermissao, setSemPermissao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const caixa = useRef<HTMLDivElement>(null);
  const ate = somarDiasCorridos(hoje, 6);
  // a função do portal muda a cada atualização dos dados; a referência evita reler a agenda à toa
  const lerAgenda = useRef(agenda); lerAgenda.current = agenda;

  const ler = useCallback(async (interativo: boolean) => {
    setCarregando(true); setErro('');
    try { setEventos(await lerAgenda.current(hoje, ate, interativo)); setSemPermissao(false); }
    catch (e) {
      if (e instanceof AgendaSemPermissao) setSemPermissao(true);
      else setErro((e as Error).message);
    } finally { setCarregando(false); }
  }, [hoje, ate]);

  useEffect(() => {
    ler(false);
    const t = window.setInterval(() => ler(false), 5 * 60000);
    const reler = () => ler(false);
    window.addEventListener('portal-agenda', reler);
    return () => { window.clearInterval(t); window.removeEventListener('portal-agenda', reler); };
  }, [ler]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  const lista = eventos || [];
  const doDiaDeHoje = agruparPorDia(lista, hoje, hoje)[0]?.eventos || [];
  const grupos = agruparPorDia(lista, hoje, periodo === 'hoje' ? hoje : ate);
  const piloto = fonte.modo === 'piloto';

  return (
    <div className="sino agendaCab" ref={caixa}>
      <button type="button" className="sinoBtn" aria-expanded={aberto}
        aria-label={`Agenda${doDiaDeHoje.length ? `: ${doDiaDeHoje.length} compromisso(s) hoje` : ''}`} title="Agenda do Outlook/Teams"
        onClick={() => { setAberto(v => !v); if (!aberto) ler(false); }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {doDiaDeHoje.length > 0 && <span className="sinoN agendaN">{doDiaDeHoje.length > 9 ? '9+' : doDiaDeHoje.length}</span>}
      </button>
      {aberto && (
        <div className="sinoCaixa agendaCaixa" role="dialog" aria-label="Agenda">
          <div className="sinoTopo">
            <b>Agenda{piloto ? ' · exemplo' : ''}</b>
            <span className="agendaPeriodo" role="tablist" aria-label="Período">
              <button type="button" role="tab" aria-selected={periodo === 'hoje'} className={periodo === 'hoje' ? 'on' : ''} onClick={() => setPeriodo('hoje')}>Hoje</button>
              <button type="button" role="tab" aria-selected={periodo === 'semana'} className={periodo === 'semana' ? 'on' : ''} onClick={() => setPeriodo('semana')}>7 dias</button>
              <button type="button" className="agendaAtualizar" title="Atualizar" aria-label="Atualizar a agenda" disabled={carregando} onClick={() => ler(false)}>↻</button>
            </span>
          </div>
          <div className="sinoLista">
            {semPermissao && (
              <div className="agendaAviso">
                <p>Para mostrar sua agenda do Outlook/Teams, o portal precisa da permissão de calendário (pedida uma vez só).</p>
                <button type="button" className="btn pri pq" onClick={() => ler(true)}>Conectar agenda</button>
              </div>
            )}
            {erro && <p className="agendaAviso erro">{erro}</p>}
            {!semPermissao && !erro && eventos === null && <p className="sub" style={{ padding: '14px 16px' }}>Carregando…</p>}
            {!semPermissao && !erro && eventos !== null && !grupos.length && (
              <p className="sub" style={{ padding: '14px 16px' }}>{periodo === 'hoje' ? 'Nenhum compromisso hoje.' : 'Nenhum compromisso nos próximos 7 dias.'}</p>
            )}
            {grupos.map(g => (
              <div key={g.dia} className="agendaDia">
                {periodo === 'semana' && <div className="agendaDiaTit">{rotuloDia(g.dia, hoje)}</div>}
                {g.eventos.map(e => (
                  <div key={e.id + g.dia} className={`agendaItem ${e.atividade ? 'deAtividade' : ''}`}>
                    <span className="agendaHora">{horarioEvento(e)}</span>
                    <span className="agendaTxt">
                      <span className="agendaTit">{e.titulo}</span>
                      {e.local && <span className="agendaLocal">{e.local}</span>}
                      <span className="agendaLinks">
                        {e.atividade && <button type="button" className="linkBtn" onClick={() => { setAberto(false); navegar(`/atualizar?item=${encodeURIComponent(e.atividade!)}`); }}>Ver atividade</button>}
                        {e.linkTeams && <a href={e.linkTeams} target="_blank" rel="noopener noreferrer">Entrar no Teams</a>}
                        {e.link && <a href={e.link} target="_blank" rel="noopener noreferrer">Abrir no Outlook</a>}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="agendaRodape">
            <a href="https://teams.microsoft.com/_#/calendarv2" target="_blank" rel="noopener noreferrer">Abrir o calendário do Teams</a>
            <a href="https://outlook.office.com/calendar/view/week" target="_blank" rel="noopener noreferrer">Outlook</a>
          </div>
        </div>
      )}
    </div>
  );
}
