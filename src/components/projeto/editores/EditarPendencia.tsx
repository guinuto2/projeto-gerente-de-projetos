import { useState } from 'react';
import type { Pendencia, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { Drawer } from '../../ui/Drawer';

export function EditarPendencia({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo: string; aoFechar: () => void }) {
  const { dados, salvarPendencia } = usePortal();
  const toast = useToast();
  const p = (dados.pendencias[projeto.codigo] || []).find(x => x.codigo === codigo)!;
  const [situacao, setSituacao] = useState<Pendencia['situacao']>(p.situacao);
  const [resposta, setResposta] = useState(p.resposta || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async () => {
    setSalvando(true); setErro('');
    try {
      await salvarPendencia(projeto.codigo, codigo, { situacao, resposta: resposta.trim() });
      toast('Alteração salva.');
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto titulo={`${p.codigo} · ${p.pergunta}`} subtitulo={`${projeto.codigo} · Pendência / questionamento ao cliente`}
      salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar}>
      <div><div className="sub">Detalhamento</div><div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>{p.detalhe}</div></div>
      <div><div className="sub">Impacto</div><div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>{p.impacto}</div></div>
      <label className="campo">Situação
        <select className="ctl" value={situacao} onChange={e => setSituacao(e.target.value as Pendencia['situacao'])}>
          <option>Aberta</option><option>Respondida</option>
        </select>
      </label>
      <label className="campo">Resposta do cliente<textarea className="ctl" value={resposta} onChange={e => setResposta(e.target.value)} /></label>
    </Drawer>
  );
}
