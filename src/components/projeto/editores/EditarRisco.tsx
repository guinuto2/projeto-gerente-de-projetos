import { useState } from 'react';
import type { Nivel, Projeto, Risco, SituacaoRisco } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { NIVEIS, SITUACOES_RISCO, proximoCodigoSeq } from '../../../lib/constantes';
import { Drawer } from '../../ui/Drawer';

/** Inclui (sem código) ou edita/exclui um risco do projeto. */
export function EditarRisco({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo?: string; aoFechar: () => void }) {
  const { dados, salvarRisco, criarRisco, excluirRisco } = usePortal();
  const toast = useToast();
  const lista = dados.riscos[projeto.codigo] || [];
  const r = codigo ? lista.find(x => x.codigo === codigo) : undefined;
  const novo = !r;
  const [f, setF] = useState({
    codigo: r?.codigo || proximoCodigoSeq(lista.map(x => x.codigo), 'R-'),
    descricao: r?.descricao || '', impactoProjeto: r?.impactoProjeto || '',
    probabilidade: (r?.probabilidade || 'Médio') as Nivel, impacto: (r?.impacto || 'Médio') as Nivel,
    situacao: (r?.situacao || 'Aberto') as SituacaoRisco, responsavel: r?.responsavel || '',
    mitigacao: r?.mitigacao || '', contingencia: r?.contingencia || ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  const salvar = async () => {
    if (!f.descricao.trim()) { setErro('Descreva o risco.'); return; }
    if (novo && !f.codigo.trim()) { setErro('Informe o código do risco.'); return; }
    setSalvando(true); setErro('');
    try {
      if (novo) {
        const risco: Risco = { codigo: f.codigo.trim(), descricao: f.descricao.trim(), impactoProjeto: f.impactoProjeto.trim(), cenarios: '',
          probabilidade: f.probabilidade, impacto: f.impacto, mitigacao: f.mitigacao.trim(), contingencia: f.contingencia.trim(),
          responsavel: f.responsavel.trim(), situacao: f.situacao };
        await criarRisco(projeto.codigo, risco);
        toast(`Risco ${risco.codigo} incluído.`);
      } else {
        await salvarRisco(projeto.codigo, r.codigo, { probabilidade: f.probabilidade, impacto: f.impacto, situacao: f.situacao, responsavel: f.responsavel.trim(), mitigacao: f.mitigacao.trim() });
        toast('Alteração salva.');
      }
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  const excluir = async () => {
    if (!r || !confirm(`Excluir o risco ${r.codigo} · ${r.descricao}?`)) return;
    setSalvando(true);
    try { await excluirRisco(projeto.codigo, r.codigo); toast(`Risco ${r.codigo} excluído.`); aoFechar(); }
    catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto titulo={novo ? 'Novo risco' : `${r.codigo} · ${r.descricao}`} subtitulo={`${projeto.codigo} · ${novo ? 'riscos' : r.cenarios ? 'Cenários ' + r.cenarios : 'Risco'}`}
      salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar} rotuloSalvar={novo ? 'Incluir risco' : 'Salvar'}
      acoes={!novo && <button type="button" className="btn perigo" disabled={salvando} onClick={excluir}>Excluir</button>}>
      {novo ? (
        <>
          <div className="fg2">
            <label className="campo">Código<input className="ctl" value={f.codigo} onChange={muda('codigo')} /></label>
            <label className="campo">Responsável<input className="ctl" value={f.responsavel} onChange={muda('responsavel')} placeholder="Quem acompanha" /></label>
          </div>
          <label className="campo">Risco *<textarea className="ctl" rows={2} value={f.descricao} onChange={muda('descricao')} placeholder="O que pode dar errado" /></label>
          <label className="campo">Impacto no projeto<textarea className="ctl" rows={2} value={f.impactoProjeto} onChange={muda('impactoProjeto')} placeholder="O que acontece se ocorrer" /></label>
        </>
      ) : r.impactoProjeto && <div><div className="sub">Impacto no projeto</div><div style={{ fontSize: 14, marginTop: 2 }}>{r.impactoProjeto}</div></div>}
      <div className="fg2">
        <label className="campo">Probabilidade
          <select className="ctl" value={f.probabilidade} onChange={e => setF(s => ({ ...s, probabilidade: e.target.value as Nivel }))}>{NIVEIS.map(n => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="campo">Impacto
          <select className="ctl" value={f.impacto} onChange={e => setF(s => ({ ...s, impacto: e.target.value as Nivel }))}>{NIVEIS.map(n => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="campo">Situação
          <select className="ctl" value={f.situacao} onChange={e => setF(s => ({ ...s, situacao: e.target.value as SituacaoRisco }))}>{SITUACOES_RISCO.map(n => <option key={n}>{n}</option>)}</select>
        </label>
        {!novo && <label className="campo">Responsável<input className="ctl" value={f.responsavel} onChange={muda('responsavel')} /></label>}
      </div>
      <label className="campo">Mitigação / ação preventiva<textarea className="ctl" value={f.mitigacao} onChange={muda('mitigacao')} /></label>
      {novo
        ? <label className="campo">Plano de contingência<textarea className="ctl" rows={2} value={f.contingencia} onChange={muda('contingencia')} placeholder="O que fazer se o risco acontecer" /></label>
        : r.contingencia && <div><div className="sub">Plano de contingência</div><div style={{ fontSize: 14, marginTop: 2 }}>{r.contingencia}</div></div>}
    </Drawer>
  );
}
