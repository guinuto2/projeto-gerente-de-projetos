/**
 * E-mails do portal no "jeito Outlook": texto e tabelas simples, sem largura fixa (lê bem no celular),
 * mais um botão para abrir o portal. Estilos inline porque o Outlook ignora CSS externo.
 */
import type { Gate, NovoProjeto, Projeto } from '../types/models';
import { config } from '../config/config';
import { dma } from './datas';

const esc = (s: string) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Endereço do portal para os links: config.urlPortal ou o endereço aberto agora. */
export function urlDoPortal(): string {
  const base = (config.urlPortal || `${window.location.origin}${window.location.pathname}`).replace(/#.*$/, '');
  return base.endsWith('/') || base.endsWith('.html') ? base : base + '/';
}
export const linkProjeto = (cod: string) => `${urlDoPortal()}#/projeto/${encodeURIComponent(cod)}`;

const FONTE = "font-family:Aptos,Calibri,Arial,sans-serif;font-size:14px;color:#222222";
const BORDA = 'border:1px solid #D0D0D0';

interface Email {
  titulo: string;
  intro: string;
  dados: [string, string][];
  equipe?: Projeto['equipe'];
  observacao?: string;
  botao: { texto: string; url: string };
  rodape: string;
}

/**
 * Botão "à prova de Outlook": o Outlook do Windows (motor do Word) ignora padding e tamanho em links,
 * então recebe um retângulo VML; os demais (Outlook web/novo, celular, Gmail) recebem um link estilizado.
 */
function botao(texto: string, url: string): string {
  const largura = Math.max(200, Math.min(320, texto.length * 9 + 48));
  return `<div style="margin:20px 0 6px">
<!--[if mso]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:42px;v-text-anchor:middle;width:${largura}px;" stroke="f" fillcolor="#7E181C">
<w:anchorlock/>
<center style="color:#FFFFFF;font-family:Calibri,Arial,sans-serif;font-size:15px;font-weight:bold;">${esc(texto)}</center>
</v:rect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${url}" target="_blank" style="display:inline-block;background:#7E181C;border:1px solid #7E181C;color:#FFFFFF;font-family:Aptos,Calibri,Arial,sans-serif;font-size:15px;font-weight:bold;line-height:20px;padding:11px 20px;text-decoration:none;border-radius:4px;mso-hide:all">${esc(texto)}</a>
<!--<![endif]-->
</div>`;
}

function montar(e: Email): string {
  const linhaDado = ([k, v]: [string, string]) =>
    `<tr><td style="${BORDA};padding:6px 10px;background:#F3F3F3;width:35%;vertical-align:top"><b>${esc(k)}</b></td><td style="${BORDA};padding:6px 10px;vertical-align:top">${esc(v) || '—'}</td></tr>`;
  const equipe = e.equipe && e.equipe.length
    ? `<p style="margin:18px 0 6px"><b>Equipe</b></p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px;${FONTE}">
${e.equipe.map(m => `<tr><td style="${BORDA};padding:6px 10px;vertical-align:top"><b>${esc(m.nome)}</b><br><span style="color:#555555">${esc([m.funcao, m.empresa].filter(Boolean).join(' · '))}</span>${m.email ? `<br><a href="mailto:${esc(m.email)}" style="color:#0563C1">${esc(m.email)}</a>` : ''}</td></tr>`).join('\n')}
</table>` : '';
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:12px;${FONTE}">
<p style="margin:0 0 4px;font-size:18px"><b>${esc(e.titulo)}</b></p>
<p style="margin:0 0 14px;line-height:1.5">${e.intro}</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px;${FONTE}">
${e.dados.map(linhaDado).join('\n')}
</table>
${e.observacao ? `<p style="margin:14px 0 0;line-height:1.5">${esc(e.observacao)}</p>` : ''}
${equipe}
${botao(e.botao.texto, e.botao.url)}
<p style="margin:0 0 16px;font-size:12px;color:#555555">Se o botão não abrir: <a href="${e.botao.url}" style="color:#0563C1">${esc(e.botao.url)}</a></p>
<p style="margin:0;font-size:12px;color:#777777">${esc(e.rodape)}</p>
</body></html>`;
}

const dadosProjeto = (p: Projeto): [string, string][] => [
  ['Projeto', `${p.codigo} · ${p.nome}`], ['Cliente', p.cliente], ['Tipo', p.tipo],
  ['Gerente de projeto', p.gerente], ['Arquiteto', p.arquiteto], ['Período', `${dma(p.inicio)} a ${dma(p.terminoPrevisto || p.terminoBaseline)}`]
];

/** Projeto criado (PMO) — vai para o destinatário de teste. */
export function emailNovoProjeto({ projeto: p }: NovoProjeto, autor: string) {
  return {
    assunto: `[Portal PMO] Novo projeto ${p.codigo} · ${p.nome} · ${p.cliente}`,
    html: montar({
      titulo: `Novo projeto: ${p.nome}`,
      intro: `O projeto <b>${esc(p.codigo)}</b> foi cadastrado por ${esc(autor)} e está com a situação <b>${esc(p.situacaoCadastro)}</b>.`,
      dados: dadosProjeto(p), equipe: p.equipe, observacao: p.objetivo,
      botao: { texto: 'Abrir o projeto no portal', url: linkProjeto(p.codigo) },
      rodape: 'Mensagem automática do Portal PMO.'
    })
  };
}

/** GP enviou um projeto novo para aprovação do PMO. */
export function emailSolicitacaoProjeto({ projeto: p, atividades, riscos }: NovoProjeto, autor: string) {
  return {
    assunto: `[Portal PMO] Aprovação solicitada · novo projeto ${p.codigo} · ${p.cliente}`,
    html: montar({
      titulo: 'Aprovação de projeto solicitada',
      intro: `${esc(autor)} cadastrou o projeto <b>${esc(p.codigo)} · ${esc(p.nome)}</b> e pediu a aprovação do patrocinador. A aprovação registra o gate <b>G1</b> e coloca o projeto no portfólio.`,
      dados: [...dadosProjeto(p), ['Cronograma', `${atividades.length} atividades (${atividades.filter(a => a.marco).length} marcos)`], ['Riscos', `${riscos.length} registrados`]],
      equipe: p.equipe, observacao: p.objetivo,
      botao: { texto: 'Analisar no portal', url: linkProjeto(p.codigo) },
      rodape: 'No portal, abra o projeto e clique em "Analisar cadastro (G1)". Mensagem automática do Portal PMO.'
    })
  };
}

/** GP pediu a aprovação de um gate. */
export function emailSolicitacaoGate(p: Projeto, g: Gate, progresso: { feitas: number; total: number }, autor: string) {
  return {
    assunto: `[Portal PMO] Aprovação solicitada · ${g.gate} do projeto ${p.codigo} · ${p.cliente}`,
    html: montar({
      titulo: `Aprovação do ${g.gate} solicitada`,
      intro: `${esc(autor)} pediu a aprovação do gate <b>${esc(g.nome)}</b> no projeto <b>${esc(p.codigo)} · ${esc(p.nome)}</b>.`,
      dados: [
        ['Projeto', `${p.codigo} · ${p.nome}`], ['Cliente', p.cliente], ['Gerente de projeto', p.gerente],
        ['Gate', g.nome], ['Fase', g.fase === 'Execução' ? 'Execução e Monitoramento' : g.fase],
        ['Atividades da fase', `${progresso.feitas} de ${progresso.total} concluídas`],
        ['Data prevista do gate', dma(g.data)]
      ],
      observacao: g.info,
      botao: { texto: 'Analisar no portal', url: linkProjeto(p.codigo) },
      rodape: `No portal, abra o projeto, clique no losango ${g.gate} e em "Analisar pedido do PMO". Mensagem automática do Portal PMO.`
    })
  };
}

/** Gate aprovado pelo PMO (G1 de projeto enviado pelo GP vira "Projeto aprovado"). */
export function emailGateAprovado(p: Projeto, g: Gate, extra: { por: string; em: string; parecer: string; proximaFase: string }) {
  const projetoAprovado = g.gate === 'G1';
  const encerrou = g.gate === 'G4';
  const titulo = projetoAprovado ? 'Projeto aprovado' : encerrou ? 'Projeto encerrado' : `${g.gate} aprovado`;
  const resultado = projetoAprovado
    ? `O projeto entrou no portfólio e está na fase de <b>${esc(extra.proximaFase)}</b>.`
    : encerrou ? 'O projeto foi encerrado e aparece em “Projetos encerrados” no portfólio.'
    : `O projeto avançou para a fase de <b>${esc(extra.proximaFase)}</b>.`;
  return {
    assunto: `[Portal PMO] ${titulo} · ${p.codigo} · ${p.cliente}`,
    html: montar({
      titulo,
      intro: `${esc(extra.por)} aprovou o gate <b>${esc(g.nome)}</b> do projeto <b>${esc(p.codigo)} · ${esc(p.nome)}</b>. ${resultado}`,
      dados: [
        ['Projeto', `${p.codigo} · ${p.nome}`], ['Cliente', p.cliente], ['Gerente de projeto', p.gerente],
        ['Gate', g.nome], ['Aprovado por', extra.por], ['Data da aprovação', dma(extra.em)],
        ['Parecer do patrocinador', extra.parecer || '—'], ['Fase atual', encerrou ? 'Encerrado' : extra.proximaFase]
      ],
      botao: { texto: 'Abrir o projeto no portal', url: linkProjeto(p.codigo) },
      rodape: 'Mensagem automática do Portal PMO.'
    })
  };
}

/** Projeto criado pelo PMO (já nasce aprovado). */
export function emailProjetoCriadoPeloPmo({ projeto: p }: NovoProjeto, autor: string) {
  return {
    assunto: `[Portal PMO] Projeto aprovado · ${p.codigo} · ${p.cliente}`,
    html: montar({
      titulo: 'Projeto criado e aprovado pelo patrocinador',
      intro: `${esc(autor)} criou o projeto <b>${esc(p.codigo)} · ${esc(p.nome)}</b>. Ele já está ativo no portfólio, com o G1 aprovado, na fase de <b>Planejamento</b>.`,
      dados: dadosProjeto(p), equipe: p.equipe, observacao: p.objetivo,
      botao: { texto: 'Abrir o projeto no portal', url: linkProjeto(p.codigo) },
      rodape: 'Mensagem automática do Portal PMO.'
    })
  };
}
