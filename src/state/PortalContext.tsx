import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Atividade, Dados, Gate, NovaReuniao, NovoProjeto, Pendencia, Projeto, Risco } from '../types/models';
import { PROXIMA_FASE } from '../lib/constantes';
import { diasUteis } from '../lib/datas';
import type { FonteDados } from '../services/FonteDados';
import { criarFonte } from '../services/criarFonte';
import { config } from '../config/config';
import { horaAgora } from '../lib/datas';
import { corpoReuniao, emailReprogramacao, emailProjetoExcluido, emailReuniaoAlterada, emailGateAprovado, emailProjetoCriadoPeloPmo, emailSolicitacaoGate, emailSolicitacaoProjeto } from '../lib/emailProjeto';
import { progressoFase } from '../lib/calculos';
import { gatesFaltantes } from '../lib/gates';
import { useToast } from './ToastContext';
import { Carregando } from '../components/ui/Carregando';
import { Mensagem } from '../components/ui/Mensagem';

interface PortalValor {
  fonte: FonteDados;
  dados: Dados;
  usuario: string;
  email: string;
  hoje: string;
  sincronizando: boolean;
  atualizadoEm: string;
  atualizar(manual?: boolean): Promise<void>;
  salvarAtividade(cod: string, codigo: string, campos: Partial<Atividade>): Promise<void>;
  salvarRisco(cod: string, codigo: string, campos: Partial<Risco>): Promise<void>;
  salvarPendencia(cod: string, codigo: string, campos: Partial<Pendencia>): Promise<void>;
  aprovarCadastro(cod: string, parecer?: string): Promise<void>;
  /** GP pede a aprovação: Pendente → Aguardando aprovação */
  solicitarGate(cod: string, gate: string): Promise<void>;
  /** PMO decide. Aprovar avança a fase do projeto; no G2 pode congelar a baseline. */
  decidirGate(cod: string, gate: string, decisao: { aprovar: boolean; parecer: string; congelarBaseline?: boolean }): Promise<void>;
  editarProjeto(cod: string, campos: Partial<Projeto>): Promise<void>;
  criarAtividade(cod: string, atv: Atividade): Promise<Atividade>;
  excluirAtividade(cod: string, codigo: string, opcoes?: { cancelarReunioes?: boolean }): Promise<void>;
  /** atualização semanal da atividade; avisa o gerente se a data prevista passar da baseline. Devolve o aviso enviado (ou vazio). */
  atualizarSemanal(cod: string, codigo: string, campos: Partial<Atividade>): Promise<string>;
  criarRisco(cod: string, r: Risco): Promise<void>;
  excluirRisco(cod: string, codigo: string): Promise<void>;
  criarPendencia(cod: string, x: Pendencia): Promise<void>;
  excluirPendencia(cod: string, codigo: string): Promise<void>;
  /** cria a reunião do Teams da atividade e grava o link nela; devolve os convidados */
  agendarReuniao(cod: string, atividade: Atividade, r: NovaReuniao): Promise<string[]>;
  /** altera a reunião da atividade (horário, título, participantes); devolve os convidados */
  atualizarReuniao(cod: string, atividade: Atividade, r: NovaReuniao, anterior?: NovaReuniao): Promise<{ convidados: string[]; email: string }>;
  /** cancela a reunião no Outlook e tira o link da atividade */
  cancelarReuniao(cod: string, atividade: Atividade, mensagem: string): Promise<void>;
  /** lê a reunião da atividade para edição */
  lerReuniao(atividade: Atividade): Promise<NovaReuniao>;
  /** false quando a lista ainda não tem as colunas da reunião */
  reuniaoGravavel: boolean;
  removerGatesRepetidos(cod: string): Promise<number>;
  /** rascunho → "Em aprovação" (PMO) ou → "Ativo" com G1 aprovado (patrocinador) */
  submeterRascunho(cod: string, modo: 'aprovacao' | 'ativar'): Promise<void>;
  excluirProjeto(cod: string, opcoes: { documentos: boolean }): Promise<void>;
  /** depois da exclusão: avisa equipe, PMO e patrocinador (recebe a foto do projeto tirada antes de excluir) */
  avisarExclusaoProjeto(p: Projeto, removidos: [string, number][], documentos: boolean): Promise<string>;
  criarProjeto(novo: NovoProjeto): Promise<void>;
  /** teste: avisa por e-mail; devolve o destinatário */
  enviarEmailCriacao(novo: NovoProjeto): Promise<string>;
  /** avisa o PMO que o GP pediu aprovação (projeto novo ou gate); devolve os destinatários */
  avisarPmoProjeto(novo: NovoProjeto): Promise<string>;
  avisarPmoGate(cod: string, gate: string): Promise<string>;
  /** depois da aprovação de um gate (ou do projeto, no G1): avisa GP e PMO */
  avisarAprovacao(cod: string, gate: string, parecer: string): Promise<string>;
  restaurarPiloto(): Promise<void>;
  /** telas de edição pedem para a releitura automática esperar */
  bloquear(id: string, ativo: boolean): void;
}

const PortalContext = createContext<PortalValor | null>(null);

/** Modo de teste dos convites: reuniaoSomentePara (prioridade) ou emailSomentePara. */
export function testeReuniao(): string[] | null {
  const alvo = (config.reuniaoSomentePara || config.emailSomentePara || '').trim();
  return alvo ? alvo.split(/[,;]/).map(x => x.trim()).filter(Boolean) : null;
}

/** E-mail do gerente do projeto (PMO): membro da equipe com função de gerente, ou com o mesmo nome. */
const emailPatrocinador = () => config.emailPatrocinador || config.emailPmo;
function emailDoGp(p: Projeto): string {
  const m = p.equipe.find(x => x.email && /gerente|^gp$/i.test(x.funcao)) || p.equipe.find(x => x.email && x.nome.trim().toLowerCase() === p.gerente.trim().toLowerCase());
  return m?.email || '';
}
/** Destinatários sem repetição; em teste (emailSomentePara) tudo vai para um endereço só. */
function destinatarios(...grupos: string[]): string {
  if (config.emailSomentePara.trim()) return config.emailSomentePara.trim();
  const lista = grupos.flatMap(g => g.split(/[,;]/)).map(x => x.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(lista)).join(', ');
}

/**
 * Reuniões remarcadas no Outlook (o organizador aceitou outra data): grava o novo horário na atividade.
 * Atividade de um dia só, no dia da reunião, acompanha a nova data. Devolve o que mudou.
 */
async function reunioesRemarcadas(fonte: FonteDados, d: Dados): Promise<{ cod: string; codigo: string; campos: Partial<Atividade>; texto: string }[]> {
  if (!fonte.lerReunioes) return [];
  const comReuniao = Object.entries(d.atividades).flatMap(([cod, l]) => l.filter(a => a.reuniaoId).map(a => ({ cod, a })));
  if (!comReuniao.length) return [];
  let atuais: Record<string, string>;
  try { atuais = await fonte.lerReunioes(comReuniao.map(x => x.a.reuniaoId!)); } catch { return []; }
  const mudancas = [];
  for (const { cod, a } of comReuniao) {
    const novo = atuais[a.reuniaoId!];
    if (!novo || novo === a.reuniaoInicio) continue;
    const diaAntigo = (a.reuniaoInicio || '').slice(0, 10), diaNovo = novo.slice(0, 10);
    const campos: Partial<Atividade> = { reuniaoInicio: novo };
    if (diaAntigo && a.inicio === diaAntigo && a.termino === diaAntigo && diaNovo !== diaAntigo) { campos.inicio = diaNovo; campos.termino = diaNovo; }
    try {
      await fonte.salvarAtividade(cod, a, campos);
      mudancas.push({ cod, codigo: a.codigo, campos, texto: `${a.codigo} ${a.nome} → ${diaNovo.split('-').reverse().join('/')} ${novo.slice(11, 16)}` });
    } catch { /* sem permissão de escrita: tenta de novo na próxima leitura */ }
  }
  return mudancas;
}

/** Gates já criados nesta sessão (chave "PROJETO|G1"), para nunca criar o mesmo duas vezes. */
const gatesCriados = new Map<string, Gate>();
let filaGates: Promise<unknown> = Promise.resolve();

/**
 * Todo projeto precisa dos gates G1–G4. Os que faltarem na lista são criados no SharePoint.
 * As execuções entram numa fila (StrictMode, abas e releituras não criam em dobro).
 * Se a pessoa não tiver permissão de escrita, o gate aparece na tela e é criado na primeira aprovação.
 */
function garantirGates(fonte: FonteDados, d: Dados): Promise<Dados> {
  const tarefa = filaGates.then(async () => {
    if (!d.projetos.some(p => gatesFaltantes(p).length)) return d;
    const projetos = [];
    for (const p of d.projetos) {
      const faltam = gatesFaltantes(p);
      if (!faltam.length) { projetos.push(p); continue; }
      const novos: Gate[] = [];
      for (const g of faltam) {
        const chave = `${p.codigo}|${g.gate}`;
        const ja = gatesCriados.get(chave);
        if (ja) { novos.push(ja); continue; }
        try { const criado = await fonte.criarGate(p, g); gatesCriados.set(chave, criado); novos.push(criado); }
        catch { novos.push(g); }
      }
      projetos.push({ ...p, fases: [...p.fases, ...novos].sort((a, b) => a.gate.localeCompare(b.gate)) });
    }
    return { ...d, projetos };
  });
  filaGates = tarefa.catch(() => undefined);
  return tarefa;
}

const assinar = (d: Dados) => JSON.stringify([d.projetos, d.atividades, d.riscos, d.pendencias, d.decisoes, d.tecnicos]);
type ChaveItens = 'atividades' | 'riscos' | 'pendencias';

/** Copia os dados trocando os campos de um item (sem mutar o estado anterior). */
function comItem<T extends { codigo: string }>(d: Dados, chave: ChaveItens, cod: string, codigo: string, campos: Partial<T>): Dados {
  const lista = (d[chave][cod] || []) as unknown as T[];
  return { ...d, [chave]: { ...d[chave], [cod]: lista.map(x => (x.codigo === codigo ? { ...x, ...campos } : x)) } };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [fonte, setFonte] = useState<FonteDados | null>(null);
  const toast = useToast();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState('');
  const [usuario, setUsuario] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState('');
  const assinatura = useRef('');
  const ultimaSync = useRef(0);
  const bloqueios = useRef(new Set<string>());
  const emSync = useRef(false);

  /** Aplica um novo estado: guarda (piloto) e marca como "já visto" para a releitura. */
  /** Atualiza a partir do estado mais recente (para ações encadeadas, como criar atividade + reunião). */
  const aplicarCom = useCallback((fn: (d: Dados) => Dados) => {
    setDados(prev => {
      if (!prev) return prev;
      const novo = fn(prev);
      assinatura.current = assinar(novo);
      fonte?.persistir?.(novo);
      return novo;
    });
  }, [fonte]);

  const bloquear = useCallback((id: string, ativo: boolean) => {
    if (ativo) bloqueios.current.add(id); else bloqueios.current.delete(id);
  }, []);

  const aplicar = useCallback((novo: Dados) => {
    setDados(novo);
    assinatura.current = assinar(novo);
    fonte?.persistir?.(novo);
  }, [fonte]);

  // carga inicial (inclui o login no modo SharePoint)
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const f = await criarFonte();
        const nome = await f.entrar();
        const d = await garantirGates(f, await f.carregar());
        if (!vivo) return;
        setFonte(f);
        setUsuario(nome);
        setDados(d);
        assinatura.current = assinar(d);
        ultimaSync.current = Date.now();
        setAtualizadoEm(horaAgora());
        aplicarRemarcadas(f, d);
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      }
    })();
    return () => { vivo = false; };
  }, []);

  /** grava no estado as reuniões que mudaram de horário no Outlook e avisa quem está usando */
  const aplicarRemarcadas = useCallback(async (f: FonteDados, d: Dados) => {
    const mud = await reunioesRemarcadas(f, d);
    if (!mud.length) return;
    setDados(prev => {
      if (!prev) return prev;
      let novo = prev;
      for (const m of mud) novo = comItem<Atividade>(novo, 'atividades', m.cod, m.codigo, m.campos);
      assinatura.current = assinar(novo);
      return novo;
    });
    toast(`Reunião remarcada no Outlook; cronograma atualizado: ${mud.map(m => m.texto).join('; ')}.`);
  }, [toast]);

  const editando = () => {
    const el = document.activeElement as HTMLElement | null;
    const digitando = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.getAttribute('data-busca') === null;
    return bloqueios.current.size > 0 || digitando;
  };

  const atualizar = useCallback(async (manual = false) => {
    if (!fonte || fonte.modo !== 'sharepoint' || emSync.current) return;
    if (!manual && (document.hidden || editando())) return;
    emSync.current = true;
    setSincronizando(true);
    try {
      const novo = await garantirGates(fonte, await fonte.carregar());
      const nova = assinar(novo), mudou = nova !== assinatura.current;
      ultimaSync.current = Date.now();
      setAtualizadoEm(horaAgora());
      if (mudou) { setDados(novo); assinatura.current = nova; }
      aplicarRemarcadas(fonte, novo);
      if (manual) toast(mudou ? 'Dados atualizados do SharePoint.' : 'Nada mudou desde a última leitura.');
      else if (mudou) toast('Há alterações novas no SharePoint. A tela foi atualizada.');
    } catch (e) {
      if (manual) toast('Não foi possível atualizar: ' + (e as Error).message);
    } finally {
      emSync.current = false;
      setSincronizando(false);
    }
  }, [fonte, toast, aplicarRemarcadas]);

  // releitura automática: intervalo + ao voltar para a aba
  useEffect(() => {
    if (!fonte || fonte.modo !== 'sharepoint') return;
    const t = setInterval(() => atualizar(false), Math.max(15, config.sincronizarSegundos) * 1000);
    const aoVoltar = () => { if (!document.hidden && Date.now() - ultimaSync.current > 15000) atualizar(false); };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', aoVoltar); window.removeEventListener('focus', aoVoltar); };
  }, [fonte, atualizar]);

  const valor = useMemo<PortalValor | null>(() => {
    if (!dados || !fonte) return null;
    const projeto = (cod: string) => {
      const p = dados.projetos.find(x => x.codigo === cod);
      if (!p) throw new Error(`Projeto ${cod} não encontrado.`);
      return p;
    };
    const v: PortalValor = {
      fonte, dados, usuario, email: fonte.email(), hoje: fonte.hoje(), sincronizando, atualizadoEm, atualizar,
      bloquear,

      async salvarAtividade(cod, codigo, campos) {
        const atv = (dados.atividades[cod] || []).find(a => a.codigo === codigo)!;
        if (campos.inicio && campos.termino) campos = { ...campos, duracao: Math.max(1, diasUteis(campos.inicio, campos.termino)) };
        await fonte.salvarAtividade(cod, atv, campos);
        let novo = comItem<Atividade>(dados, 'atividades', cod, codigo, campos);
        // subatividades acompanham a atividade macro
        const herdado = Object.fromEntries(Object.entries({ status: campos.status, percentual: campos.percentual, inicio: campos.inicio, termino: campos.termino, fase: campos.fase }).filter(([, v]) => v !== undefined));
        novo = { ...novo, atividades: { ...novo.atividades, [cod]: novo.atividades[cod].map(a => (a.pai === codigo ? { ...a, ...herdado } as Atividade : a)) } };
        aplicar(novo);
      },
      async salvarRisco(cod, codigo, campos) {
        const r = (dados.riscos[cod] || []).find(x => x.codigo === codigo)!;
        await fonte.salvarRisco(cod, r, campos);
        aplicar(comItem<Risco>(dados, 'riscos', cod, codigo, campos));
      },
      async salvarPendencia(cod, codigo, campos) {
        const p = (dados.pendencias[cod] || []).find(x => x.codigo === codigo)!;
        await fonte.salvarPendencia(cod, p, campos);
        aplicar(comItem<Pendencia>(dados, 'pendencias', cod, codigo, campos));
      },
      async aprovarCadastro(cod, parecer = '') {
        await v.decidirGate(cod, 'G1', { aprovar: true, parecer });
      },
      async solicitarGate(cod, gate) {
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        await fonte.salvarGate(p, g, { situacao: 'Aguardando aprovação' });
        aplicar({ ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : { ...x, fases: x.fases.map(y => (y.gate === gate ? { ...y, situacao: 'Aguardando aprovação' } : y)) }) });
      },
      async decidirGate(cod, gate, { aprovar, parecer, congelarBaseline }) {
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        const hojeAgora = fonte.hoje();
        const camposGate = aprovar
          ? { situacao: 'Aprovado' as const, aprovadoPor: usuario, dataAprovacao: hojeAgora, parecer }
          : { situacao: 'Pendente' as const, aprovadoPor: '', dataAprovacao: '', parecer };
        await fonte.salvarGate(p, g, camposGate);
        let novo: Dados = { ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : { ...x, fases: x.fases.map(y => (y.gate === gate ? { ...y, ...camposGate } : y)) }) };
        if (!aprovar && gate === 'G1' && p.situacaoCadastro === 'Em aprovação') {
          // cadastro recusado: volta para o PMO como rascunho (sai do aviso "Analisar cadastro")
          await fonte.salvarProjeto(p, { situacaoCadastro: 'Rascunho' });
          novo = { ...novo, projetos: novo.projetos.map(x => (x.codigo === cod ? { ...x, situacaoCadastro: 'Rascunho' } : x)) };
        }
        if (aprovar) {
          // avança a fase oficial; o G4 encerra o projeto
          const camposProjeto: Partial<Projeto> = gate === 'G4'
            ? { situacaoCadastro: 'Encerrado' }
            : { fase: PROXIMA_FASE[g.fase] || p.fase, ...(gate === 'G1' && p.situacaoCadastro !== 'Ativo' ? { situacaoCadastro: 'Ativo' as const } : {}) };
          if (congelarBaseline) camposProjeto.terminoBaseline = p.terminoPrevisto || p.terminoBaseline;
          await fonte.salvarProjeto(p, camposProjeto);
          novo = { ...novo, projetos: novo.projetos.map(x => (x.codigo === cod ? { ...x, ...camposProjeto } : x)) };
          if (congelarBaseline) {
            // a linha de base passa a ser o cronograma atual
            const lista = novo.atividades[cod] || [];
            for (const a of lista.filter(a => !a.pai && (a.baselineInicio !== a.inicio || a.baselineTermino !== a.termino))) {
              await fonte.salvarAtividade(cod, a, { baselineInicio: a.inicio, baselineTermino: a.termino });
            }
            novo = { ...novo, atividades: { ...novo.atividades, [cod]: lista.map(a => ({ ...a, baselineInicio: a.inicio, baselineTermino: a.termino })) } };
          }
        }
        aplicar(novo);
      },
      async editarProjeto(cod, campos) {
        const p = projeto(cod);
        await fonte.salvarProjeto(p, campos);
        aplicar({ ...dados, projetos: dados.projetos.map(x => (x.codigo === cod ? { ...x, ...campos } : x)) });
      },
      async criarAtividade(cod, atv) {
        const p = projeto(cod);
        if ((dados.atividades[cod] || []).some(a => a.codigo === atv.codigo)) throw new Error(`Já existe uma atividade com o código ${atv.codigo}.`);
        const completa: Atividade = { ...atv, duracao: atv.duracao || Math.max(1, diasUteis(atv.inicio, atv.termino)) };
        const criada = await fonte.criarAtividade(p, completa);
        aplicar({ ...dados, atividades: { ...dados.atividades, [cod]: [...(dados.atividades[cod] || []), criada] } });
        return criada;
      },
      async excluirProjeto(cod, opcoes) {
        const p = projeto(cod);
        await fonte.excluirProjeto(dados, p, opcoes);
        for (const k of Array.from(gatesCriados.keys())) if (k.startsWith(cod + '|')) gatesCriados.delete(k);
        const sem = <T,>(r: Record<string, T>) => { const n = { ...r }; delete n[cod]; return n; };
        aplicar({
          ...dados, projetos: dados.projetos.filter(x => x.codigo !== cod),
          atividades: sem(dados.atividades), riscos: sem(dados.riscos), pendencias: sem(dados.pendencias),
          decisoes: sem(dados.decisoes), documentos: sem(dados.documentos)
        });
      },
      async avisarExclusaoProjeto(p, removidos, documentos) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        const equipe = p.equipe.map(m => m.email).filter(Boolean).join(', ');
        const para = destinatarios(equipe, emailDoGp(p), emailPatrocinador());
        if (!para) throw new Error('ninguém da equipe tem e-mail e emailPatrocinador está vazio');
        const { assunto, html } = emailProjetoExcluido(p, usuario, fonte.hoje(), removidos, documentos);
        return fonte.enviarEmail(assunto, html, para);
      },
      async submeterRascunho(cod, modo) {
        const p = projeto(cod), g1 = p.fases.find(g => g.gate === 'G1');
        const novoProj = { projeto: p, atividades: dados.atividades[cod] || [], riscos: dados.riscos[cod] || [] };
        if (modo === 'aprovacao') {
          await fonte.salvarProjeto(p, { situacaoCadastro: 'Em aprovação' });
          if (g1) await fonte.salvarGate(p, g1, { situacao: 'Aguardando aprovação' });
          aplicar({ ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : {
            ...x, situacaoCadastro: 'Em aprovação', fases: x.fases.map(g => (g.gate === 'G1' ? { ...g, situacao: 'Aguardando aprovação' } : g)) }) });
          if (config.emailAoSolicitarAprovacao && fonte.enviarEmail && emailPatrocinador()) {
            const { assunto, html } = emailSolicitacaoProjeto({ ...novoProj, projeto: { ...p, situacaoCadastro: 'Em aprovação' } }, usuario);
            fonte.enviarEmail(assunto, html, destinatarios(emailPatrocinador())).catch(() => undefined);
          }
          return;
        }
        const aprov = { situacao: 'Aprovado' as const, aprovadoPor: usuario, dataAprovacao: fonte.hoje(), parecer: 'Ativado pelo patrocinador a partir do rascunho' };
        await fonte.salvarProjeto(p, { situacaoCadastro: 'Ativo', fase: 'Planejamento' });
        if (g1) await fonte.salvarGate(p, g1, aprov);
        aplicar({ ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : {
          ...x, situacaoCadastro: 'Ativo', fase: 'Planejamento', fases: x.fases.map(g => (g.gate === 'G1' ? { ...g, ...aprov } : g)) }) });
        if (config.emailAoCriarProjeto && fonte.enviarEmail) {
          const { assunto, html } = emailProjetoCriadoPeloPmo({ ...novoProj, projeto: { ...p, situacaoCadastro: 'Ativo', fase: 'Planejamento' } }, usuario);
          fonte.enviarEmail(assunto, html, destinatarios(emailDoGp(p), emailPatrocinador()) || undefined).catch(() => undefined);
        }
      },
      async removerGatesRepetidos(cod) {
        const p = projeto(cod), ids = p.gatesRepetidos || [];
        if (!ids.length || !fonte.excluirGates) return 0;
        await fonte.excluirGates(ids);
        aplicar({ ...dados, projetos: dados.projetos.map(x => (x.codigo === cod ? { ...x, gatesRepetidos: [] } : x)) });
        return ids.length;
      },
      async atualizarSemanal(cod, codigo, campos) {
        const a = (dados.atividades[cod] || []).find(x => x.codigo === codigo)!;
        const registro = { ...campos, dataUltimaAtualizacao: fonte.hoje(), atualizadoPor: usuario };
        await fonte.salvarAtividade(cod, a, registro);
        aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, codigo, registro));
        // reprogramação: nova data prevista depois da baseline (e diferente da que já estava)
        const nova = campos.termino;
        if (!nova || !a.baselineTermino || nova <= a.baselineTermino || nova === a.termino) return '';
        if (!config.emailAoReprogramar || !fonte.enviarEmail) return '';
        const p = projeto(cod), para = destinatarios(emailDoGp(p));
        if (!para) return '';
        const { assunto, html } = emailReprogramacao(p, a, nova, { causa: campos.causaAtraso || '', observacao: campos.observacao || '', impedimento: !!campos.impedimento, autor: usuario });
        try { return await fonte.enviarEmail(assunto, html, para); } catch { return ''; }
      },
      async criarRisco(cod, r) {
        if ((dados.riscos[cod] || []).some(x => x.codigo === r.codigo)) throw new Error(`Já existe um risco com o código ${r.codigo}.`);
        const criado = await fonte.criarRisco(projeto(cod), r);
        aplicar({ ...dados, riscos: { ...dados.riscos, [cod]: [...(dados.riscos[cod] || []), criado] } });
      },
      async excluirRisco(cod, codigo) {
        const r = (dados.riscos[cod] || []).find(x => x.codigo === codigo)!;
        await fonte.excluirRisco(cod, r);
        aplicar({ ...dados, riscos: { ...dados.riscos, [cod]: (dados.riscos[cod] || []).filter(x => x.codigo !== codigo) } });
      },
      async criarPendencia(cod, x) {
        if ((dados.pendencias[cod] || []).some(y => y.codigo === x.codigo)) throw new Error(`Já existe uma pendência com o código ${x.codigo}.`);
        const criada = await fonte.criarPendencia(projeto(cod), x);
        aplicar({ ...dados, pendencias: { ...dados.pendencias, [cod]: [...(dados.pendencias[cod] || []), criada] } });
      },
      async excluirPendencia(cod, codigo) {
        const x = (dados.pendencias[cod] || []).find(y => y.codigo === codigo)!;
        await fonte.excluirPendencia(cod, x);
        aplicar({ ...dados, pendencias: { ...dados.pendencias, [cod]: (dados.pendencias[cod] || []).filter(y => y.codigo !== codigo) } });
      },
      async agendarReuniao(cod, a, r) {
        if (!fonte.criarReuniaoTeams) throw new Error('reuniões do Teams só são criadas no modo conectado');
        // sem as colunas, a reunião seria criada mas o link não ficaria na atividade
        if (fonte.reuniaoGravavel && !fonte.reuniaoGravavel()) throw new Error('a lista Portal Atividades ainda não tem as colunas da reunião. Rode o script provisionar-portal.ps1 (sem -Piloto) e recarregue o portal');
        const p = projeto(cod);
        const codigo = a.codigo;
        // modo de teste (emailSomentePara): o convite vai só para esse endereço
        const eu = fonte.email().toLowerCase();
        const lista = testeReuniao() || r.participantes;
        // o organizador (quem está logado) não recebe convite do Outlook: a reunião vai direto para a agenda dele
        const convidados = lista.filter(x => x.toLowerCase() !== eu);
        const criada = await fonte.criarReuniaoTeams({ ...r, participantes: convidados }, corpoReuniao(p, a, r.pauta, r.tipo));
        const campos = { reuniaoUrl: criada.joinUrl, reuniaoInicio: r.inicio, reuniaoId: criada.id, reuniaoTipo: r.tipo || '' };
        await fonte.salvarAtividade(cod, a, campos);
        aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, codigo, campos));
        return convidados;
      },
      async atualizarReuniao(cod, a, r, anterior) {
        if (!fonte.atualizarReuniaoTeams || !a.reuniaoId) throw new Error('esta atividade não tem reunião gravada');
        const p = projeto(cod), eu = fonte.email().toLowerCase();
        const convidados = (testeReuniao() || r.participantes).filter(x => x.toLowerCase() !== eu);
        const nova = { ...r, participantes: convidados };
        await fonte.atualizarReuniaoTeams(a.reuniaoId, nova, corpoReuniao(p, a, r.pauta, r.tipo));
        const campos = { reuniaoInicio: r.inicio, reuniaoTipo: r.tipo || '' };
        await fonte.salvarAtividade(cod, a, campos);
        aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, a.codigo, campos));
        // resumo da alteração para os convidados (além da atualização que o Outlook já envia)
        let email = '';
        if (config.emailAoAlterarReuniao && fonte.enviarEmail && convidados.length) {
          try {
            const antes = anterior || { ...nova, titulo: nova.titulo, inicio: a.reuniaoInicio || nova.inicio };
            const { assunto, html } = emailReuniaoAlterada(p, a, { ...antes, tipo: antes.tipo || a.reuniaoTipo }, nova, a.reuniaoUrl || '');
            email = await fonte.enviarEmail(assunto, html, convidados.join(', '));
          } catch (e) { email = 'falhou: ' + (e as Error).message; }
        }
        return { convidados, email };
      },
      async cancelarReuniao(cod, a, mensagem) {
        if (!fonte.cancelarReuniaoTeams || !a.reuniaoId) throw new Error('esta atividade não tem reunião gravada');
        await fonte.cancelarReuniaoTeams(a.reuniaoId, mensagem);
        const campos = { reuniaoUrl: '', reuniaoInicio: '', reuniaoId: '', reuniaoTipo: '' };
        await fonte.salvarAtividade(cod, a, campos);
        aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, a.codigo, { reuniaoUrl: undefined, reuniaoInicio: undefined, reuniaoId: undefined, reuniaoTipo: undefined }));
      },
      async lerReuniao(a) {
        if (!fonte.obterReuniaoTeams || !a.reuniaoId) throw new Error('esta atividade não tem reunião gravada');
        return fonte.obterReuniaoTeams(a.reuniaoId);
      },
      reuniaoGravavel: !fonte.reuniaoGravavel || fonte.reuniaoGravavel(),
      async excluirAtividade(cod, codigo, opcoes) {
        const lista = dados.atividades[cod] || [];
        const alvo = lista.filter(a => a.codigo === codigo || a.pai === codigo);
        if (opcoes?.cancelarReunioes && fonte.cancelarReuniaoTeams) {
          for (const a of alvo.filter(x => x.reuniaoId)) {
            try { await fonte.cancelarReuniaoTeams(a.reuniaoId!, `A atividade ${a.codigo} · ${a.nome} foi excluída do projeto ${cod}.`); }
            catch { /* reunião já cancelada ou de outro organizador: segue com a exclusão */ }
          }
        }
        for (const a of alvo) await fonte.excluirAtividade(cod, a);
        aplicar({ ...dados, atividades: { ...dados.atividades, [cod]: lista.filter(a => !alvo.includes(a)) } });
      },
      async criarProjeto(novoProjeto) {
        await fonte.criarProjeto(novoProjeto);
        if (fonte.modo === 'sharepoint') { aplicar(await garantirGates(fonte, await fonte.carregar())); return; }
        const c = novoProjeto.projeto.codigo;
        aplicar({
          ...dados,
          projetos: [...dados.projetos, novoProjeto.projeto],
          atividades: { ...dados.atividades, [c]: novoProjeto.atividades },
          riscos: { ...dados.riscos, [c]: novoProjeto.riscos },
          pendencias: { ...dados.pendencias, [c]: [] },
          decisoes: { ...dados.decisoes, [c]: [] },
          documentos: { ...dados.documentos, [c]: [] }
        });
      },
      async avisarPmoProjeto(novoProjeto) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        if (!emailPatrocinador()) throw new Error('defina emailPatrocinador no config.js');
        const { assunto, html } = emailSolicitacaoProjeto(novoProjeto, usuario);
        return fonte.enviarEmail(assunto, html, destinatarios(emailPatrocinador()));
      },
      async avisarPmoGate(cod, gate) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        if (!emailPatrocinador()) throw new Error('defina emailPatrocinador no config.js');
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        const fases = g.fase === 'Encerramento' ? ['Monitoramento', 'Encerramento'] as const : [g.fase];
        const prog = fases.map(f => progressoFase(dados, cod, f)).reduce((s, x) => ({ feitas: s.feitas + x.feitas, total: s.total + x.total }), { feitas: 0, total: 0 });
        const { assunto, html } = emailSolicitacaoGate(p, g, prog, usuario);
        return fonte.enviarEmail(assunto, html, destinatarios(emailPatrocinador()));
      },
      async avisarAprovacao(cod, gate, parecer) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        const para = destinatarios(emailDoGp(p), emailPatrocinador());
        if (!para) throw new Error('o gerente do projeto não tem e-mail na equipe e emailPatrocinador está vazio');
        const proxima = gate === 'G4' ? 'Encerrado' : (PROXIMA_FASE[g.fase] || p.fase);
        const { assunto, html } = emailGateAprovado(p, g, { por: usuario, em: fonte.hoje(), parecer, proximaFase: proxima });
        return fonte.enviarEmail(assunto, html, para);
      },
      async enviarEmailCriacao(novoProjeto) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        // projeto criado pelo PMO já nasce aprovado: avisa GP e PMO
        const para = destinatarios(emailDoGp(novoProjeto.projeto), emailPatrocinador());
        const { assunto, html } = emailProjetoCriadoPeloPmo(novoProjeto, usuario);
        return fonte.enviarEmail(assunto, html, para || undefined);
      },
      async restaurarPiloto() {
        fonte.restaurar?.();
        aplicar(await garantirGates(fonte, await fonte.carregar()));
      }
    };
    return v;
  }, [dados, fonte, usuario, sincronizando, atualizadoEm, atualizar, aplicar, aplicarCom, bloquear]);

  if (erro) {
    return (
      <main className="main">
        <Mensagem tipo="erro"><b>Não foi possível carregar os dados.</b><br />{erro}</Mensagem>
        <p className="sub">Confira o arquivo config.js (tenantId, clientId, sharepointHost e sitePath) e se as listas foram criadas pelo script.</p>
      </main>
    );
  }
  if (!valor) return <Carregando texto="Carregando o portal…" />;
  return <PortalContext.Provider value={valor}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalValor {
  const v = useContext(PortalContext);
  if (!v) throw new Error('usePortal precisa estar dentro de <PortalProvider>.');
  return v;
}

/** Enquanto `ativo`, a releitura automática não redesenha a tela. */
export function useBloqueioSincronizacao(id: string, ativo: boolean) {
  const { bloquear } = usePortal();
  useEffect(() => { bloquear(id, ativo); return () => bloquear(id, false); }, [id, ativo, bloquear]);
}
