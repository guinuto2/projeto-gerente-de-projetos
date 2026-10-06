import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { pendenciasRascunho } from '../../lib/rascunho';
import { Confirmacao } from '../ui/Confirmacao';

/** Faixa no topo de um projeto em rascunho: completar, enviar/ativar ou excluir. */
export function AvisoRascunho({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje, submeterRascunho, excluirProjeto } = usePortal();
  const toast = useToast();
  const navegar = useNavigate();
  const [acao, setAcao] = useState<null | 'enviar' | 'ativar' | 'excluir'>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const faltam = pendenciasRascunho(dados, p, hoje);
  const ehPatrocinador = false;   // rascunho é só do PMO: ele envia para aprovação
  const g1 = p.fases.find(g => g.gate === 'G1');
  const devolvido = !!g1?.parecer && g1.situacao === 'Pendente';

  const confirmar = async () => {
    setOcupado(true); setErro('');
    try {
      if (acao === 'excluir') {
        await excluirProjeto(p.codigo, { documentos: true });
        toast(`Rascunho ${p.codigo} excluído.`); navegar('/'); return;
      }
      await submeterRascunho(p.codigo, acao === 'ativar' ? 'ativar' : 'aprovacao');
      toast(acao === 'ativar' ? 'Projeto ativado: entrou no portfólio com o G1 aprovado.' : 'Projeto enviado para aprovação do patrocinador.');
      setAcao(null); setOcupado(false);
    } catch (e) { setErro((e as Error).message); setOcupado(false); }
  };

  return (
    <div className="msg info" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="linha">
        <span><b>Rascunho.</b> Este projeto ainda não está no portfólio.{faltam.length ? ' Complete os dados para poder enviar.' : ' Os dados estão completos.'}</span>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn pq" to={`/editar/${encodeURIComponent(p.codigo)}`}>Editar dados</Link>
          <button type="button" className="btn pq pri" disabled={faltam.length > 0} title={faltam.length ? 'Complete os itens pendentes' : undefined}
            onClick={() => setAcao(ehPatrocinador ? 'ativar' : 'enviar')}>{ehPatrocinador ? 'Ativar projeto' : 'Enviar para aprovação'}</button>
          <button type="button" className="btn pq perigo" onClick={() => setAcao('excluir')}>Excluir rascunho</button>
        </span>
      </div>
      {devolvido && <div style={{ fontSize: 13 }}><b>Devolvido pelo patrocinador:</b> {g1!.parecer}. Ajuste e envie de novo.</div>}
      {faltam.length > 0 && <div style={{ fontSize: 13 }}>Falta: {faltam.join(' · ')}. O cronograma é completado na aba Cronograma, abaixo.</div>}
      {acao && (
        <Confirmacao ocupado={ocupado} erro={erro} aoCancelar={() => setAcao(null)} aoConfirmar={confirmar}
          titulo={acao === 'excluir' ? `Excluir o rascunho ${p.codigo}?` : acao === 'ativar' ? `Ativar o projeto ${p.codigo}?` : `Enviar ${p.codigo} para aprovação?`}
          rotuloConfirmar={acao === 'excluir' ? 'Excluir rascunho' : acao === 'ativar' ? 'Ativar projeto' : 'Enviar para aprovação'}>
          <p className="sub" style={{ fontSize: 14 }}>
            {acao === 'excluir' ? 'O rascunho, o cronograma, os riscos e a pasta de documentos (lixeira do SharePoint) serão removidos.'
              : acao === 'ativar' ? 'O projeto entra ativo no portfólio, com o G1 aprovado por você, na fase de Planejamento.'
              : 'O patrocinador recebe o pedido de aprovação. Depois de aprovado, o projeto entra no portfólio.'}
          </p>
        </Confirmacao>
      )}
    </div>
  );
}
