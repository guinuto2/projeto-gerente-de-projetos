import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExcluirProjeto } from './ExcluirProjeto';
import { StatusReport } from './StatusReport';
import { SalvarModelo } from './SalvarModelo';
import type { Projeto } from '../../types/models';
import { usePapel } from '../../state/PapelContext';
import { usePortal } from '../../state/PortalContext';
import { desvio } from '../../lib/calculos';
import { SELO_FAROL, REGRA_FATURAMENTO } from '../../lib/constantes';
import { dma } from '../../lib/datas';

export function CabecalhoProjeto({ projeto: p }: { projeto: Projeto }) {
  const { pode, papel } = usePapel();
  const { dados } = usePortal();
  const [statusReport, setStatusReport] = useState(false);
  const [salvandoModelo, setSalvandoModelo] = useState(false);
  const podeSalvarModelo = pode('gerenciarAtividades') && (dados.atividades[p.codigo] || []).some(a => a.inicio && a.termino);
  const [excluir, setExcluir] = useState(false);
  const [fundo, texto] = SELO_FAROL[p.farol] || SELO_FAROL.Verde;
  const dv = desvio(p);
  const ficha: [string, string][] = [
    ['Cliente', p.cliente], ['Gerente de projeto', p.gerente], ['Arquiteto', p.arquiteto],
    ['Assinatura do contrato', p.dataAssinatura ? dma(p.dataAssinatura) : '—'], ['Início', dma(p.inicio)]
  ];
  const regra = p.modeloFaturamento ? REGRA_FATURAMENTO[p.modeloFaturamento] : '';
  return (
    <section className="card cab">
      <div className="cabTxt">
        <div className="tags">
          <span className="tg" style={{ fontWeight: 600 }}>{p.tipo}</span>
          {p.modeloFaturamento && papel !== 'Cliente' && <span className="tg" title="Modelo de faturamento">{p.modeloFaturamento}</span>}
          {p.parceiro && papel !== 'Cliente' && <span className="tg tagParceiro" title={`Terceirizado: ${p.parceiro}`}>Terceirizado</span>}
          <span className="sf" style={{ background: fundo, color: texto }}>Farol {p.farol.toLowerCase()}</span>
          <span className="tg">{p.situacaoCadastro}</span>
        </div>
        <h1 className="ptit">{p.codigo} · {p.nome}</h1>
        {p.objetivo && <p className="pdesc">{p.objetivo}</p>}
        {(pode('editarProjeto') || pode('excluirProjeto') || papel === 'Patrocinador' || podeSalvarModelo) && (
          <div className="cabAcoes">
            {pode('editarProjeto') && <Link className="btn pq" to={`/editar/${encodeURIComponent(p.codigo)}`}>Editar projeto</Link>}
            {pode('excluirProjeto') && <button type="button" className="btn pq perigo" onClick={() => setExcluir(true)}>Excluir projeto</button>}
            {(papel === 'PMO' || papel === 'Patrocinador') && p.situacaoCadastro !== 'Rascunho' && <button type="button" className="btn pq" onClick={() => setStatusReport(true)}>Status report</button>}
            {podeSalvarModelo && <button type="button" className="btn pq" onClick={() => setSalvandoModelo(true)} title="Guardar este cronograma para usar em novos projetos">Salvar modelo</button>}
          </div>
        )}
        {excluir && <ExcluirProjeto projeto={p} aoFechar={() => setExcluir(false)} />}
      </div>
      <div className="ficha">
        {ficha.map(([k, v]) => <div key={k}><div className="r">{k}</div><div className="v">{v || '—'}</div></div>)}
        <div>
          <div className="r">Término</div>
          <div className="v">{dma(p.terminoPrevisto || p.terminoBaseline)}{dv > 0 && <> <small>+{dv} dias úteis</small></>}</div>
        </div>
        {papel !== 'Cliente' && <>
        <div className="fichaRegra"><div className="r">Modelo de faturamento</div><div className="v modeloFat">{p.modeloFaturamento || '— não definido —'}</div></div>
        {regra && <div className="fichaRegra"><div className="r">Regra</div><div className="v">{regra}</div></div>}
        {p.parceiro && <div className="fichaRegra"><div className="r">Parceiro (terceirização)</div><div className="v modeloFat">{p.parceiro}</div></div>}
        </>}
      </div>
      {statusReport && <StatusReport projeto={p} aoFechar={() => setStatusReport(false)} />}
      {salvandoModelo && <SalvarModelo projeto={p} aoFechar={() => setSalvandoModelo(false)} />}
    </section>
  );
}
