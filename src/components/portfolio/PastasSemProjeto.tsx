import { useEffect, useState } from 'react';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { Confirmacao } from '../ui/Confirmacao';

/**
 * Patrocinador: pastas da biblioteca "Documentos de Projetos" que não pertencem a nenhum projeto
 * (sobras de projetos excluídos sem a pasta). Podem ir para a lixeira do site.
 */
export function PastasSemProjeto() {
  const { fonte, dados } = usePortal();
  const toast = useToast();
  const [pastas, setPastas] = useState<{ nome: string; url: string }[]>([]);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const codigos = dados.projetos.map(p => p.codigo).join('|');

  useEffect(() => {
    if (!fonte.pastasSemProjeto) return;
    fonte.pastasSemProjeto(codigos.split('|').filter(Boolean)).then(setPastas).catch(() => setPastas([]));
  }, [fonte, codigos]);

  if (!pastas.length) return null;
  const remover = async () => {
    setOcupado(true); setErro('');
    try {
      for (const p of pastas) await fonte.excluirPasta!(p.nome);
      toast(`${pastas.length} pasta(s) enviada(s) para a lixeira do SharePoint.`);
      setPastas([]); setConfirmar(false);
    } catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  };
  return (
    <div className="msg info linha">
      <span>A biblioteca de documentos tem <b>{pastas.length} pasta(s) de projetos que não existem mais</b>: {pastas.map(p => p.nome).join(', ')}.</span>
      <button type="button" className="btn pq" onClick={() => setConfirmar(true)}>Enviar para a lixeira</button>
      {confirmar && (
        <Confirmacao titulo="Mover pastas sem projeto para a lixeira?" rotuloConfirmar="Mover para a lixeira" ocupado={ocupado} erro={erro}
          aoCancelar={() => setConfirmar(false)} aoConfirmar={remover}>
          <ul className="ul" style={{ marginTop: 0 }}>{pastas.map(p => <li key={p.nome}><a href={p.url} target="_blank" rel="noopener noreferrer">{p.nome}</a></li>)}</ul>
          <p className="sub" style={{ fontSize: 14 }}>As pastas e os arquivos dentro delas vão para a lixeira do site e podem ser restaurados por até 93 dias.</p>
        </Confirmacao>
      )}
    </div>
  );
}
