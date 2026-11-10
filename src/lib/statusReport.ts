import type { Atividade, Dados, Projeto } from '../types/models';
import { avanco, desvio, pendenciasAbertas, planejado, riscosAltos } from './calculos';
import { somarDiasUteis } from './datas';

/**
 * Status report semanal de um projeto (HTML pronto para e-mail e para imprimir em PDF).
 * Versão "cliente": sem riscos, farol e próximos marcos (análise interna da Systech).
 */
const esc = (s: string) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const br = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '—');
const BORDA = 'border:1px solid #D9D9D9';
const aberta = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado';

/** Segunda-feira da semana de uma data (ISO). */
export function inicioDaSemana(iso: string): string {
  const d = new Date(`${iso}T12:00:00`); const dia = d.getDay() || 7;
  d.setDate(d.getDate() - (dia - 1));
  return d.toISOString().slice(0, 10);
}

/** Destinatários do cliente: pessoas da equipe que não são da Systech e têm e-mail. */
export const emailsDoCliente = (p: Projeto) => p.equipe.filter(m => m.email && (m.empresa || '').trim().toLowerCase() !== 'systech').map(m => m.email).join(', ');

export function montarStatusReport(p: Projeto, d: Dados, hoje: string, versao: 'equipe' | 'cliente') {
  const lista = (d.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado' && (versao === 'equipe' || a.lancada !== false));
  const ini = inicioDaSemana(hoje), em14 = somarDiasUteis(hoje, 10);
  const concluidas = lista.filter(a => a.status === 'Concluído' && (a.dataReal || a.dataUltimaAtualizacao || '') >= ini && (a.dataReal || a.dataUltimaAtualizacao || '') <= hoje);
  const proximas = lista.filter(a => aberta(a) && a.termino >= hoje && a.inicio <= em14).sort((x, y) => x.inicio.localeCompare(y.inicio)).slice(0, 12);
  const atrasadas = lista.filter(a => aberta(a) && a.termino && a.termino < hoje).sort((x, y) => x.termino.localeCompare(y.termino));
  const marcos = versao === 'equipe' ? lista.filter(a => a.marco && aberta(a)).sort((x, y) => x.termino.localeCompare(y.termino)).slice(0, 5) : [];
  const riscos = versao === 'equipe' ? riscosAltos(d, p.codigo) : [];
  const pend = pendenciasAbertas(d, p.codigo);
  const av = avanco(d, p.codigo), pl = planejado(d, p.codigo, hoje), dv = desvio(p);
  const cor = { Verde: '#1E7A46', Amarelo: '#B7791F', Vermelho: '#C0392B' }[p.farol] || '#555555';

  const tabela = (titulo: string, linhas: string[], vazio: string, cab: string[]) => `
<h3 style="margin:22px 0 8px;font-size:15px;color:#7E181C">${titulo}</h3>
${linhas.length ? `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
<tr>${cab.map(c => `<th align="left" style="${BORDA};padding:6px 8px;background:#F4F4F4">${c}</th>`).join('')}</tr>${linhas.join('')}</table>`
    : `<p style="margin:0;color:#777777;font-size:13px">${vazio}</p>`}`;
  const td = (s: string, extra = '') => `<td style="${BORDA};padding:6px 8px;${extra}">${s}</td>`;
  const nomeAtv = (a: Atividade) => `${esc(a.codigo)} · ${esc(a.nome)}${a.pai ? ` <span style="color:#777777">(tarefa de ${esc(a.pai)})</span>` : ''}`;

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1F1F1F;max-width:760px">
<p style="margin:0;font-size:12px;color:#777777">Status report semanal · ${br(ini)} a ${br(hoje)}${versao === 'cliente' ? '' : ' · versão interna'}</p>
<h2 style="margin:4px 0 2px;font-size:20px">${esc(p.codigo)} · ${esc(p.nome)}</h2>
<p style="margin:0 0 14px;color:#555555">${esc(p.cliente)} · Fase: <b>${esc(p.fase)}</b> · Gerente: ${esc(p.gerente || '—')}</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px"><tr>
${td(`<div style="color:#777777;font-size:12px">Progresso</div><div style="font-size:20px;font-weight:bold">${av}%</div><div style="color:#777777;font-size:12px">planejado para hoje: ${pl}%</div>`)}
${versao === 'equipe' ? td(`<div style="color:#777777;font-size:12px">Farol</div><div style="font-size:16px;font-weight:bold;color:${cor}">● ${esc(p.farol)}</div>`) : ''}
${td(`<div style="color:#777777;font-size:12px">Término previsto</div><div style="font-size:16px;font-weight:bold">${br(p.terminoPrevisto || p.terminoBaseline)}</div>${dv > 0 ? `<div style="color:#C0392B;font-size:12px">+${dv} dia(s) útil(eis) sobre a baseline</div>` : '<div style="color:#1E7A46;font-size:12px">dentro da baseline</div>'}`)}
${td(`<div style="color:#777777;font-size:12px">Nesta semana</div><div style="font-size:16px;font-weight:bold">${concluidas.length} concluída(s)</div><div style="color:${atrasadas.length ? '#C0392B' : '#777777'};font-size:12px">${atrasadas.length} atrasada(s)</div>`)}
</tr></table>
${tabela('Concluídas nesta semana', concluidas.map(a => `<tr>${td(nomeAtv(a))}${td(br(a.dataReal || a.dataUltimaAtualizacao))}</tr>`), 'Nenhuma atividade concluída nesta semana.', ['Atividade', 'Concluída em'])}
${tabela('Próximas atividades (2 semanas)', proximas.map(a => `<tr>${td(nomeAtv(a))}${td(`${br(a.inicio)} a ${br(a.termino)}`)}${td(`${a.status === 'Concluído' ? 100 : a.percentual}%`)}</tr>`), 'Nada previsto para as próximas duas semanas.', ['Atividade', 'Período', '%'])}
${tabela('Atrasadas', atrasadas.map(a => `<tr>${td(nomeAtv(a))}${td(br(a.termino), 'color:#C0392B;font-weight:bold')}${td(esc(a.causaAtraso || '—'))}</tr>`), 'Nenhuma atividade atrasada.', ['Atividade', 'Prevista para', 'Causa'])}
${versao === 'equipe' ? tabela('Próximos marcos', marcos.map(a => `<tr>${td(nomeAtv(a))}${td(br(a.termino))}</tr>`), 'Nenhum marco pendente.', ['Marco', 'Previsto para']) : ''}
${tabela('Pendências com o cliente', pend.map(x => `<tr>${td(`${esc(x.codigo)} · ${esc(x.pergunta)}`)}${td(esc(x.impacto || '—'))}${td(br(x.prazo), x.prazo && x.prazo < hoje ? 'color:#C0392B;font-weight:bold' : '')}</tr>`), 'Nenhuma pendência aberta.', ['Pendência', 'Impacto', 'Prazo'])}
${versao === 'equipe' ? tabela('Riscos altos abertos (interno)', riscos.map(r => `<tr>${td(`${esc(r.codigo)} · ${esc(r.descricao)}`)}${td(esc(r.mitigacao || '—'))}</tr>`), 'Nenhum risco alto aberto.', ['Risco', 'Mitigação']) : ''}
<p style="margin:24px 0 0;font-size:12px;color:#777777">Gerado pela Central Systech em ${br(hoje)}.</p>
</div>`;
  const assunto = `[Central Systech] Status report · ${p.codigo} · semana de ${br(ini)}`;
  return { assunto, html };
}
