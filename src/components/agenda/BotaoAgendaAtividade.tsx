import { useEffect, useState } from 'react';
import type { Atividade, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { horarioEvento, tituloAgenda, validarOpcoesAgenda, type EventoAgenda, type OpcoesAgenda } from '../../lib/agenda';
import { Mensagem } from '../ui/Mensagem';

const br = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

/**
 * "Adicionar à agenda" / "Atualizar na agenda": leva a atividade (título e descrição) para a agenda do Outlook,
 * que é a mesma do Teams. Ao abrir, confere em silêncio se a atividade já está na agenda.
 */
export function BotaoAgendaAtividade({ projeto, atividade, classe = 'btn' }: { projeto: Projeto; atividade: Atividade; classe?: string }) {
  const { eventoDaAtividade } = usePortal();
  const [existente, setExistente] = useState<EventoAgenda | null>(null);
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    let vivo = true;
    setExistente(null);
    eventoDaAtividade(projeto.codigo, atividade.codigo, false).then(e => { if (vivo) setExistente(e); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [projeto.codigo, atividade.codigo]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <button type="button" className={classe} onClick={() => setAberto(true)} title={existente ? `Na sua agenda: ${br(existente.inicio)} · ${horarioEvento(existente)}` : 'Adicionar esta atividade à sua agenda do Outlook/Teams'}>
        📅 Adicionar à agenda
      </button>
      {aberto && <JanelaAgenda projeto={projeto} atividade={atividade} existente={existente} aoFechar={() => setAberto(false)} aoSalvar={setExistente} />}
    </>
  );
}

function JanelaAgenda({ projeto, atividade, existente, aoFechar, aoSalvar }: {
  projeto: Projeto; atividade: Atividade; existente: EventoAgenda | null; aoFechar: () => void; aoSalvar: (e: EventoAgenda) => void;
}) {
  const { salvarAtividadeNaAgenda, hoje } = usePortal();
  const toast = useToast();
  // dia sugerido: hoje, se estiver dentro do período da atividade; senão, o início dela
  const sugerido = atividade.inicio && hoje < atividade.inicio ? atividade.inicio : hoje;
  const [titulo, setTitulo] = useState(existente?.titulo || tituloAgenda(projeto, atividade));
  const [modo, setModo] = useState<'periodo' | 'horario'>(existente && !existente.diaInteiro ? 'horario' : atividade.inicio && atividade.termino ? 'periodo' : 'horario');
  const [data, setData] = useState(existente && !existente.diaInteiro ? existente.inicio.slice(0, 10) : sugerido);
  const [horaInicio, setHoraInicio] = useState(existente && !existente.diaInteiro ? existente.inicio.slice(11, 16) : '09:00');
  const [horaFim, setHoraFim] = useState(existente && !existente.diaInteiro ? existente.fim.slice(11, 16) : '10:00');
  const [salvando, setSalvando] = useState(false); const [erro, setErro] = useState('');
  const opcoes: OpcoesAgenda = modo === 'periodo' ? { modo } : { modo, data, horaInicio, horaFim };
  const salvar = async () => {
    const problema = !titulo.trim() ? 'Informe o título.' : validarOpcoesAgenda(opcoes, atividade);
    if (problema) { setErro(problema); return; }
    setSalvando(true); setErro('');
    try {
      const salvo = await salvarAtividadeNaAgenda(projeto.codigo, atividade.codigo, opcoes, titulo.trim());
      aoSalvar(salvo);
      toast('Atividade adicionada à sua agenda (Outlook e Teams).');
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  return (
    <>
      <div className="fundoDr" onClick={() => !salvando && aoFechar()} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Agenda" style={{ width: 'min(560px, 94vw)' }}>
        <h2 className="h3">Adicionar à agenda</h2>
        <p className="sub" style={{ margin: '4px 0 12px', fontSize: 13 }}>
          O compromisso vai para a sua agenda do Outlook, que é a mesma do Teams.
          {existente && <> Esta atividade já está na sua agenda em <b>{br(existente.inicio)} · {horarioEvento(existente)}</b>: adicionar de novo atualiza o mesmo compromisso, sem duplicar.</>}
        </p>
        <label className="campo">Título
          <input className="ctl" value={titulo} disabled={salvando} onChange={e => setTitulo(e.target.value)} />
        </label>
        <div className="campo" style={{ marginTop: 10 }}>Descrição (vai no corpo do compromisso)
          <div className="agendaDescricao">{(atividade.descricao || '').trim() || <span className="sub">A atividade não tem descrição: vão o nome, o projeto e o período previsto.</span>}</div>
        </div>
        <fieldset className="agendaModo" disabled={salvando}>
          <legend className="campo" style={{ marginBottom: 6 }}>Quando</legend>
          <label className="chk">
            <input type="radio" name="agendaModo" checked={modo === 'periodo'} disabled={!atividade.inicio || !atividade.termino} onChange={() => setModo('periodo')} />
            <span>Dia inteiro, no período previsto da atividade ({br(atividade.inicio)} a {br(atividade.termino)}) <span className="sub">· aparece como “livre”</span></span>
          </label>
          <label className="chk">
            <input type="radio" name="agendaModo" checked={modo === 'horario'} onChange={() => setModo('horario')} />
            <span>Num horário específico <span className="sub">· aparece como “ocupado”, com lembrete 15 min antes</span></span>
          </label>
          {modo === 'horario' && (
            <div className="agendaHorario">
              <label className="campo">Dia<input className="ctl" type="date" value={data} onChange={e => setData(e.target.value)} /></label>
              <label className="campo">Início<input className="ctl" type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} /></label>
              <label className="campo">Fim<input className="ctl" type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} /></label>
            </div>
          )}
        </fieldset>
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" className="btn" disabled={salvando} onClick={aoFechar}>Cancelar</button>
          <button type="button" className="btn pri" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Adicionar à agenda'}</button>
        </div>
      </div>
    </>
  );
}
