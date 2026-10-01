import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExcluirProjeto } from './ExcluirProjeto';
import type { Projeto } from '../../types/models';
import { usePapel } from '../../state/PapelContext';
import { desvio } from '../../lib/calculos';
import { SELO_FAROL } from '../../lib/constantes';
import { dma } from '../../lib/datas';

export function CabecalhoProjeto({ projeto: p }: { projeto: Projeto }) {
  const { pode } = usePapel();
  const [excluir, setExcluir] = useState(false);
  const [fundo, texto] = SELO_FAROL[p.farol] || SELO_FAROL.Verde;
  const dv = desvio(p);
  const ficha: [string, string][] = [
    ['Cliente', p.cliente], ['Gerente de projeto', p.gerente], ['Arquiteto', p.arquiteto],
    ['Patrocinador', p.patrocinador], ['Início', dma(p.inicio)]
  ];
  return (
    <section className="card cab">
      <div className="cabTxt">
        <div className="tags">
          <span className="tg" style={{ fontWeight: 600 }}>{p.tipo}</span>
          <span className="sf" style={{ background: fundo, color: texto }}>Farol {p.farol.toLowerCase()}</span>
          <span className="tg">{p.situacaoCadastro}</span>
        </div>
        <h1 className="ptit">{p.codigo} · {p.nome}</h1>
        {p.objetivo && <p className="pdesc">{p.objetivo}</p>}
        {(pode('editarProjeto') || pode('excluirProjeto')) && (
          <div className="cabAcoes">
            {pode('editarProjeto') && <Link className="btn pq" to={`/editar/${encodeURIComponent(p.codigo)}`}>Editar projeto</Link>}
            {pode('excluirProjeto') && <button type="button" className="btn pq perigo" onClick={() => setExcluir(true)}>Excluir projeto</button>}
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
      </div>
    </section>
  );
}
