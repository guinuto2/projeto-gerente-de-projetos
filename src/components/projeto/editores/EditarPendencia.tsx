import { useState } from 'react';
import type { Pendencia, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { proximoCodigoSeq } from '../../../lib/constantes';
import { Drawer } from '../../ui/Drawer';

/** Inclui (sem código) ou responde/exclui uma pendência (questionamento ao cliente). */
export function EditarPendencia({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo?: string; aoFechar: () => void }) {
  const { dados, salvarPendencia, criarPendencia, excluirPendencia } = usePortal();
  const toast = useToast();
  const lista = dados.pendencias[projeto.codigo] || [];
  const p = codigo ? lista.find(x => x.codigo === codigo) : undefined;
  const nova = !p;
  const [f, setF] = useState({
    codigo: p?.codigo || proximoCodigoSeq(lista.map(x => x.codigo), 'P-'),
    pergunta: p?.pergunta || '', detalhe: p?.detalhe || '', impacto: p?.impacto || '',
    situacao: (p?.situacao || 'Aberta') as Pendencia['situacao'], resposta: p?.resposta || ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  const salvar = async () => {
    if (nova && !f.pergunta.trim()) { setErro('Escreva a pendência (a pergunta ao cliente).'); return; }
    setSalvando(true); setErro('');
    try {
      if (nova) {
        await criarPendencia(projeto.codigo, { codigo: f.codigo.trim(), pergunta: f.pergunta.trim(), detalhe: f.detalhe.trim(), impacto: f.impacto.trim(), situacao: f.situacao, resposta: f.resposta.trim() });
        toast(`Pendência ${f.codigo.trim()} incluída.`);
      } else {
        await salvarPendencia(projeto.codigo, p.codigo, { situacao: f.situacao, resposta: f.resposta.trim() });
        toast('Alteração salva.');
      }
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  const excluir = async () => {
    if (!p || !confirm(`Excluir a pendência ${p.codigo} · ${p.pergunta}?`)) return;
    setSalvando(true);
    try { await excluirPendencia(projeto.codigo, p.codigo); toast(`Pendência ${p.codigo} excluída.`); aoFechar(); }
    catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto titulo={nova ? 'Nova pendência' : `${p.codigo} · ${p.pergunta}`} subtitulo={`${projeto.codigo} · Pendência / questionamento ao cliente`}
      salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar} rotuloSalvar={nova ? 'Incluir pendência' : 'Salvar'}
      acoes={!nova && <button type="button" className="btn perigo" disabled={salvando} onClick={excluir}>Excluir</button>}>
      {nova ? (
        <>
          <label className="campo" style={{ maxWidth: 200 }}>Código<input className="ctl" value={f.codigo} onChange={muda('codigo')} /></label>
          <label className="campo">Pendência *<textarea className="ctl" rows={2} value={f.pergunta} onChange={muda('pergunta')} placeholder="O que precisa ser definido ou respondido pelo cliente" /></label>
          <label className="campo">Detalhamento<textarea className="ctl" rows={3} value={f.detalhe} onChange={muda('detalhe')} /></label>
          <label className="campo">Impacto<textarea className="ctl" rows={2} value={f.impacto} onChange={muda('impacto')} placeholder="O que acontece se não for respondida" /></label>
        </>
      ) : (
        <>
          <div><div className="sub">Detalhamento</div><div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>{p.detalhe || '—'}</div></div>
          <div><div className="sub">Impacto</div><div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>{p.impacto || '—'}</div></div>
        </>
      )}
      <label className="campo">Situação
        <select className="ctl" value={f.situacao} onChange={e => setF(s => ({ ...s, situacao: e.target.value as Pendencia['situacao'] }))}>
          <option>Aberta</option><option>Respondida</option>
        </select>
      </label>
      {(!nova || f.situacao === 'Respondida') && <label className="campo">Resposta do cliente<textarea className="ctl" value={f.resposta} onChange={muda('resposta')} /></label>}
    </Drawer>
  );
}
