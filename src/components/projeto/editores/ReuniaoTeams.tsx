import type { MembroEquipe } from '../../../types/models';
import { TIPOS_REUNIAO, tipoReuniao } from '../../../lib/constantes';
import { testeReuniao } from '../../../state/PortalContext';

export interface FormReuniao {
  ativa: boolean;
  tipo: string;
  titulo: string;
  data: string;
  hora: string;
  duracaoMin: number;
  pauta: string;
  /** e-mail → convidado? (começa com todos da equipe marcados) */
  marcados: Record<string, boolean>;
  extras: string;
}

/** Quem fica marcado por padrão: todos com e-mail, ou só a equipe Systech nas reuniões internas. */
export function marcacaoPadrao(equipe: MembroEquipe[], meuEmail: string, tipo: string): Record<string, boolean> {
  const soSystech = !!tipoReuniao(tipo)?.somenteSystech;
  const marcados: Record<string, boolean> = {};
  for (const m of equipe) {
    if (!m.email || m.email.toLowerCase() === meuEmail.toLowerCase()) continue;
    marcados[m.email.toLowerCase()] = !soSystech || /systech/i.test(m.empresa) || /@systech/i.test(m.email);
  }
  return marcados;
}

export function formReuniaoInicial(equipe: MembroEquipe[], titulo: string, data: string, meuEmail: string): FormReuniao {
  const tipo = 'Alinhamento';
  return { ativa: false, tipo, titulo, data, hora: '10:00', duracaoMin: tipoReuniao(tipo)!.duracaoMin, pauta: '', marcados: marcacaoPadrao(equipe, meuEmail, tipo), extras: '' };
}

/** Convidados finais: marcados da equipe + e-mails extras, sem repetição. */
export function convidados(f: FormReuniao): string[] {
  const extras = f.extras.split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
  return Array.from(new Set([...Object.keys(f.marcados).filter(k => f.marcados[k]), ...extras]));
}

interface Props {
  form: FormReuniao;
  aoMudar: (f: FormReuniao) => void;
  equipe: MembroEquipe[];
  meuEmail: string;
  disponivel: boolean;
  /** por que não está disponível (texto exibido no lugar da explicação) */
  motivo?: string;
  /** editando uma reunião existente */
  edicao?: boolean;
  /** a reunião não pode ser marcada antes desta data */
  dataMinima?: string;
}

/** Seção do painel da atividade para agendar uma reunião do Teams com a equipe do projeto. */
export function ReuniaoTeams({ form: f, aoMudar, equipe, meuEmail, disponivel, motivo, edicao = false, dataMinima }: Props) {
  const muda = <K extends keyof FormReuniao>(k: K, v: FormReuniao[K]) => aoMudar({ ...f, [k]: v });
  const pessoas = equipe.filter(m => m.email && m.email.toLowerCase() !== meuEmail.toLowerCase());
  const semEmail = equipe.filter(m => !m.email);
  const todos = (v: boolean) => muda('marcados', Object.fromEntries(pessoas.map(m => [m.email.toLowerCase(), v])));
  const lista = convidados(f);
  const teste = testeReuniao();
  return (
    <div className="reuniao">
      {edicao
        ? <div><b>Editar reunião do Teams</b><br /><span className="sub">Ao salvar, o Outlook manda a atualização aos convidados. Quem for desmarcado recebe o cancelamento.</span></div>
        : <label className="checar">
            <input type="checkbox" checked={f.ativa} disabled={!disponivel} onChange={e => muda('ativa', e.target.checked)} />
            <span>Agendar reunião no Teams<br /><span className="sub">{disponivel
              ? 'Cria o evento no seu calendário, com link do Teams, e envia o convite às pessoas marcadas.'
              : (motivo || 'Indisponível.')}</span></span>
          </label>}
      {f.ativa && (
        <>
          <div className="campo">Tipo de reunião
            <div className="chips" role="radiogroup" aria-label="Tipo de reunião">
              {TIPOS_REUNIAO.map(t => (
                <button key={t.nome} type="button" role="radio" aria-checked={f.tipo === t.nome} className={`chip ${f.tipo === t.nome ? 'on' : ''}`} title={t.descricao}
                  onClick={() => aoMudar({ ...f, tipo: t.nome, duracaoMin: t.duracaoMin, marcados: edicao ? f.marcados : marcacaoPadrao(equipe, meuEmail, t.nome),
                    // título ainda automático ("Tipo · …"): troca o prefixo
                    titulo: TIPOS_REUNIAO.some(x => f.titulo.startsWith(x.nome + ' · ')) ? t.nome + f.titulo.slice(f.titulo.indexOf(' · ')) : f.titulo })}>
                  {t.nome}
                </button>
              ))}
            </div>
            <span className="dica">{tipoReuniao(f.tipo)?.descricao}{tipoReuniao(f.tipo)?.somenteSystech && !edicao ? ' — o cliente fica desmarcado.' : ''}</span>
          </div>
          <label className="campo">Título da reunião<input className="ctl" value={f.titulo} onChange={e => muda('titulo', e.target.value)} /></label>
          <div className="fg3">
            <label className="campo">Data<input className={`ctl ${dataMinima && f.data && f.data < dataMinima ? 'erro' : ''}`} type="date" min={dataMinima} value={f.data} onChange={e => muda('data', e.target.value)} /></label>
            <label className="campo">Início<input className="ctl" type="time" value={f.hora} onChange={e => muda('hora', e.target.value)} /></label>
            <label className="campo">Duração
              <select className="ctl" value={f.duracaoMin} onChange={e => muda('duracaoMin', Number(e.target.value))}>
                {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}`}</option>)}
              </select>
            </label>
          </div>
          <label className="campo">{edicao ? 'Pauta (opcional; substitui o texto do convite)' : 'Pauta (opcional)'}<textarea className="ctl" rows={3} value={f.pauta} onChange={e => muda('pauta', e.target.value)} placeholder="Assuntos da reunião" /></label>
          <div>
            <div className="linha" style={{ marginBottom: 6 }}>
              <span className="h3" style={{ fontSize: 14 }}>Participantes da equipe</span>
              {pessoas.length > 1 && <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn pq" onClick={() => todos(true)}>Marcar todos</button>
                <button type="button" className="btn pq" onClick={() => todos(false)}>Desmarcar todos</button>
              </span>}
            </div>
            {pessoas.length ? (
              <ul className="participantes">
                {pessoas.map(m => {
                  const k = m.email.toLowerCase();
                  return (
                    <li key={k}>
                      <label className="checar">
                        <input type="checkbox" checked={!!f.marcados[k]} onChange={e => muda('marcados', { ...f.marcados, [k]: e.target.checked })} />
                        <span><b>{m.nome}</b> · {m.funcao}<br /><span className="sub">{m.email}</span></span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="sub">Ninguém da equipe tem e-mail cadastrado. Inclua e-mails em “Editar projeto → Equipe” ou use o campo abaixo.</p>}
            {semEmail.length > 0 && <p className="sub" style={{ marginTop: 6 }}>Sem e-mail na equipe (não serão convidados): {semEmail.map(m => m.nome).join(', ')}.</p>}
          </div>
          <label className="campo">Outros convidados (opcional)
            <input className="ctl" value={f.extras} onChange={e => muda('extras', e.target.value)} placeholder="email@cliente.com.br, outro@empresa.com.br" />
          </label>
          <div className="sub">{lista.length} convidado(s). Você é o organizador.</div>
          {teste && (
            <div className="msg info">
              Modo de teste: o convite vai só para <b>{teste.join(', ')}</b>, não para as pessoas marcadas acima.
              {teste.every(x => x.toLowerCase() === meuEmail.toLowerCase()) &&
                <> Como esse endereço é o seu e você é o organizador, <b>nenhum convite será enviado</b>: a reunião aparece direto na sua agenda.</>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
