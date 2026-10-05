import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { usePortal, useBloqueioSincronizacao } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { config } from '../../config/config';

/** Confirmação forte: mostra o que será apagado e exige digitar o código do projeto. */
export function ExcluirProjeto({ projeto: p, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { dados, fonte, excluirProjeto, avisarExclusaoProjeto } = usePortal();
  const toast = useToast();
  const navegar = useNavigate();
  const [digitado, setDigitado] = useState('');
  const [documentos, setDocumentos] = useState(true);   // por padrão a pasta vai junto (lixeira), para não sobrar pasta solta
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');
  useBloqueioSincronizacao('excluir-projeto', true);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && !excluindo) aoFechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [aoFechar, excluindo]);

  const c = p.codigo;
  const itens: [string, number][] = [
    ['gates', p.fases.length + (p.gatesRepetidos?.length || 0)],
    ['atividades', (dados.atividades[c] || []).length],
    ['riscos', (dados.riscos[c] || []).length],
    ['pendências', (dados.pendencias[c] || []).length],
    ['decisões', (dados.decisoes[c] || []).length]
  ];
  const confere = digitado.trim().toUpperCase() === c.toUpperCase();

  const excluir = async () => {
    if (!confere) return;
    setExcluindo(true); setErro('');
    try {
      const foto = { ...p, equipe: [...p.equipe] };   // o aviso usa os dados de antes da exclusão
      await excluirProjeto(c, { documentos });
      toast(`Projeto ${c} excluído.`);
      navegar('/');
      if (config.emailAoExcluirProjeto && fonte.modo === 'sharepoint') {
        avisarExclusaoProjeto(foto, itens, documentos)
          .then(para => toast(`Projeto ${c} excluído. Aviso enviado para: ${para}.`))
          .catch(e => toast(`Projeto ${c} excluído, mas o e-mail de aviso não saiu: ${(e as Error).message}.`));
      }
    } catch (e) { setErro((e as Error).message); setExcluindo(false); }
  };

  return (
    <>
      <div className="fundoDr" onClick={() => !excluindo && aoFechar()} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="excluir-titulo">
        <h2 id="excluir-titulo" className="h3">Excluir o projeto {c}?</h2>
        <p className="sub" style={{ fontSize: 14, lineHeight: 1.5 }}>{p.nome}</p>
        <div className="msg erro">Esta ação não pode ser desfeita pelo portal. Serão apagados o projeto e tudo o que está vinculado a ele:</div>
        {config.emailAoExcluirProjeto && fonte.modo === 'sharepoint' && <p className="sub" style={{ margin: 0 }}>A equipe do projeto, o PMO e o patrocinador recebem um e-mail avisando da exclusão.</p>}
        <ul className="ul" style={{ marginTop: 0 }}>
          {itens.map(([t, n]) => <li key={t}><b>{n}</b> {t}</li>)}
        </ul>
        {fonte.modo === 'sharepoint' && (
          <label className="checar">
            <input type="checkbox" checked={documentos} onChange={e => setDocumentos(e.target.checked)} />
            <span>Excluir também a pasta de documentos do projeto<br /><span className="sub">A pasta vai para a lixeira do site do SharePoint e pode ser restaurada por até 93 dias.</span></span>
          </label>
        )}
        <label className="campo">Para confirmar, digite o código do projeto: <span className="mono">{c}</span>
          <input className="ctl" autoFocus value={digitado} onChange={e => setDigitado(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') excluir(); }} aria-label="Código do projeto" />
        </label>
        {erro && <div className="msg erro">{erro}</div>}
        <div className="linha" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" disabled={excluindo} onClick={aoFechar}>Cancelar</button>
          <button type="button" className="btn excluir" disabled={!confere || excluindo} onClick={excluir}>{excluindo ? 'Excluindo…' : 'Excluir projeto'}</button>
        </div>
      </div>
    </>
  );
}
