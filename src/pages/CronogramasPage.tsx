import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Fase, Projeto } from '../types/models';
import { usePortal } from '../state/PortalContext';
import { useProjetosVisiveis } from '../state/useProjetosVisiveis';
import { avanco, faseAtual, macro } from '../lib/calculos';
import { FASES, SELO_FAROL } from '../lib/constantes';
import { TEMA } from '../lib/tema';
import { dm, dma } from '../lib/datas';
import { Chips } from '../components/ui/Chips';
import { Vazio } from '../components/ui/Vazio';
import { Gantt } from '../components/projeto/abas/Gantt';

type FiltroFase = 'Todas' | Fase;

/** Cronograma de todos os projetos em andamento, no mesmo molde do cronograma de cada projeto. */
export function CronogramasPage() {
  const { dados, hoje } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const navegar = useNavigate();
  const emAndamento = projetos.filter(p => p.situacaoCadastro === 'Ativo' && (dados.atividades[p.codigo] || []).some(a => a.inicio && a.termino));
  const [codigo, setCodigo] = useState('');            // '' = todos os projetos
  const [fase, setFase] = useState<FiltroFase>('Todas');
  const visiveis = codigo ? emAndamento.filter(p => p.codigo === codigo) : emAndamento;

  // quantas atividades (principais) cada fase tem nos projetos filtrados
  const contagem = (f: FiltroFase) => visiveis.reduce((s, p) => s + macro(dados, p.codigo).filter(a => f === 'Todas' || a.fase === f).length, 0);
  const filtro = (a: { fase: Fase }) => fase === 'Todas' || a.fase === fase;

  // eixo de datas comum, calculado só com o que está à mostra
  const periodo = useMemo(() => {
    const datas = visiveis.flatMap(p => (dados.atividades[p.codigo] || []).filter(a => !a.pai && filtro(a)))
      .flatMap(a => [a.inicio, a.termino, a.baselineInicio, a.baselineTermino]).filter(Boolean).sort();
    return datas.length ? { ini: datas[0], fim: datas[datas.length - 1] } : null;
  }, [visiveis, dados, fase]); // eslint-disable-line react-hooks/exhaustive-deps

  const cabecalho = (p: Projeto) => {
    const [fundo, texto] = SELO_FAROL[p.farol] || SELO_FAROL.Verde;
    return (
      <div className="cronCab">
        <div style={{ minWidth: 0 }}>
          <div className="pcod">{p.codigo} · {p.cliente.split(' · ')[0]}</div>
          <Link className="cronNome" to={`/projeto/${encodeURIComponent(p.codigo)}/cronograma`}>{p.nome}</Link>
        </div>
        <div className="cronInfo">
          <span className="sf" style={{ background: fundo, color: texto }}>{p.farol}</span>
          <span><span className="sub">Fase</span> <b>{faseAtual(dados, p)}</b></span>
          <span><span className="sub">Avanço</span> <b className="mono">{avanco(dados, p.codigo)}%</b></span>
          <span><span className="sub">Término</span> <b className="mono">{dma(p.terminoPrevisto || p.terminoBaseline)}</b></span>
          <Link className="btn pq" to={`/projeto/${encodeURIComponent(p.codigo)}/cronograma`}>Abrir projeto</Link>
        </div>
      </div>
    );
  };

  return (
    <main className="main">
      <div>
        <div className="migalha"><Link to="/">Escritório de Projetos</Link> › Cronogramas</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Cronogramas dos projetos em andamento</h1>
      </div>

      <section className="card pad cronFiltros">
        <label className="campo" style={{ minWidth: 280 }}>Projeto
          <select className="ctl" value={codigo} onChange={e => { setCodigo(e.target.value); setFase('Todas'); }}>
            <option value="">Todos os projetos em andamento ({emAndamento.length})</option>
            {emAndamento.map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} · {p.nome}</option>)}
          </select>
        </label>
        <div className="campo">Fase{codigo ? ` do ${codigo}` : ''}
          <Chips rotulo="Filtrar por fase" opcoes={['Todas', ...FASES] as FiltroFase[]} valor={fase} aoMudar={setFase}
            formatar={f => `${f} (${contagem(f)})`} />
        </div>
        <div className="legenda" style={{ marginLeft: 'auto' }}>
          {([['Concluído', TEMA.concluido, 8], ['Em curso', TEMA.emCurso, 8], ['Atrasado', TEMA.atrasado, 8], ['Baseline', TEMA.baseline, 3]] as [string, string, number][])
            .map(([t, c, h]) => <span key={t}><i className="pt" style={{ background: c, width: 18, height: h }} />{t}</span>)}
          <span><i style={{ width: 2, height: 14, background: TEMA.vinho, display: 'inline-block' }} />Hoje ({dm(hoje)})</span>
        </div>
      </section>

      {!emAndamento.length && <Vazio>Nenhum projeto em andamento com cronograma.</Vazio>}
      {periodo && visiveis.map(p => {
        const atividades = dados.atividades[p.codigo] || [];
        const temNaFase = macro(dados, p.codigo).some(filtro);
        return (
          <section key={p.codigo} className="card cronBloco">
            {cabecalho(p)}
            {temNaFase
              ? <Gantt projeto={p} atividades={atividades} filtro={filtro} periodo={periodo}
                  aoAbrir={() => navegar(`/projeto/${encodeURIComponent(p.codigo)}/cronograma`)} />
              : <p className="sub" style={{ padding: '4px 4px 8px' }}>Sem atividades na fase {fase}.</p>}
          </section>
        );
      })}
    </main>
  );
}
