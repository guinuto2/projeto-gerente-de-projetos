import type { Atividade, Projeto } from '../types/models';
import { somarDiasCorridos } from './datas';

/**
 * Agenda do Outlook/Teams de quem está logado (Microsoft Graph, permissão delegada Calendars.ReadWrite).
 * Tudo o que o Outlook mostra aparece também no calendário do Teams: é o mesmo calendário.
 */

/** A leitura automática precisa da permissão Calendars.ReadWrite (consentimento numa janela, uma vez só). */
export class AgendaSemPermissao extends Error {
  constructor() { super('Para mostrar sua agenda, o portal precisa da permissão de calendário. Clique em “Conectar agenda”.'); this.name = 'AgendaSemPermissao'; }
}

/** Fuso usado em todas as datas da agenda. */
export const FUSO_AGENDA = 'E. South America Standard Time';

/**
 * Etiqueta invisível gravada no compromisso (propriedade estendida do Outlook) com a chave da atividade.
 * Permite achar o compromisso de uma atividade em qualquer computador, sem guardar nada no navegador.
 */
export const PROPRIEDADE_ATIVIDADE = 'String {7b3f6a52-1c4e-4f0a-9a1d-2c6e8b5d4f31} Name CentralSystechAtividade';

/** Compromisso da agenda, já no horário de Brasília. */
export interface EventoAgenda {
  id: string;
  titulo: string;
  /** 'AAAA-MM-DDTHH:mm:ss' (horário de Brasília) */
  inicio: string;
  fim: string;
  diaInteiro: boolean;
  local?: string;
  /** abrir no Outlook na web */
  link?: string;
  /** entrar na reunião do Teams */
  linkTeams?: string;
  /** chave 'PROJETO|ATIVIDADE' quando o compromisso foi criado pelo portal */
  atividade?: string;
}

/** Como a atividade entra na agenda. */
export type OpcoesAgenda =
  | { modo: 'periodo' }
  | { modo: 'horario'; data: string; horaInicio: string; horaFim: string };

export const chaveAtividade = (cod: string, codigo: string) => `${cod}|${codigo}`;

const esc = (s: string) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const br = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

/** Título do compromisso: código do projeto e nome da atividade. */
export const tituloAgenda = (p: Projeto, a: Atividade) => `[${p.codigo}] ${a.nome}`;

/** Problemas no horário escolhido ('' se estiver tudo certo). */
export function validarOpcoesAgenda(o: OpcoesAgenda, a: Atividade): string {
  if (o.modo === 'periodo') return a.inicio && a.termino ? '' : 'A atividade não tem início e término previstos: escolha um horário.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.data || '')) return 'Escolha o dia.';
  if (!/^\d{2}:\d{2}$/.test(o.horaInicio || '') || !/^\d{2}:\d{2}$/.test(o.horaFim || '')) return 'Informe o horário de início e de fim.';
  if (o.horaFim <= o.horaInicio) return 'O horário de fim precisa ser depois do início.';
  return '';
}

/**
 * Corpo do compromisso para o Microsoft Graph (POST/PATCH /me/events).
 * "periodo": dia inteiro, do início ao término previstos da atividade (aparece como livre, para não bloquear a agenda).
 * "horario": um bloco de horário num dia (aparece como ocupado).
 */
export function montarEventoAtividade(p: Projeto, a: Atividade, o: OpcoesAgenda, urlPortal = '', titulo?: string) {
  const link = urlPortal ? `${urlPortal.replace(/\/+$/, '')}/#/atualizar?item=${encodeURIComponent(chaveAtividade(p.codigo, a.codigo))}` : '';
  const descricao = (a.descricao || '').trim();
  const html = [
    `<p><b>${esc(a.nome)}</b></p>`,
    descricao ? `<p>${esc(descricao).replace(/\n/g, '<br>')}</p>` : '<p style="color:#777777">Sem descrição.</p>',
    `<p style="color:#555555">Projeto: ${esc(p.codigo)} · ${esc(p.nome)}<br>Fase: ${esc(a.fase)} · Previsto: ${br(a.inicio)} a ${br(a.termino)}</p>`,
    link ? `<p><a href="${esc(link)}">Abrir a atividade na Central Systech</a></p>` : '',
  ].join('');
  const tempo = o.modo === 'periodo'
    ? {
      isAllDay: true, showAs: 'free', isReminderOn: false,
      start: { dateTime: `${a.inicio}T00:00:00`, timeZone: FUSO_AGENDA },
      // no Outlook, o fim de um compromisso de dia inteiro é o dia SEGUINTE ao último dia
      end: { dateTime: `${somarDiasCorridos(a.termino, 1)}T00:00:00`, timeZone: FUSO_AGENDA },
    }
    : {
      isAllDay: false, showAs: 'busy', isReminderOn: true, reminderMinutesBeforeStart: 15,
      start: { dateTime: `${o.data}T${o.horaInicio}:00`, timeZone: FUSO_AGENDA },
      end: { dateTime: `${o.data}T${o.horaFim}:00`, timeZone: FUSO_AGENDA },
    };
  return {
    subject: (titulo || tituloAgenda(p, a)).trim(),
    body: { contentType: 'HTML', content: html },
    ...tempo,
    singleValueExtendedProperties: [{ id: PROPRIEDADE_ATIVIDADE, value: chaveAtividade(p.codigo, a.codigo) }],
  };
}

/** Compromissos agrupados por dia (AAAA-MM-DD), em ordem; um compromisso de vários dias aparece em cada dia do intervalo pedido. */
export function agruparPorDia(eventos: EventoAgenda[], de: string, ate: string): { dia: string; eventos: EventoAgenda[] }[] {
  const dias: { dia: string; eventos: EventoAgenda[] }[] = [];
  for (let d = de; d <= ate; d = somarDiasCorridos(d, 1)) {
    const doDia = eventos.filter(e => {
      const ini = e.inicio.slice(0, 10);
      // dia inteiro: o fim é exclusivo (dia seguinte); com horário, o fim conta até o próprio dia
      const fim = e.diaInteiro ? somarDiasCorridos(e.fim.slice(0, 10), -1) : e.fim.slice(0, 10);
      return ini <= d && d <= (fim < ini ? ini : fim);
    }).sort((x, y) => Number(y.diaInteiro) - Number(x.diaInteiro) || x.inicio.localeCompare(y.inicio));
    if (doDia.length) dias.push({ dia: d, eventos: doDia });
  }
  return dias;
}

/** Horário para mostrar: "Dia inteiro" ou "09:00–10:00". */
export const horarioEvento = (e: EventoAgenda) => (e.diaInteiro ? 'Dia inteiro' : `${e.inicio.slice(11, 16)}–${e.fim.slice(11, 16)}`);
