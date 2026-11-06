import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Atividade, StatusAtividade } from '../types/models';
import { usePortal, useBloqueioSincronizacao } from '../state/PortalContext';
import { usePapel } from '../state/PapelContext';
import { useToast } from '../state/ToastContext';
import { useProjetosVisiveis } from '../state/useProjetosVisiveis';
import { atividadesDaSemana, vencida, type ItemSemana } from '../lib/semana';
import { percentualPrincipal } from '../lib/calculos';
import { aguardando, lancadaParaTecnico, pendentes, situacaoPrazo } from '../lib/dependencias';
import { avisoFimDeSemana, avisoHorasRealizadas } from '../lib/validacoes';
import { CAUSAS_ATRASO, STATUS_ATUALIZACAO } from '../lib/constantes';
import { dm, dma } from '../lib/datas';
import { Mensagem } from '../components/ui/Mensagem';
import { NovaSubatividade } from '../components/atualizacao/NovaSubatividade';
import { EditarAtividade } from '../components/projeto/editores/EditarAtividade';
import { DocumentosAtividade } from '../components/atualizacao/DocumentosAtividade';
import { VisaoAtividade } from '../components/projeto/editores/VisaoAtividade';
import { AcompanhamentoAtividade } from '../components/projeto/AcompanhamentoAtividade';

interface Form {
  status: StatusAtividade; percentual: string; termino: string; dataReal: string;
  dependeRdm: boolean; numeroRdm: string; impedimento: boolean; causaAtraso: string; horas: string; observacao: string;
  teveReuniao: '' | 'Sim' | 'Não'; realizado: string;
}
const paraForm = (a: Atividade): Form => ({
  status: a.status, percentual: String(a.percentual), termino: a.termino, dataReal: a.dataReal || '',
  dependeRdm: !!a.dependeRdm, numeroRdm: a.numeroRdm || '', impedimento: !!a.impedimento, causaAtraso: a.causaAtraso || '',
  horas: a.horasRealizadas === undefined ? '' : String(a.horasRealizadas), observacao: a.observacao || '',
  teveReuniao: a.teveReuniao === undefined ? (a.reuniaoUrl ? 'Sim' : '') : a.teveReuniao ? 'Sim' : 'Não', realizado: a.realizado || ''
});
const chave = (i: ItemSemana) => `${i.projeto.codigo}|${i.atividade.codigo}`;
/** a pessoa mudou a data prevista para depois da baseline */
const reprograma = (a: Atividade, f: Form) => !!a.baselineTermino && f.termino !== a.termino && f.termino > a.baselineTermino;

/** Atualização semanal: lista das atividades da semana à esquerda, formulário à direita. */
export function AtualizacaoPage() {
  const { dados, hoje, atualizarSemanal } = usePortal();
  const { projetos } = useProjetosVisiveis();
  const { pode, papel } = usePapel();
  const toast = useToast();
  useBloqueioSincronizacao('atualizacao-semanal', true);

  const todos = useMemo(() => atividadesDaSemana(dados, projetos.filter(p => p.situacaoCadastro === 'Ativo'), hoje), [dados, projetos, hoje]);
  // todas as atividades da semana dos projetos que a pessoa vê (o PMO vê todos os projetos)
  const { projetos: todosVisiveis, identidade } = useProjetosVisiveis();
  // só projetos em andamento: encerrados (e em aprovação) ficam de fora do Atualizar status
  const visiveis = useMemo(() => todosVisiveis.filter(p => p.situacaoCadastro === 'Ativo'), [todosVisiveis]);
  const meuEmail = (identidade.email || '').toLowerCase();
  const minhasSubs: ItemSemana[] = useMemo(() => visiveis.flatMap(p => (dados.atividades[p.codigo] || [])
    .filter(a => a.pai && a.responsavel && a.responsavel.toLowerCase() === (meuEmail || p.equipe.find(m => m.nome === identidade.nome)?.email?.toLowerCase() || '#')
      && a.status !== 'Concluído' && a.status !== 'Cancelado' && (papel !== 'Técnico' || lancadaParaTecnico(a)))
    .map(a => ({ projeto: p, atividade: a }))), [visiveis, dados, meuEmail, identidade.nome, papel]);
  // todas as atividades da semana + as subatividades em que a pessoa é responsável (mesmo fora da semana)
  const ehTecnico = papel === 'Técnico';
  // técnico: só subatividades abertas dos projetos em que está (as dele primeiro, depois atrasadas, depois por data)
  const subsDosMeusProjetos: ItemSemana[] = useMemo(() => {
    const minhas = new Set(minhasSubs.map(s => `${s.projeto.codigo}|${s.atividade.codigo}`));
    return visiveis.flatMap(p => (dados.atividades[p.codigo] || [])
      .filter(a => a.pai && a.status !== 'Concluído' && a.status !== 'Cancelado' && lancadaParaTecnico(a))
      .map(a => ({ projeto: p, atividade: a })))
      .sort((x, y) => Number(vencida(y.atividade, hoje)) - Number(vencida(x.atividade, hoje)) ||
        (x.atividade.termino || '9999').localeCompare(y.atividade.termino || '9999') ||
        Number(minhas.has(`${y.projeto.codigo}|${y.atividade.codigo}`)) - Number(minhas.has(`${x.projeto.codigo}|${x.atividade.codigo}`)));
  }, [visiveis, dados, minhasSubs, hoje]);
  const [projetoFiltro, setProjetoFiltro] = useState('');
  /** atividade aberta a partir do cronograma que não está entre as da semana: fica fixada no topo da lista */
  const [fixa, setFixa] = useState<string | null>(null);
  /** PMO: painel completo da atividade (nome, fase, datas, pré-requisito, reunião, lançar tarefas) */
  const [editarAtv, setEditarAtv] = useState<string | null>(null);
  const base = ehTecnico ? subsDosMeusProjetos
    : [...todos, ...minhasSubs.filter(s => !todos.some(t => t.projeto.codigo === s.projeto.codigo && t.atividade.codigo === s.atividade.codigo))];
  const itemFixo: ItemSemana | null = (() => {
    if (!fixa) return null;
    const [cod, codigo] = fixa.split('|');
    const p = visiveis.find(x => x.codigo === cod), a = (dados.atividades[cod] || []).find(x => x.codigo === codigo);
    return p && a && !base.some(i => chave(i) === fixa) ? { projeto: p, atividade: a } : null;
  })();
  const lista = [...(itemFixo ? [itemFixo] : []), ...base].filter(i => !projetoFiltro || i.projeto.codigo === projetoFiltro);
  /** técnico: nova subatividade escolhendo projeto e atividade principal (no topo da lista) */
  const [novaSubLivre, setNovaSubLivre] = useState(false);
  /** lista paginada: 5 por página */
  const POR_PAGINA = 5;
  const [pagina, setPagina] = useState(0);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas - 1);
  const visiveisNaPagina = lista.slice(paginaAtual * POR_PAGINA, paginaAtual * POR_PAGINA + POR_PAGINA);
  // vindo do painel da tarefa (?item=PROJETO|código): seleciona a tarefa e vai para a página dela
  const [params, setParams] = useSearchParams();
  const pedido = params.get('item');
  useEffect(() => {
    if (!pedido) return;
    const idx = lista.findIndex(i => chave(i) === pedido);
    if (idx < 0 && projetoFiltro) { setProjetoFiltro(''); return; }   // pode estar escondida pelo filtro
    if (idx >= 0) { setSel(pedido); setPagina(Math.floor(idx / POR_PAGINA)); }
    else { setFixa(pedido); setSel(pedido); setPagina(0); }   // fora da semana: aparece fixada no topo
    setParams({}, { replace: true });
  }, [pedido, lista.length, projetoFiltro]); // eslint-disable-line react-hooks/exhaustive-deps
  const irPagina = (k: number) => { setPagina(k); const primeiro = lista[k * POR_PAGINA]; if (primeiro) setSel(chave(primeiro)); };
  /** a subatividade abre só para leitura; "Atualizar status" libera o formulário */
  const [editando, setEditando] = useState(false);
  const [novaSub, setNovaSub] = useState(false);

  const [sel, setSel] = useState<string>(lista[0] ? chave(lista[0]) : '');
  const item = lista.find(i => chave(i) === sel) || lista[0];
  const [f, setF] = useState<Form | null>(item ? paraForm(item.atividade) : null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { setNovaSub(false); setEditando(false); if (item) { setF(paraForm(item.atividade)); setErro(''); } else setF(null); }, [item ? chave(item) : '']); // eslint-disable-line react-hooks/exhaustive-deps

  const muda = <K extends keyof Form>(k: K, v: Form[K]) => setF(s => (s ? { ...s, [k]: v } : s));

  const salvar = async () => {
    if (!item || !f) return;
    const a = item.atividade;
    const pct = Number(f.percentual);
    const br = (s: string) => s.split('-').reverse().join('/');
    if (a.pai && (f.percentual === '' || isNaN(pct) || pct < 0 || pct > 100)) { setErro('Informe o % concluído entre 0 e 100.'); return; }
    if (!f.termino) { setErro('Informe a nova data prevista.'); return; }
    if (f.termino !== a.termino && f.termino < hoje) { setErro(`A nova data prevista não pode ser antes de hoje (${br(hoje)}).`); return; }
    if (f.status === 'Concluído' && !f.dataReal) { setErro('Informe a data real de conclusão.'); return; }
    if (f.dataReal && f.dataReal > hoje) { setErro('A data real não pode ser no futuro.'); return; }
    if (f.dependeRdm && !f.numeroRdm.trim()) { setErro('Informe o número da RDM.'); return; }
    if (reprograma(a, f) && !f.causaAtraso) { setErro('A nova data passa da baseline: informe a causa do atraso.'); return; }
    setSalvando(true); setErro('');
    try {
      const enviado = await atualizarSemanal(item.projeto.codigo, a.codigo, {
        status: f.status, percentual: f.status === 'Concluído' ? 100 : pct, termino: f.termino, dataReal: f.dataReal,
        dependeRdm: f.dependeRdm, numeroRdm: f.dependeRdm ? f.numeroRdm.trim() : '', impedimento: f.impedimento,
        causaAtraso: f.causaAtraso, horasRealizadas: f.horas === '' ? undefined : Number(f.horas), observacao: f.observacao.trim(),
        teveReuniao: f.teveReuniao === '' ? undefined : f.teveReuniao === 'Sim', realizado: f.realizado.trim()
      });
      toast(enviado ? `Atualização salva. Reprogramação avisada a ${enviado}.` : 'Atualização salva.');
      setEditando(false);
    } catch (e) { setErro((e as Error).message); }
    finally { setSalvando(false); }
  };

  const rotulo = (a: Atividade): [string, string] =>
    a.status === 'Bloqueado' || a.impedimento ? ['Bloqueado', '#9A2E12'] : vencida(a, hoje) ? ['Data prevista vencida', '#7A5200'] : [a.status, '#575A5F'];
  const nota = (a: Atividade) => (a.status === 'Bloqueado' || a.impedimento) && a.observacao ? a.observacao
    : `Prevista ${dm(a.termino)} · ${a.dependeRdm && a.status === 'Planejado' ? 'depende de RDM' : a.percentual > 0 ? `${a.percentual}%` : a.status}`;

  if (!pode('atualizarAtividade')) return <main className="main"><Mensagem tipo="info">Seu perfil não atualiza atividades.</Mensagem></main>;
  // criar tarefa/subatividade só com algum projeto em andamento (ativo) — a página abre do mesmo jeito
  const temProjetoAtivo = visiveis.some(p => p.situacaoCadastro === 'Ativo');
  const motivoSemProjeto = `Nenhum projeto em andamento${ehTecnico ? ' em que você está na equipe' : ''}: dá para criar tarefas quando houver um projeto ativo.`;

  return (
    <main className="main">
      <div>
        <div className="migalha"><Link to="/">Central Systech</Link> › Atualizar status</div>
        <div className="linha" style={{ marginTop: 8, alignItems: 'center' }}>
          <h1 className="ptit">Atualizar status</h1>
          {ehTecnico && pode('criarSubatividade') && <button type="button" className="btn pri" disabled={!temProjetoAtivo} title={temProjetoAtivo ? undefined : motivoSemProjeto} onClick={() => setNovaSubLivre(true)}>+ Nova tarefa</button>}
        </div>
      </div>
      <div className="cols">
        <aside className="card pad atvLista">
          <h2 className="h3" style={{ marginBottom: 2 }}>{ehTecnico ? 'Tarefas' : 'Atividades desta semana'} <span className="cnt">{lista.length}</span></h2>
          <div className="sub" style={{ marginBottom: 10 }}>{ehTecnico ? 'Dos projetos em que estou alocado' : 'Todos os projetos em andamento'}</div>
          {visiveis.length > 1 && (
            <label className="campo" style={{ marginBottom: 10 }}>Projeto
              <select className="ctl" value={projetoFiltro} onChange={e => { setProjetoFiltro(e.target.value); setPagina(0); }}>
                <option value="">Todos os projetos</option>
                {visiveis.map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} · {p.nome}</option>)}
              </select>
            </label>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {visiveisNaPagina.map(i => {
              const [txt, cor] = rotulo(i.atividade), on = item && chave(i) === chave(item);
              if (ehTecnico) {
                const atrasada = vencida(i.atividade, hoje);
                return (
                  <button key={chave(i)} type="button" className={`atvCard ${on ? 'on' : ''} prazo-${situacaoPrazo(i.atividade, hoje) || 'ok'}`} aria-pressed={!!on} onClick={() => setSel(chave(i))}>
                    <div className="atvNome">{i.atividade.nome} {aguardando(i.atividade, dados.atividades[i.projeto.codigo] || []) && <span className="tagLock">aguarda pré-req.</span>}</div>
                    <div className="atvNota">{i.projeto.codigo} · <span style={atrasada ? { color: 'var(--txt-erro)', fontWeight: 700 } : situacaoPrazo(i.atividade, hoje) === 'perto' ? { color: '#8A5A00', fontWeight: 700 } : undefined}>prevista {dm(i.atividade.termino)}{atrasada ? ' (atrasada)' : situacaoPrazo(i.atividade, hoje) === 'perto' ? ' (perto do prazo)' : ''}</span></div>
                  </button>
                );
              }
              return (
                <button key={chave(i)} type="button" className={`atvCard ${on ? 'on' : ''}`} aria-pressed={!!on} onClick={() => setSel(chave(i))}>
                  <div className="atvSt" style={{ color: cor }}>{txt}{fixa && chave(i) === fixa && itemFixo && <span className="tagFixa">aberta pelo cronograma</span>}</div>
                  <div className="atvNome">{i.projeto.codigo} · {i.atividade.pai && <span className="subMarca">sub</span>}{i.atividade.codigo} {i.atividade.nome}</div>
                  <div className="atvNota">{nota(i.atividade)}</div>
                </button>
              );
            })}
            {paginas > 1 && (
              <nav className="paginacao" aria-label="Páginas da lista">
                <button type="button" className="btn pq" disabled={paginaAtual === 0} onClick={() => irPagina(paginaAtual - 1)} aria-label="Página anterior">‹</button>
                {Array.from({ length: paginas }, (_, k) => (
                  <button key={k} type="button" className={`btn pq ${k === paginaAtual ? 'pri' : ''}`} aria-current={k === paginaAtual ? 'page' : undefined} onClick={() => irPagina(k)}>{k + 1}</button>
                ))}
                <button type="button" className="btn pq" disabled={paginaAtual === paginas - 1} onClick={() => irPagina(paginaAtual + 1)} aria-label="Próxima página">›</button>
              </nav>
            )}
            {!temProjetoAtivo ? <Mensagem tipo="info">{motivoSemProjeto}</Mensagem>
              : !lista.length && <p className="sub">{ehTecnico ? 'Nenhuma tarefa aberta nos seus projetos.' : 'Nenhuma atividade aberta nesta semana.'}</p>}
          </div>
        </aside>

        {item && f ? (
          <section className="card formAtual">
            <div>
              <div className="sub" style={{ fontSize: 13 }}>{item.projeto.codigo} · {item.projeto.nome} · Fase de {item.atividade.fase.toLowerCase()}</div>
              <div className="linha" style={{ alignItems: 'flex-start' }}>
                <h2 className="h2" style={{ marginTop: 4, fontSize: 24, fontWeight: 700 }}>{ehTecnico ? item.atividade.nome : `${item.atividade.codigo} · ${item.atividade.nome}`}</h2>
                <span className="acoesAtv" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {pode('criarSubatividade') && !item.atividade.pai && !novaSub && !editando &&
                    <button type="button" className="btn pq" disabled={!temProjetoAtivo} title={temProjetoAtivo ? undefined : motivoSemProjeto} onClick={() => setNovaSub(true)}>+ Nova subatividade</button>}
                  {pode('atualizarAtividade') && !editando &&
                    <button type="button" className="btn pri" onClick={() => setEditando(true)}>Atualizar status{item.atividade.pai ? (ehTecnico ? ' da tarefa' : ' da subatividade') : ''}</button>}
                  {pode('gerenciarAtividades') && !editando &&
                    <button type="button" className="btn pq" onClick={() => setEditarAtv(chave(item))}>Editar atividade</button>}
                </span>
              </div>
              {item.atividade.pai && <div className="sub" style={{ fontSize: 13 }}>{ehTecnico ? 'Tarefa da atividade' : 'Subatividade de'} {item.atividade.pai}</div>}
              <div className="sub" style={{ fontSize: 13, marginTop: 6 }}>
                Baseline {dma(item.atividade.baselineTermino)} · {item.atividade.equipe}
                {item.atividade.responsavel ? ` · responsável ${item.projeto.equipe.find(m => m.email.toLowerCase() === item.atividade.responsavel!.toLowerCase())?.nome || item.atividade.responsavel}` : ''}
                {item.atividade.marco ? ' · marco' : ''}
                {item.atividade.dataUltimaAtualizacao ? ` · última atualização em ${dma(item.atividade.dataUltimaAtualizacao)}${item.atividade.atualizadoPor ? ` por ${item.atividade.atualizadoPor}` : ''}` : ''}
              </div>
            </div>
            {novaSub && !item.atividade.pai && (
              <NovaSubatividade projetos={[item.projeto]} pai={item.atividade} meuEmail={meuEmail || item.projeto.equipe.find(m => m.nome === identidade.nome)?.email || ''}
                aoCancelar={() => setNovaSub(false)}
                aoCriada={(codigo, cod) => { setNovaSub(false); setSel(`${cod}|${codigo}`); }} />
            )}
            {!editando ? (
              <>
                <VisaoAtividade projeto={item.projeto} a={item.atividade} lista={dados.atividades[item.projeto.codigo] || []}
                  filhos={(dados.atividades[item.projeto.codigo] || []).filter(x => x.pai === item.atividade.codigo)} />
                <DocumentosAtividade projeto={item.projeto} a={item.atividade} somenteLeitura />
                <AcompanhamentoAtividade projeto={item.projeto} a={item.atividade} />
              </>
            ) : (
              <>
            <div className="fg3">
              <label className="campo">Status *
                <select className="ctl" value={f.status} onChange={e => { const st = e.target.value as StatusAtividade; muda('status', st); if (st === 'Bloqueado') muda('impedimento', true); if (st === 'Concluído') muda('percentual', '100'); }}>{STATUS_ATUALIZACAO.map(s => <option key={s}>{s}</option>)}</select>
              </label>
              {item.atividade.pai
                ? <label className="campo">% concluído *<input className="ctl" type="number" min={0} max={100} value={f.status === 'Concluído' ? '100' : f.percentual} disabled={f.status === 'Concluído'} onChange={e => muda('percentual', e.target.value)} /></label>
                : (() => {
                    const subs = (dados.atividades[item.projeto.codigo] || []).filter(x => x.pai === item.atividade.codigo);
                    const validas = subs.filter(x => x.status !== 'Cancelado');
                    return (
                      <label className="campo">% concluído
                        <input className="ctl" type="number" disabled value={percentualPrincipal(item.atividade, subs, f.status)} />
                        <span className="dica">{validas.length ? `${validas.filter(x => x.status === 'Concluído').length} de ${validas.length} subatividades concluídas` : 'Sem subatividades: 0% até concluir'}</span>
                      </label>
                    );
                  })()}
              <label className="campo">Nova data prevista *
                <input className={`ctl ${reprograma(item.atividade, f) ? 'alertaData' : ''}`} type="date" min={f.termino === item.atividade.termino ? undefined : hoje} value={f.termino} onChange={e => muda('termino', e.target.value)} />
                {avisoFimDeSemana(f.termino) && <span className="dica fds">Atenção: {avisoFimDeSemana(f.termino)}.</span>}
              </label>
              <label className="campo">Data real (se concluída)<input className="ctl" type="date" max={hoje} value={f.dataReal} onChange={e => muda('dataReal', e.target.value)} /></label>
              <label className="campo">Depende de RDM
                <select className="ctl" value={f.dependeRdm ? 'Sim' : 'Não'} onChange={e => muda('dependeRdm', e.target.value === 'Sim')}><option>Não</option><option>Sim</option></select>
              </label>
              <label className="campo">Nº da RDM<input className="ctl" placeholder="[Nº RDM]" disabled={!f.dependeRdm} value={f.numeroRdm} onChange={e => muda('numeroRdm', e.target.value)} /></label>
              <label className="campo">Impedimento *
                <select className="ctl" value={f.impedimento ? 'Sim' : 'Não'} onChange={e => muda('impedimento', e.target.value === 'Sim')}><option>Não</option><option>Sim</option></select>
              </label>
              <label className="campo">Causa do atraso
                <select className="ctl" value={f.causaAtraso} onChange={e => muda('causaAtraso', e.target.value)}>
                  <option value="">Selecione</option>{CAUSAS_ATRASO.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="campo">Horas realizadas<input className="ctl" type="number" min={0} step={0.5} placeholder="0" value={f.horas} onChange={e => muda('horas', e.target.value)} />
                {item.atividade.horasPlanejadas ? <span className={avisoHorasRealizadas(Number(f.horas), item.atividade.horasPlanejadas) ? 'dica fds' : 'dica'}>
                  {avisoHorasRealizadas(Number(f.horas), item.atividade.horasPlanejadas) ? `Atenção: ${avisoHorasRealizadas(Number(f.horas), item.atividade.horasPlanejadas)}.` : `Planejadas: ${item.atividade.horasPlanejadas} h.`}</span> : null}</label>
              {!ehTecnico && (
                <label className="campo">Teve reunião no Teams?
                  <select className="ctl" value={f.teveReuniao} onChange={e => muda('teveReuniao', e.target.value as Form['teveReuniao'])}>
                    <option value="">Selecione</option><option>Sim</option><option>Não</option>
                  </select>
                </label>
              )}
            </div>
            <label className="campo">O que foi feito
              <textarea className="ctl" rows={3} value={f.realizado} onChange={e => muda('realizado', e.target.value)} placeholder="O que foi executado nesta atividade desde a última atualização." />
            </label>
            <label className="campo">Próximo passo / observação
              <textarea className="ctl" rows={4} value={f.observacao} onChange={e => muda('observacao', e.target.value)} placeholder="O que falta, quem depende de quem e qual a próxima data." />
            </label>
            <DocumentosAtividade projeto={item.projeto} a={item.atividade} />
            {aguardando(item.atividade, dados.atividades[item.projeto.codigo] || []) && (
              <Mensagem tipo="info">Só pode ser iniciada depois de concluir: {pendentes(item.atividade, dados.atividades[item.projeto.codigo] || []).map(x => `${ehTecnico ? x.nome : `${x.codigo} · ${x.nome}`} (${x.status})`).join('; ')}.</Mensagem>
            )}
            {reprograma(item.atividade, f) && (
              <Mensagem tipo="info">A nova data ({dma(f.termino)}) passa da baseline ({dma(item.atividade.baselineTermino)}). Ao salvar, o gerente do projeto recebe um aviso de reprogramação.</Mensagem>
            )}
            <div className="aviso">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E181C" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16v.5" /></svg>
              <div>A linha de base não é editável aqui. Reprogramação além da baseline avisa o gerente do projeto para avaliar uma solicitação de mudança.</div>
            </div>
            {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
            <div className="linha" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" disabled={salvando} onClick={() => { setF(paraForm(item.atividade)); setErro(''); setEditando(false); }}>Cancelar</button>
              <button type="button" className="btn pri" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar atualização'}</button>
            </div>
              </>
            )}
          </section>
        ) : (
          <section className="card formAtual"><p className="sub">Selecione uma atividade à esquerda para atualizar o status.</p></section>
        )}
      </div>
      {editarAtv && (() => {
        const [cod, codigo] = editarAtv.split('|');
        const p = visiveis.find(x => x.codigo === cod);
        return p && <EditarAtividade projeto={p} codigo={codigo} aoFechar={() => setEditarAtv(null)} />;
      })()}
      {novaSubLivre && (
        <>
          <div className="fundoDr" onClick={() => setNovaSubLivre(false)} />
          <div className="modal" role="dialog" aria-modal="true" aria-label="Nova tarefa">
            <NovaSubatividade termo="tarefa" projetos={visiveis} meuEmail={meuEmail || visiveis.flatMap(p => p.equipe).find(m => m.nome === identidade.nome)?.email || ''}
              aoCancelar={() => setNovaSubLivre(false)}
              aoCriada={(codigo, cod) => { setNovaSubLivre(false); setSel(`${cod}|${codigo}`); }} />
          </div>
        </>
      )}
    </main>
  );
}
