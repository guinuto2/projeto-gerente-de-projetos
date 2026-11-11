import { useMemo, useState } from 'react';
import type React from 'react';
import type { Atividade, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { estadoFase, macro } from '../../../lib/calculos';
import { classeEquipe, FASES, SELO_STATUS } from '../../../lib/constantes';
import { dia, dm, dma, iso } from '../../../lib/datas';
import { diasCorridos, marcasCronograma } from '../../../lib/escalaCronograma';
import { Selo } from '../../ui/Selo';
import { TEMA } from '../../../lib/tema';
import { DicaAtividade } from './DicaAtividade';
import { aguardando, situacaoPrazo } from '../../../lib/dependencias';

interface Props {
  /** subatividades abertas por atividade principal (controlado pela aba) */
  abertos?: Record<string, boolean>;
  aoAlternar?: (f: (s: Record<string, boolean>) => Record<string, boolean>) => void;
  projeto: Projeto;
  atividades: Atividade[];
  filtro: (a: Atividade) => boolean;
  aoAbrir: (codigo: string) => void;
  /** período fixo do eixo de datas (usado na página de todos os cronogramas, para alinhar os projetos) */
  periodo?: { ini: string; fim: string };
  /** lista simples (sem fases): mostra só estas atividades/tarefas, em ordem de data (cronograma do técnico) */
  plano?: Atividade[];
  /** e-mail de quem está vendo: as tarefas dele ganham o selo "minha" */
  minhas?: string;
}

/** Cronograma em barras: previsto (preenchido pelo %), baseline (linha cinza), marcos e hoje. */
export function Gantt(props: Props) {
  const { projeto, atividades, filtro, aoAbrir } = props;
  const { dados, hoje } = usePortal();
  const [abertosLocal, setAbertosLocal] = useState<Record<string, boolean>>({});
  const abertos = props.abertos || abertosLocal;
  const setAbertos = props.aoAlternar || setAbertosLocal;
  /** atividade sob o mouse (ou com foco do teclado) e onde mostrar a janela */
  const [dica, setDica] = useState<{ a: Atividade; x: number; y: number } | null>(null);
  const eventosDica = (a: Atividade) => ({
    onMouseEnter: (e: React.MouseEvent) => setDica({ a, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: React.MouseEvent) => setDica({ a, x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setDica(null),
  });

  const periodo = props.periodo;
  const escala = useMemo(() => {
    const datas = periodo ? [periodo.ini, periodo.fim] : atividades.flatMap(a => [a.inicio, a.termino, a.baselineInicio, a.baselineTermino]).filter(Boolean).sort();
    const ini = dia(datas[0])!, fim = dia(datas[datas.length - 1])!;
    ini.setDate(ini.getDate() - ((ini.getDay() + 6) % 7));
    fim.setDate(fim.getDate() + 3);
    const inicio = iso(ini), termino = iso(fim);
    const total = Math.max(1, diasCorridos(inicio, termino));
    return { ini: inicio, fim: termino, total, marcas: marcasCronograma(inicio, termino) };
  }, [atividades, periodo]);

  const pos = (s: string) => diasCorridos(escala.ini, s) / escala.total * 100;
  const larg = (a: string, b: string) => Math.max(0.6, (diasCorridos(a, b) + 1) / escala.total * 100);
  // atrasada: passou da data prevista sem concluir (a barra inteira fica avermelhada, mesmo com 0% feito)
  const atrasada = (a: Atividade) => a.status !== 'Concluído' && a.status !== 'Cancelado' && !!a.termino && a.termino < hoje;
  const corBarra = (a: Atividade) => a.status === 'Concluído' ? TEMA.concluido : (a.status === 'Bloqueado' || a.termino < hoje) ? TEMA.atrasado : TEMA.emCurso;

  const grade = (
    <>
      {escala.marcas.map(m => <div key={m.data} className="gsem" style={{ left: `${pos(m.data)}%` }} />)}
      {hoje >= escala.ini && hoje <= escala.fim && <div className="ghoje" style={{ left: `${pos(hoje)}%` }} title="Hoje" />}
    </>
  );

  const barra = (a: Atividade) => {
    if (!a.inicio || !a.termino) return null;
    const mudouBaseline = a.baselineInicio && (a.baselineInicio !== a.inicio || a.baselineTermino !== a.termino);
    return (
      <>
        {mudouBaseline && <div className="gbase" style={{ left: `${pos(a.baselineInicio)}%`, width: `${larg(a.baselineInicio, a.baselineTermino)}%` }} title={`Baseline ${dm(a.baselineInicio)}–${dm(a.baselineTermino)}`} />}
        <div className="gbar" {...eventosDica(a)} style={{ left: `${pos(a.inicio)}%`, width: `${larg(a.inicio, a.termino)}%`, background: atrasada(a) ? TEMA.atrasadoFundo : a.status === 'Em andamento' ? TEMA.emCursoFundo : a.status === 'Concluído' ? TEMA.concluido : TEMA.barraFundo }}>
          <i style={{ width: `${a.percentual}%`, background: corBarra(a) }} />
        </div>
        {a.marco && <div className="gmarco" {...eventosDica(a)} style={{ left: `calc(${pos(a.termino) + larg(a.termino, a.termino)}% - 7px)`, background: a.status === 'Concluído' ? TEMA.concluido : TEMA.vinho }} />}
      </>
    );
  };

  return (
    <div className="gwrap">
      <div className="gantt">
        <div className="grow ghead">
          <div className="gcel">{props.plano ? <span className="gnome">Tarefa</span> : <><span className="gcod">Cód.</span><span className="gnome">Atividade</span><span>Equipe</span></>}</div>
          <div className="gtl">{escala.marcas.map(m => <span key={m.data} className={`gsemL${pos(m.data) > 92 ? ' final' : ''}`} title={dma(m.data)} style={{ left: `${pos(m.data)}%` }}>{m.rotulo}</span>)}</div>
        </div>
        {props.plano && props.plano.map(t => (
          <div key={t.codigo} className={`grow gclick prazo-${situacaoPrazo(t, hoje) || 'ok'}`} role="button" tabIndex={0} onClick={() => aoAbrir(t.codigo)} onKeyDown={e => { if (e.key === 'Enter') aoAbrir(t.codigo); }}>
            <div className="gcel">
              <span className="gnome" title={t.nome}>{t.nome}</span>
              {t.reuniaoUrl && (
                <a className="teams" href={t.reuniaoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  title="Entrar na reunião do Teams">{t.reuniaoTipo || 'Teams'}{t.reuniaoInicio ? ` ${t.reuniaoInicio.slice(8, 10)}/${t.reuniaoInicio.slice(5, 7)} ${t.reuniaoInicio.slice(11, 16)}` : ''}</a>
              )}
              {t.status !== 'Planejado' && <Selo valor={t.status} cores={SELO_STATUS} />}
            </div>
            <div className="gtl">{grade}{barra(t)}</div>
          </div>
        ))}
        {!props.plano && FASES.map(f => {
          const lista = macro(dados, projeto.codigo).filter(a => a.fase === f && filtro(a));
          if (!lista.length) return null;
          return (
            <div key={f}>
              <div className="grow gfase"><div className="gcel">{f} <span className="sub" style={{ fontWeight: 400 }}>· {estadoFase(dados, projeto, f)}</span></div><div className="gtl">{grade}</div></div>
              {lista.map(a => {
                const filhos = atividades.filter(x => x.pai === a.codigo), aberto = !!abertos[a.codigo];
                return (
                  <div key={a.codigo}>
                    <div className="grow gclick" role="button" tabIndex={0} onClick={() => aoAbrir(a.codigo)} onKeyDown={e => { if (e.key === 'Enter') aoAbrir(a.codigo); }}>
                      <div className="gcel">
                        {filhos.length
                          ? <button type="button" className="tog" aria-expanded={aberto} aria-label="Mostrar subatividades"
                              onClick={e => { e.stopPropagation(); setAbertos(s => ({ ...s, [a.codigo]: !s[a.codigo] })); }}>{aberto ? '▾' : '▸'}</button>
                          : <span className="tog" />}
                        <span className="gcod">{a.codigo}</span>
                        <span className="gnome" title={a.nome}>{a.nome}</span>
                      {aguardando(a, atividades) && <span className="tagLock" title={`Aguarda: ${(a.predecessoras || []).join(', ')}`}>aguarda pré-req.</span>}
                        {a.reuniaoUrl && (
                          <a className="teams" href={a.reuniaoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            title={`Entrar na reunião do Teams${a.reuniaoTipo ? ` (${a.reuniaoTipo})` : ''}`}>{a.reuniaoTipo || 'Teams'}{a.reuniaoInicio ? ` ${a.reuniaoInicio.slice(8, 10)}/${a.reuniaoInicio.slice(5, 7)} ${a.reuniaoInicio.slice(11, 16)}` : ''}</a>
                        )}
                        {a.status !== 'Planejado' && <Selo valor={a.status} cores={SELO_STATUS} />}
                        <span className={`geq ${classeEquipe(a.equipe)}`}>{a.equipe}</span>
                      </div>
                      <div className="gtl">{grade}{barra(a)}</div>
                    </div>
                    {aberto && filhos.map(s => (
                      <div key={s.codigo} className="grow gclick" role="button" tabIndex={0} onClick={() => aoAbrir(s.codigo)} onKeyDown={e => { if (e.key === 'Enter') aoAbrir(s.codigo); }}>
                        <div className="gcel" style={{ paddingLeft: 40 }}>
                          <span className="gcod" style={{ fontSize: 11.5 }}>{s.codigo}</span>
                          <span className="gnome sub" style={{ fontSize: 12.5, color: 'var(--medio)' }} title={s.nome}>{s.nome}</span>
                          {s.reuniaoUrl && (
                            <a className="teams" href={s.reuniaoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              title={`Entrar na reunião do Teams${s.reuniaoTipo ? ` (${s.reuniaoTipo})` : ''}`}>{s.reuniaoTipo || 'Teams'}{s.reuniaoInicio ? ` ${s.reuniaoInicio.slice(8, 10)}/${s.reuniaoInicio.slice(5, 7)} ${s.reuniaoInicio.slice(11, 16)}` : ''}</a>
                          )}
                          {s.lancada === false && <span className="tagPrep" title="Ainda não lançada para o técnico">não lançada</span>}
                          {aguardando(s, atividades) && <span className="tagLock" title={`Aguarda: ${(s.predecessoras || []).join(', ')}`}>aguarda pré-req.</span>}
                          {s.status !== 'Planejado' && <Selo valor={s.status} cores={SELO_STATUS} />}
                          <span className={`geq ${classeEquipe(s.equipe)}`}>{s.equipe}</span>
                        </div>
                        <div className="gtl" style={{ opacity: 0.6 }}>{grade}{barra(s)}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {dica && <DicaAtividade a={dica.a} x={dica.x} y={dica.y} />}
    </div>
  );
}
