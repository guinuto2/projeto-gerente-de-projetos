import { useState } from 'react';
import type { Nivel, Projeto, SituacaoRisco } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { NIVEIS, SITUACOES_RISCO } from '../../../lib/constantes';
import { Drawer } from '../../ui/Drawer';

export function EditarRisco({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo: string; aoFechar: () => void }) {
  const { dados, salvarRisco } = usePortal();
  const toast = useToast();
  const r = (dados.riscos[projeto.codigo] || []).find(x => x.codigo === codigo)!;
  const [f, setF] = useState({ probabilidade: r.probabilidade, impacto: r.impacto, situacao: r.situacao, responsavel: r.responsavel, mitigacao: r.mitigacao });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async () => {
    setSalvando(true); setErro('');
    try {
      await salvarRisco(projeto.codigo, codigo, { ...f, responsavel: f.responsavel.trim(), mitigacao: f.mitigacao.trim() });
      toast('Alteração salva.');
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto titulo={`${r.codigo} · ${r.descricao}`} subtitulo={`${projeto.codigo} · ${r.cenarios ? 'Cenários ' + r.cenarios : 'Risco geral'}`}
      salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar}>
      {r.impactoProjeto && <div><div className="sub">Impacto no projeto</div><div style={{ fontSize: 14, marginTop: 2 }}>{r.impactoProjeto}</div></div>}
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
        <label className="campo">Responsável<input className="ctl" value={f.responsavel} onChange={e => setF(s => ({ ...s, responsavel: e.target.value }))} /></label>
      </div>
      <label className="campo">Mitigação / ação preventiva
        <textarea className="ctl" value={f.mitigacao} onChange={e => setF(s => ({ ...s, mitigacao: e.target.value }))} />
      </label>
      {r.contingencia && <div><div className="sub">Plano de contingência</div><div style={{ fontSize: 14, marginTop: 2 }}>{r.contingencia}</div></div>}
    </Drawer>
  );
}
