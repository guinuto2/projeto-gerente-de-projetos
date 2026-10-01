import type { NovoProjeto } from '../types/models';
import { config } from '../config/config';
import { dma } from './datas';

const esc = (s: string) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Endereço do portal para os links: config.urlPortal ou o endereço aberto agora. */
export function urlDoPortal(): string {
  const base = (config.urlPortal || `${window.location.origin}${window.location.pathname}`).replace(/#.*$/, '');
  return base.endsWith('/') || base.endsWith('.html') ? base : base + '/';
}

// Cores da identidade Systech. O layout usa tabelas e estilos inline para funcionar no Outlook.
const C = { preto: '#0B0E13', vinho: '#7E181C', texto: '#181D23', suave: '#575A5F', borda: '#E3E4E6', fundo: '#F5F5F6', claro: '#BABABA' };

/** E-mail enviado quando um projeto é cadastrado: título, cliente, equipe e link de acesso. */
export function emailNovoProjeto({ projeto: p }: NovoProjeto, autor: string): { assunto: string; html: string } {
  const link = `${urlDoPortal()}#/projeto/${encodeURIComponent(p.codigo)}`;
  const celula = `padding:10px 12px;border-bottom:1px solid ${C.borda};font-size:14px;color:${C.texto}`;
  const equipe = p.equipe.length
    ? p.equipe.map(m => `
          <tr>
            <td style="${celula};font-weight:600">${esc(m.nome)}</td>
            <td style="${celula};color:${C.suave}">${esc(m.funcao)}</td>
            <td style="${celula};color:${C.suave}">${esc(m.empresa)}</td>
            <td style="${celula}">${m.email ? `<a href="mailto:${esc(m.email)}" style="color:${C.vinho};text-decoration:none">${esc(m.email)}</a>` : '<span style="color:#8A8D92">—</span>'}</td>
          </tr>`).join('')
    : `<tr><td colspan="4" style="${celula};color:${C.suave}">Equipe ainda não informada.</td></tr>`;
  const dado = (rotulo: string, valor: string) => `
          <td style="padding:0 24px 0 0;vertical-align:top">
            <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.suave}">${rotulo}</div>
            <div style="font-size:15px;font-weight:600;color:${C.texto};margin-top:3px">${esc(valor) || '—'}</div>
          </td>`;

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:${C.fundo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fundo};padding:24px 0">
 <tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid ${C.borda};font-family:Montserrat,'Segoe UI',Arial,sans-serif">
   <tr><td style="background:${C.preto};padding:18px 28px;border-bottom:3px solid ${C.vinho}">
     <span style="display:inline-block;background:${C.vinho};color:#fff;font-weight:700;font-size:12px;padding:5px 8px">PMO</span>
     <span style="color:#fff;font-weight:600;font-size:15px;margin-left:10px">Systech · Escritório de Projetos</span>
   </td></tr>
   <tr><td style="padding:28px 28px 8px">
     <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${C.vinho};font-weight:700">Novo projeto cadastrado</div>
     <div style="font-size:24px;line-height:1.25;font-weight:700;color:${C.texto};margin-top:8px">${esc(p.nome)}</div>
     <div style="font-size:13px;color:${C.suave};margin-top:6px;font-family:Consolas,'Courier New',monospace">${esc(p.codigo)}</div>
   </td></tr>
   <tr><td style="padding:16px 28px 4px">
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
       ${dado('Cliente', p.cliente)}${dado('Gerente de projeto', p.gerente)}${dado('Período', `${dma(p.inicio)} a ${dma(p.terminoPrevisto)}`)}
     </tr></table>
   </td></tr>
   ${p.objetivo ? `<tr><td style="padding:16px 28px 0;font-size:14px;line-height:1.55;color:${C.suave}">${esc(p.objetivo)}</td></tr>` : ''}
   <tr><td style="padding:24px 28px 8px">
     <div style="font-size:15px;font-weight:700;color:${C.texto};margin-bottom:8px">Equipe do projeto</div>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.borda}">
       <tr style="background:${C.fundo}">
         <th align="left" style="padding:8px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave}">Nome</th>
         <th align="left" style="padding:8px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave}">Função</th>
         <th align="left" style="padding:8px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave}">Empresa</th>
         <th align="left" style="padding:8px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave}">E-mail</th>
       </tr>${equipe}
     </table>
   </td></tr>
   <tr><td style="padding:24px 28px 8px">
     <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.vinho}">
       <a href="${link}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none">Acessar o projeto no portal</a>
     </td></tr></table>
     <div style="font-size:12px;color:${C.suave};margin-top:10px">Se o botão não abrir, copie o endereço: <a href="${link}" style="color:${C.vinho}">${esc(link)}</a></div>
   </td></tr>
   <tr><td style="padding:20px 28px 24px;font-size:12px;color:#8A8D92;border-top:1px solid ${C.borda}">
     Cadastrado por ${esc(autor)} · situação: ${esc(p.situacaoCadastro)}.<br>Mensagem automática de teste do Portal PMO.
   </td></tr>
  </table>
 </td></tr>
</table>
</body></html>`;
  return { assunto: `[Portal PMO] Novo projeto ${p.codigo} · ${p.nome} · ${p.cliente}`, html };
}
