import { useState } from 'react';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { usePapel } from '../../state/PapelContext';
import { useToast } from '../../state/ToastContext';
import { emailsDoCliente, montarStatusReport } from '../../lib/statusReport';
import { Mensagem } from '../ui/Mensagem';

/** Janela do status report: prévia (versão interna ou do cliente), imprimir/PDF e enviar agora. */
export function StatusReport({ projeto: p, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { dados, hoje, fonte, enviarStatusReport } = usePortal();
  const { papel } = usePapel();
  const toast = useToast();
  const [versao, setVersao] = useState<'equipe' | 'cliente'>('equipe');
  const [enviando, setEnviando] = useState(false); const [erro, setErro] = useState('');
  const r = montarStatusReport(p, dados, hoje, versao);
  const doCliente = emailsDoCliente(p);
  const imprimir = () => {
    const w = window.open('', '_blank');
    if (!w) { toast('O navegador bloqueou a janela de impressão. Libere os pop-ups deste site.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${r.assunto}</title><style>@page{margin:16mm}body{margin:0}</style></head><body>${r.html}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };
  const enviar = async () => {
    if (!window.confirm('Enviar agora o status report por e-mail (versão interna ao gerente e ao patrocinador; versão do cliente às pessoas do cliente)?')) return;
    setEnviando(true); setErro('');
    try { const para = await enviarStatusReport(p.codigo); toast(`Status report enviado para ${para.join('; ')}.`); aoFechar(); }
    catch (e) { setErro((e as Error).message); setEnviando(false); }
  };
  return (
    <>
      <div className="fundoDr" onClick={() => !enviando && aoFechar()} />
      <div className="modal statusReportModal" role="dialog" aria-modal="true" aria-label="Status report">
        <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className="h3">Status report · {p.codigo}</h2>
            <p className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>
              {p.ultimoStatusReport ? `Último envio: ${p.ultimoStatusReport.split('-').reverse().join('/')}.` : 'Ainda não enviado.'} O envio automático é semanal (configurado no config.js).
            </p>
          </div>
          <div className="fabAbas" role="tablist" style={{ borderBottom: 0 }}>
            <button type="button" role="tab" aria-selected={versao === 'equipe'} className={`fabAba ${versao === 'equipe' ? 'on' : ''}`} onClick={() => setVersao('equipe')}>Versão interna</button>
            <button type="button" role="tab" aria-selected={versao === 'cliente'} className={`fabAba ${versao === 'cliente' ? 'on' : ''}`} onClick={() => setVersao('cliente')}>Versão do cliente</button>
          </div>
        </div>
        <p className="sub" style={{ fontSize: 12.5 }}>
          {versao === 'equipe' ? 'Vai para o gerente do projeto e o patrocinador. Inclui os riscos altos.' : doCliente ? `Vai para as pessoas do cliente: ${doCliente}. Sem os riscos (análise interna).` : 'Nenhuma pessoa do cliente com e-mail na equipe: a versão do cliente não será enviada.'}
        </p>
        <iframe className="statusReportPrevia" title="Prévia do status report" srcDoc={`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:16px">${r.html}</body></html>`} />
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="linha" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" className="btn" disabled={enviando} onClick={aoFechar}>Fechar</button>
          <button type="button" className="btn" disabled={enviando} onClick={imprimir}>Imprimir / salvar PDF</button>
          {papel === 'PMO' && <button type="button" className="btn pri" disabled={enviando || !fonte.enviarEmail} title={fonte.enviarEmail ? undefined : 'No modo piloto o e-mail não é enviado'} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar agora'}</button>}
        </div>
      </div>
    </>
  );
}
