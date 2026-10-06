import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Atividade, Projeto, StatusAtividade } from '../types/models';
import { usePortal, useBloqueioSincronizacao } from '../state/PortalContext';
import { usePapel } from '../state/PapelContext';
import { useToast } from '../state/ToastContext';
import { useProjetosVisiveis } from '../state/useProjetosVisiveis';
import { atividadesDaSemana, semanaDe, vencida, type ItemSemana } from '../lib/semana';
import { CAUSAS_ATRASO, STATUS_ATUALIZACAO } from '../lib/constantes';
import { dm, dma } from '../lib/datas';
import { Chips } from '../components/ui/Chips';
import { Mensagem } from '../components/ui/Mensagem';

interface Form {
  status: StatusAtividade; percentual: string; termino: string; dataReal: string;
  dependeRdm: boolean; numeroRdm: string; impedimento: boolean; causaAtraso: string; horas: string; observacao: string;
}
const paraForm = (a: Atividade): Form => ({
  status: a.status, percentual: String(a.percentual), termino: a.termino, dataReal: a.dataReal || '',
  dependeRdm: !!a.dependeRdm, numeroRdm: a.numeroRdm || '', impedimento: !!a.impedimento, causaAtraso: a.causaAtraso || '',
  horas: a.horasRealizadas === undefined ? '' : String(a.horasRealizadas), observacao: a.observacao
});
const chave = (i: ItemSemana) => `${i.projeto.codigo}|${i.atividade.codigo}`;
/** a pessoa mudou a data prevista para depois da baseline */
const reprograma = (a: Atividade, f: Form) => !!a.baselineTermino && f.termino !== a.termino && f.termino > a.baselineTermino;

/** Atualização semanal: lista das atividades da semana à esquerda, formulário à direita. */
export function AtualizacaoPage() {
  const { dados, hoje, atualizarSemanal } = usePortal();
  const { projetos, identidade } = useProjetosVisiveis();
  const { pode } = usePapel();
  const toast = useToast();
  useBloqueioSincronizacao('atualizacao-semanal', true);

  const todos = useMemo(() => atividadesDaSemana(dados, projetos, hoje), [dados, projetos, hoje]);
  // "minha": responsável com o meu e-mail (ou, no piloto, o e-mail da pessoa com o meu nome na equipe)
  const meuEmail = (p: Projeto) => (identidade.email || p.equipe.find(m => m.nome.toLowerCase() === identidade.nome.toLowerCase())?.email || '').toLowerCase();
  const ehMinha = (i: ItemSemana) => !!i.atividade.responsavel && i.atividade.responsavel.toLowerCase() === meuEmail(i.projeto);
  const minhas = todos.filter(ehMinha);
  const [filtro, setFiltro] = useState<'Só as minhas' | 'Toda a equipe'>(minhas.length ? 'Só as minhas' : 'Toda a equipe');
  const lista = filtro === 'Só as minhas' ? minhas : todos;

  const [sel, setSel] = useState<string>(lista[0] ? chave(lista[0]) : '');
  const item = lista.find(i => chave(i) === sel) || lista[0];
  const [f, setF] = useState<Form | null>(item ? paraForm(item.atividade) : null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (item) { setF(paraForm(item.atividade)); setErro(''); } else setF(null); }, [item ? chave(item) : '']); // eslint-disable-line react-hooks/exhaustive-deps

  const muda = <K extends keyof Form>(k: K, v: Form[K]) => setF(s => (s ? { ...s, [k]: v } : s));
  const { inicio: segunda, fim: domingo } = semanaDe(hoje);

  const salvar = async () => {
    if (!item || !f) return;
    const a = item.atividade;
    const pct = Number(f.percentual);
    const br = (s: string) => s.split('-').reverse().join('/');
    if (f.percentual === '' || isNaN(pct) || pct < 0 || pct > 100) { setErro('Informe o % concluído entre 0 e 100.'); return; }
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
        causaAtraso: f.causaAtraso, horasRealizadas: f.horas === '' ? undefined : Number(f.horas), observacao: f.observacao.trim()
      });
      toast(enviado ? `Atualização salva. Reprogramação avisada a ${enviado}.` : 'Atualização salva.');
    } catch (e) { setErro((e as Error).message); }
    finally { setSalvando(false); }
  };

  const rotulo = (a: Atividade): [string, string] =>
    a.status === 'Bloqueado' || a.impedimento ? ['Bloqueado', '#9A2E12'] : vencida(a, hoje) ? ['Data prevista vencida', '#7A5200'] : [a.status, '#575A5F'];
  const nota = (a: Atividade) => (a.status === 'Bloqueado' || a.impedimento) && a.observacao ? a.observacao
    : `Prevista ${dm(a.termino)} · ${a.dependeRdm && a.status === 'Planejado' ? 'depende de RDM' : a.percentual > 0 ? `${a.percentual}%` : a.status}`;

  if (!pode('atualizarAtividade')) return <main className="main"><Mensagem tipo="info">Seu perfil não atualiza atividades.</Mensagem></main>;

  return (
    <main className="main">
      <div>
        <div className="migalha"><Link to="/">Escritório de Projetos</Link> › Atualizar status</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Atualização semanal</h1>
        <p className="pdesc" style={{ marginTop: 6 }}>Semana de {dma(segunda)} a {dma(domingo)}. Atualize o andamento das atividades em curso e das que estão atrasadas.</p>
      </div>
      <div className="cols">
        <aside className="card pad atvLista">
          <h2 className="h3" style={{ marginBottom: 2 }}>{filtro === 'Só as minhas' ? 'Minhas atividades desta semana' : 'Atividades da equipe nesta semana'}</h2>
          <div className="sub" style={{ marginBottom: 10 }}>Todos os projetos em que estou alocado</div>
          <Chips rotulo="Quais atividades" opcoes={['Só as minhas', 'Toda a equipe'] as const} valor={filtro}
            aoMudar={v => { setFiltro(v); const l = v === 'Só as minhas' ? minhas : todos; setSel(l[0] ? chave(l[0]) : ''); }}
            formatar={v => `${v} (${v === 'Só as minhas' ? minhas.length : todos.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {lista.map(i => {
              const [txt, cor] = rotulo(i.atividade), on = item && chave(i) === chave(item);
              return (
                <button key={chave(i)} type="button" className={`atvCard ${on ? 'on' : ''}`} aria-pressed={!!on} onClick={() => setSel(chave(i))}>
                  <div className="atvSt" style={{ color: cor }}>{txt}</div>
                  <div className="atvNome">{i.projeto.codigo} · {i.atividade.codigo} {i.atividade.nome}</div>
                  <div className="atvNota">{nota(i.atividade)}</div>
                </button>
              );
            })}
            {!lista.length && <p className="sub">{filtro === 'Só as minhas'
              ? 'Nenhuma atividade sua nesta semana. Atividades sem responsável aparecem em "Toda a equipe".'
              : 'Nenhuma atividade aberta nesta semana nos seus projetos.'}</p>}
          </div>
        </aside>

        {item && f ? (
          <section className="card formAtual">
            <div>
              <div className="sub" style={{ fontSize: 13 }}>{item.projeto.codigo} · {item.projeto.nome} · Fase de {item.atividade.fase.toLowerCase()}</div>
              <h2 className="h2" style={{ marginTop: 4, fontSize: 24, fontWeight: 700 }}>{item.atividade.codigo} · {item.atividade.nome}</h2>
              <div className="sub" style={{ fontSize: 13, marginTop: 6 }}>
                Baseline {dma(item.atividade.baselineTermino)} · {item.atividade.equipe}
                {item.atividade.responsavel ? ` · responsável ${item.projeto.equipe.find(m => m.email.toLowerCase() === item.atividade.responsavel!.toLowerCase())?.nome || item.atividade.responsavel}` : ''}
                {item.atividade.marco ? ' · marco' : ''}
                {item.atividade.dataUltimaAtualizacao ? ` · última atualização em ${dma(item.atividade.dataUltimaAtualizacao)}${item.atividade.atualizadoPor ? ` por ${item.atividade.atualizadoPor}` : ''}` : ''}
              </div>
            </div>
            <div className="fg3">
              <label className="campo">Status *
                <select className="ctl" value={f.status} onChange={e => muda('status', e.target.value as StatusAtividade)}>{STATUS_ATUALIZACAO.map(s => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="campo">% concluído *<input className="ctl" type="number" min={0} max={100} value={f.status === 'Concluído' ? '100' : f.percentual} disabled={f.status === 'Concluído'} onChange={e => muda('percentual', e.target.value)} /></label>
              <label className="campo">Nova data prevista *
                <input className={`ctl ${reprograma(item.atividade, f) ? 'alertaData' : ''}`} type="date" min={f.termino === item.atividade.termino ? undefined : hoje} value={f.termino} onChange={e => muda('termino', e.target.value)} />
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
              <label className="campo">Horas realizadas<input className="ctl" type="number" min={0} placeholder="0" value={f.horas} onChange={e => muda('horas', e.target.value)} /></label>
            </div>
            <label className="campo">Próximo passo / observação
              <textarea className="ctl" rows={4} value={f.observacao} onChange={e => muda('observacao', e.target.value)} placeholder="O que falta, quem depende de quem e qual a próxima data." />
            </label>
            {reprograma(item.atividade, f) && (
              <Mensagem tipo="info">A nova data ({dma(f.termino)}) passa da baseline ({dma(item.atividade.baselineTermino)}). Ao salvar, o gerente do projeto recebe um aviso de reprogramação.</Mensagem>
            )}
            <div className="aviso">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E181C" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16v.5" /></svg>
              <div>A linha de base não é editável aqui. Reprogramação além da baseline avisa o gerente do projeto para avaliar uma solicitação de mudança.</div>
            </div>
            {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
            <div className="linha" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" disabled={salvando} onClick={() => { setF(paraForm(item.atividade)); setErro(''); }}>Cancelar</button>
              <button type="button" className="btn pri" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar atualização'}</button>
            </div>
          </section>
        ) : (
          <section className="card formAtual"><p className="sub">Selecione uma atividade à esquerda para atualizar o status.</p></section>
        )}
      </div>
    </main>
  );
}
