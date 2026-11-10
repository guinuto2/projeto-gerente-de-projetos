import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Arquivo, Atividade, Dados, Gate, NovaReuniao, NovoProjeto, Notificacao, Pendencia, Projeto, RegistroHistorico, Risco, Tecnico } from '../types/models';
import { PROXIMA_FASE } from '../lib/constantes';
import { diasUteis } from '../lib/datas';
import type { FonteDados } from '../services/FonteDados';
import { criarFonte } from '../services/criarFonte';
import { config } from '../config/config';
import { horaAgora } from '../lib/datas';
import { corpoReuniao, emailTarefasLancadas, emailAtrasos, emailStatusSubatividade, emailReprogramacao, emailProjetoExcluido, emailReuniaoAlterada, emailGateAprovado, emailProjetoCriadoPeloPmo, emailSolicitacaoGate, emailSolicitacaoProjeto } from '../lib/emailProjeto';
import { percentualPrincipal, progressoFase } from '../lib/calculos';
import { gatesFaltantes } from '../lib/gates';
import { descrever } from '../lib/historico';
import { iniciaria, pendentes } from '../lib/dependencias';
import { usePapel } from './PapelContext';
import { DOMINIOS_SYSTECH, dominioDe } from '../lib/publicacaoCliente';
import { emailsDoCliente, inicioDaSemana, montarStatusReport } from '../lib/statusReport';
import { lancadaParaTecnico } from '../lib/dependencias';
import { ConflitoEdicao } from '../services/FonteSharePoint';
import { CAMPOS_STATUS, checklistGate, conferirDatas, conferirStatus, riscoAltoSemMitigacao } from '../lib/validacoes';
import { pessoasDaLista, type PessoaApp } from '../lib/pessoas';
import { PAPEIS, papelDaFuncao, type Papel } from '../lib/permissoes';
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
  /** alguma gravação ou leitura em andamento (mostra a barrinha de carregamento no topo) */
  ocupado: boolean;
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
  /** envia um arquivo para a pasta do projeto (registra no histórico) */
  enviarDocumento(cod: string, pasta: string, arquivo: File): Promise<void>;
  /** exclui um arquivo da pasta do projeto (vai para a lixeira; registra no histórico) */
  excluirDocumento(cod: string, pasta: string, arquivo: Arquivo): Promise<void>;
  /** histórico de mudanças do projeto */
  historico(cod: string): Promise<RegistroHistorico[]>;
  /** registros do histórico esperando para ser gravados e o último erro */
  statusHistorico: { pendentes: number; erro: string };
  /** tenta gravar agora os registros pendentes; devolve quantos restaram */
  reenviarHistorico(): Promise<number>;
  /** lança para o técnico as subatividades ainda não lançadas (e avisa por e-mail cada técnico) */
  lancarTarefas(cod: string, codigos: string[]): Promise<void>;
  /** pessoas para o cadastro (lista Portal Tecnicos), com o perfil de cada uma pela função */
  pessoasApp: PessoaApp[];
  /** envia agora o status report do projeto (versão interna e versão do cliente); devolve os destinatários */
  enviarStatusReport(cod: string): Promise<string[]>;
  /** avisos do sino de quem está logado (mais recentes primeiro) */
  notificacoes: Notificacao[];
  marcarNotificacoesLidas(ids: string[]): Promise<void>;
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
  /** colunas de "lançar para o técnico" e pré-requisitos existem no SharePoint */
  tarefasGravaveis: boolean;
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

/** Frase da tela de carregamento para cada operação que costuma demorar. */
const MENSAGEM_ACAO: Record<string, string> = {
  criarProjeto: 'Criando o projeto no SharePoint…', editarProjeto: 'Salvando o projeto…', excluirProjeto: 'Excluindo o projeto e tudo o que está ligado a ele…',
  submeterRascunho: 'Enviando o rascunho…', criarAtividade: 'Incluindo a atividade…', salvarAtividade: 'Salvando a atividade…',
  excluirAtividade: 'Excluindo a atividade…', atualizarSemanal: 'Salvando a atualização…', agendarReuniao: 'Criando a reunião no Teams e enviando os convites…',
  atualizarReuniao: 'Atualizando a reunião no Teams…', cancelarReuniao: 'Cancelando a reunião no Teams…', solicitarGate: 'Enviando o pedido de aprovação…',
  decidirGate: 'Registrando a decisão do gate…', criarRisco: 'Incluindo o risco…', salvarRisco: 'Salvando o risco…', excluirRisco: 'Excluindo o risco…',
  criarPendencia: 'Incluindo a pendência…', salvarPendencia: 'Salvando a pendência…', excluirPendencia: 'Excluindo a pendência…',
  enviarDocumento: 'Enviando o arquivo para o SharePoint…', excluirDocumento: 'Excluindo o documento…', removerGatesRepetidos: 'Limpando os gates repetidos…'
};

/** Registros do histórico que não puderam ser gravados: ficam no navegador e são reenviados. */
const CHAVE_PENDENTES = 'portal-pmo-historico-pendente';
const lerPendentes = (): RegistroHistorico[] => { try { return JSON.parse(localStorage.getItem(CHAVE_PENDENTES) || '[]'); } catch { return []; } };
const salvarPendentes = (l: RegistroHistorico[]) => { try { localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(l.slice(-500))); } catch { /* */ } };

/** Situação da gravação do histórico (para avisar quando falha). */
type AvisoHistorico = (s: { pendentes: number; erro: string }) => void;
let avisarHistorico: AvisoHistorico = () => undefined;
let ultimoErroHistorico = '';

/** Tenta gravar os pendentes; devolve quantos restaram. */
async function reenviarPendentes(f: FonteDados): Promise<number> {
  const l = lerPendentes();
  if (!l.length) { avisarHistorico({ pendentes: 0, erro: '' }); return 0; }
  const restam: RegistroHistorico[] = [];
  for (const r of l) {
    if (restam.length) { restam.push(r); continue; }   // primeiro erro: não insiste nos demais agora
    try { await f.registrar(r); } catch (e) { ultimoErroHistorico = (e as Error).message; restam.push(r); }
  }
  salvarPendentes(restam);
  avisarHistorico({ pendentes: restam.length, erro: restam.length ? ultimoErroHistorico : '' });
  return restam.length;
}
/** Grava no histórico sem travar a ação; se falhar, guarda para reenviar e avisa o motivo. */
const registrarSeguro = (f: FonteDados, r: RegistroHistorico) => {
  f.registrar(r).then(() => { if (lerPendentes().length) reenviarPendentes(f); }).catch(e => {
    ultimoErroHistorico = (e as Error).message;
    salvarPendentes([...lerPendentes(), r]);
    avisarHistorico({ pendentes: lerPendentes().length, erro: ultimoErroHistorico });
  });
};

/** Modo de teste dos convites: reuniaoSomentePara (prioridade) ou emailSomentePara. */
export function testeReuniao(): string[] | null {
  const alvo = (config.reuniaoSomentePara || config.emailSomentePara || '').trim();
  return alvo ? alvo.split(/[,;]/).map(x => x.trim()).filter(Boolean) : null;
}

/**
 * Destinatários por papel. Ordem: (1) quem tem o papel na equipe do projeto; (2) quem tem a função na lista Portal Tecnicos;
 * (3) só em último caso, o endereço fixo do config.js (emailPatrocinador / emailPmo).
 */
let pessoasAtuais: Tecnico[] = [];   // lista Portal Tecnicos (atualizada pelo portal a cada leitura)
const daLista = (papel: 'PMO' | 'Patrocinador') => pessoasDaLista(pessoasAtuais).filter(x => x.papeis.includes(papel) && x.email).map(x => x.email);
/** Gerente do projeto: membro da equipe com função de gerente (ou com o nome do gerente). */
function emailDoGp(p: Projeto): string {
  const m = p.equipe.find(x => x.email && /gerente|^gp$/i.test(x.funcao)) || p.equipe.find(x => x.email && x.nome.trim().toLowerCase() === p.gerente.trim().toLowerCase());
  return m?.email || '';
}
/** PMO de um projeto: o gerente dele; sem gerente com e-mail, os PMOs da lista Portal Tecnicos. Sem projeto: todos os PMOs. */
function pmosDe(p?: Projeto): string {
  const gp = p ? emailDoGp(p) : '';
  if (gp) return gp;
  const l = daLista('PMO');
  return l.length ? l.join(', ') : (config.emailPmo || config.emailPatrocinador || '');
}
/** Patrocinador de um projeto: quem tem a função Patrocinador na equipe; senão os da lista Portal Tecnicos. */
function patrocinadoresDe(p?: Projeto): string {
  const doProjeto = (p?.equipe || []).filter(m => m.email && /patrocinador/i.test(m.funcao)).map(m => m.email);
  if (doProjeto.length) return doProjeto.join(', ');
  const l = daLista('Patrocinador');
  return l.length ? l.join(', ') : (config.emailPatrocinador || config.emailPmo || '');
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
let ultimaConsultaReunioes = 0;
async function reunioesRemarcadas(fonte: FonteDados, d: Dados): Promise<{ cod: string; codigo: string; campos: Partial<Atividade>; texto: string }[]> {
  if (!fonte.lerReunioes) return [];
  if (Date.now() - ultimaConsultaReunioes < 5 * 60000) return [];   // no máximo a cada 5 minutos
  ultimaConsultaReunioes = Date.now();
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

/**
 * Avisos do sino: um por destinatário (e-mails separados por vírgula), sem avisar quem fez a ação.
 * Não usa o redirecionamento de teste dos e-mails: o aviso vai para quem deve recebê-lo.
 */
function notificar(fonte: FonteDados, para: string, n: { titulo: string; texto: string; link: string; tipo: string }) {
  if (!fonte.criarNotificacoes) return;
  const eu = (fonte.modo === 'sharepoint' ? fonte.email() : '').toLowerCase();
  const emails = Array.from(new Set((para || '').split(/[,;]\s*/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@') && e !== eu)));
  if (fonte.modo === 'piloto') emails.splice(0, emails.length, '*');   // piloto: aparece para quem estiver testando
  if (!emails.length) return;
  fonte.criarNotificacoes(emails.map(e => ({ ...n, para: e }))).then(() => window.dispatchEvent(new Event('portal-notificacoes'))).catch(() => undefined);
}

/** Status de subatividade mudou: e-mail ao PMO (gerente do projeto), sem travar a gravação. */
function avisarStatusSubatividade(fonte: FonteDados, p: Projeto | undefined, a: Atividade | undefined, campos: Partial<Atividade>, autor: string, aviso: (m: string) => void) {
  if (!p || !a || !a.pai || !campos.status || campos.status === a.status) return;
  notificar(fonte, pmosDe(p), { titulo: `${a.codigo} · ${a.nome}: ${campos.status}`, texto: `${autor} mudou o status da tarefa de “${a.status}” para “${campos.status}” · ${p.codigo}.`, link: `/projeto/${encodeURIComponent(p.codigo)}`, tipo: 'status' });
  if (!config.emailAoMudarStatusSubatividade || !fonte.enviarEmail) return;
  const para = destinatarios(pmosDe(p));
  if (!para) return;
  const { assunto, html } = emailStatusSubatividade(p, a, campos, autor);
  fonte.enviarEmail(assunto, html, para).then(d => aviso(`PMO avisado da mudança de status (${d}).`)).catch(() => undefined);
}

/**
 * Atrasos: uma vez por dia (ao abrir o portal), avisa o PMO de cada projeto sobre as atividades e subatividades que
 * passaram do término previsto e ainda não foram avisadas. A atividade guarda o término avisado (AvisoAtraso),
 * então cada atraso é avisado uma vez — se for remarcada e atrasar de novo, avisa de novo.
 */
async function verificarAtrasos(fonte: FonteDados, d: Dados): Promise<{ cod: string; codigo: string; campos: Partial<Atividade> }[]> {
  if (!config.emailAoAtrasar || !fonte.enviarEmail || fonte.modo !== 'sharepoint') return [];
  const hoje = fonte.hoje(), chave = 'portal-pmo-atrasos-verificados';
  try { if (localStorage.getItem(chave) === hoje) return []; localStorage.setItem(chave, hoje); } catch { /* */ }
  const marcados: { cod: string; codigo: string; campos: Partial<Atividade> }[] = [];
  for (const p of d.projetos.filter(x => x.situacaoCadastro === 'Ativo')) {
    const novos = (d.atividades[p.codigo] || []).filter(a =>
      a.status !== 'Concluído' && a.status !== 'Cancelado' && a.termino && a.termino < hoje && a.avisoAtraso !== a.termino);
    if (!novos.length) continue;
    const para = destinatarios(pmosDe(p));
    if (!para) continue;   // sem e-mail do PMO: tenta de novo quando houver
    const nome = (e?: string) => (e ? p.equipe.find(m => m.email.toLowerCase() === e.toLowerCase())?.nome || e : '');
    const itens = novos.map(a => ({ a, dias: Math.max(1, diasUteis(a.termino, hoje) - 1), responsavel: nome(a.responsavel) }))
      .sort((x, y) => y.dias - x.dias);
    try {
      const { assunto, html } = emailAtrasos(p, itens);
      await fonte.enviarEmail(assunto, html, para);
      notificar(fonte, pmosDe(p), { titulo: `${itens.length} atividade(s) atrasada(s) · ${p.codigo}`, texto: itens.slice(0, 3).map(x => `${x.a.codigo} ${x.a.nome}`).join(' · ') + (itens.length > 3 ? ' …' : ''), link: `/projeto/${encodeURIComponent(p.codigo)}`, tipo: 'atraso' });
      // cada técnico recebe só as tarefas atrasadas dele
      const porTecnico = new Map<string, typeof itens>();
      for (const it of itens) if (it.a.responsavel && lancadaParaTecnico(it.a)) porTecnico.set(it.a.responsavel.toLowerCase(), [...(porTecnico.get(it.a.responsavel.toLowerCase()) || []), it]);
      for (const [email, dele] of porTecnico) {
        const paraTec = destinatarios(email);
        if (!paraTec || para.toLowerCase().split(/[,;]\s*/).includes(email)) continue;   // o PMO já recebeu a lista completa
        notificar(fonte, email, { titulo: `Você tem ${dele.length} tarefa(s) atrasada(s) · ${p.codigo}`, texto: dele.map(x => x.a.nome).join(' · '), link: '/atualizar', tipo: 'atraso' });
        try { const m = emailAtrasos(p, dele, true); await fonte.enviarEmail(m.assunto, m.html, paraTec); } catch { /* o aviso do técnico falhou: o do PMO foi */ }
      }
      for (const a of novos) {
        try { await fonte.salvarAtividade(p.codigo, a, { avisoAtraso: a.termino }); marcados.push({ cod: p.codigo, codigo: a.codigo, campos: { avisoAtraso: a.termino } }); }
        catch { /* sem permissão de gravar: o aviso pode repetir amanhã */ }
      }
    } catch { /* e-mail falhou: tenta amanhã */ try { localStorage.removeItem(chave); } catch { /* */ } }
  }
  return marcados;
}

/**
 * Status report: versão interna ao GP e ao patrocinador; versão do cliente às pessoas do cliente na equipe.
 * Devolve quem recebeu. Grava no projeto a data do envio.
 */
async function enviarStatusReport(fonte: FonteDados, d: Dados, p: Projeto): Promise<string[]> {
  if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
  const hoje = fonte.hoje(), enviados: string[] = [];
  const interno = destinatarios(pmosDe(p), patrocinadoresDe(p));
  if (interno) { const r = montarStatusReport(p, d, hoje, 'equipe'); await fonte.enviarEmail(r.assunto, r.html, interno); enviados.push(interno); }
  const cliente = destinatarios(emailsDoCliente(p));
  if (cliente) { const r = montarStatusReport(p, d, hoje, 'cliente'); await fonte.enviarEmail(r.assunto, r.html, cliente); enviados.push(cliente); }
  if (!enviados.length) throw new Error('o projeto não tem gerente, patrocinador nem pessoas do cliente com e-mail');
  await fonte.salvarProjeto(p, { ultimoStatusReport: hoje }).catch(() => undefined);
  return enviados;
}
/** Envio semanal automático: no dia configurado (ou depois, na mesma semana), para os projetos que ainda não receberam. */
async function statusReportsDaSemana(fonte: FonteDados, d: Dados): Promise<{ cod: string; data: string }[]> {
  if (!config.statusReportAutomatico || !fonte.enviarEmail || fonte.modo !== 'sharepoint') return [];
  const hoje = fonte.hoje(), dia = new Date(`${hoje}T12:00:00`).getDay();
  if (dia === 0 || dia === 6 || dia < (config.statusReportDia || 5)) return [];
  const segunda = inicioDaSemana(hoje), feitos: { cod: string; data: string }[] = [];
  for (const p of d.projetos.filter(x => x.situacaoCadastro === 'Ativo' && (!x.ultimoStatusReport || x.ultimoStatusReport < segunda))) {
    try { await enviarStatusReport(fonte, d, p); feitos.push({ cod: p.codigo, data: hoje }); } catch { /* sem destinatários ou falha: tenta no próximo acesso */ }
  }
  return feitos;
}

/** Recalcula o % da atividade principal (proporção das subatividades concluídas) e grava se mudou. */
async function recalcularPrincipal(fonte: FonteDados, lista: Atividade[], cod: string, codPai: string): Promise<Partial<Atividade> | null> {
  const pai = lista.find(a => a.codigo === codPai);
  if (!pai) return null;
  const pct = percentualPrincipal(pai, lista.filter(a => a.pai === codPai));
  if (pct === pai.percentual) return null;
  await fonte.salvarAtividade(cod, pai, { percentual: pct });
  return { percentual: pct };
}

/** Pré-requisitos: não deixa iniciar (ou concluir) uma atividade com pré-requisito ainda não concluído. */
function exigirPreRequisitos(a: Atividade, campos: Partial<Atividade>, lista: Atividade[]) {
  const status = campos.status ?? a.status, pct = campos.percentual ?? a.percentual;
  const comecando = iniciaria(status, pct) && !iniciaria(a.status, a.percentual);
  const concluindo = status === 'Concluído' && a.status !== 'Concluído';
  if (!comecando && !concluindo) return;
  const falta = pendentes({ ...a, ...campos }, lista);
  if (falta.length) throw new Error(`“${a.nome}” só pode ser iniciada depois de concluir: ${falta.map(x => `“${x.nome}” (${x.status.toLowerCase()})`).join('; ')}.`);
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
  const { papel, definirDisponiveis, semPerfil } = usePapel();
  /** "hoje" é relido a cada minuto: se o portal ficar aberto de um dia para o outro, a linha de hoje acompanha */
  const [hojeAtual, setHojeAtual] = useState('');
  useEffect(() => {
    if (!fonte) return;
    setHojeAtual(fonte.hoje());
    const t = window.setInterval(() => setHojeAtual(h => (fonte.hoje() !== h ? fonte.hoje() : h)), 60000);
    return () => window.clearInterval(t);
  }, [fonte]);
  useEffect(() => { pessoasAtuais = dados?.tecnicos || []; }, [dados?.tecnicos]);
  /** pessoas para o cadastro de projetos: lista Portal Tecnicos, pela função (Técnico/Arquiteto, PMO/Gerente de projeto, Patrocinador) */
  const pessoasApp = useMemo<PessoaApp[]>(() => pessoasDaLista(dados?.tecnicos || []), [dados?.tecnicos]);
  /** cópia dos projetos para a pasta de cada órgão (biblioteca Portal Clientes): republica alguns segundos depois de cada mudança */
  const interno = useRef(false);
  useEffect(() => {
    if (!fonte || !dados || fonte.modo !== 'sharepoint' || fonte.modoCliente || !interno.current || !fonte.publicarParaClientes) return;
    const t = window.setTimeout(() => { fonte.publicarParaClientes!(dados).catch(() => undefined); }, 8000);
    return () => window.clearTimeout(t);
  }, [fonte, dados]);
  /** avisos do sino: lidos ao abrir, a cada minuto e logo depois de um aviso criado neste navegador */
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  useEffect(() => {
    if (!fonte || !dados || !fonte.notificacoes || fonte.modoCliente) return;   // cliente não tem sino nem acesso às listas
    const ler = () => { fonte.notificacoes!(fonte.modo === 'sharepoint' ? fonte.email() : '').then(l => { if (l) setNotificacoes(l); }).catch(() => undefined); };
    ler();
    const t = window.setInterval(ler, 60000);
    const ev = () => window.setTimeout(ler, 600);
    window.addEventListener('portal-notificacoes', ev);
    return () => { window.clearInterval(t); window.removeEventListener('portal-notificacoes', ev); };
  }, [fonte, !!dados]); // eslint-disable-line react-hooks/exhaustive-deps
  /** situação da gravação do histórico */
  const [statusHistorico, setStatusHistorico] = useState<{ pendentes: number; erro: string }>({ pendentes: lerPendentes().length, erro: '' });
  const erroAvisado = useRef('');
  useEffect(() => {
    avisarHistorico = st => {
      setStatusHistorico(st);
      if (st.erro && st.erro !== erroAvisado.current) { erroAvisado.current = st.erro; toast(`O histórico não foi gravado no SharePoint: ${st.erro}. O registro ficou guardado e será reenviado.`); }
    };
    return () => { avisarHistorico = () => undefined; };
  }, [toast]);
  /** frase da tela de carregamento (operação que já passou de meio segundo) */
  const [acaoLonga, setAcaoLonga] = useState<string | null>(null);
  const longas = useRef(0);
  /** quantas ações (gravar, aprovar, criar, excluir…) estão em andamento */
  const [emAndamento, setEmAndamento] = useState(0);
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
        // perfis: no modo conectado, só as funções de aplicativo (App Roles) do Entra ID; no piloto, todos (demonstração)
        const meus = f.papeis ? f.papeis().map(papelDaFuncao).filter((x): x is Papel => !!x) : PAPEIS;
        definirDisponiveis(meus);
        // sem nenhuma função do portal: para aqui (não carrega dados nem roda avisos automáticos)
        if (!meus.length) { if (vivo) { setFonte(f); setUsuario(nome); } return; }
        // cliente de fora da Systech: lê só a pasta do órgão dele (biblioteca Portal Clientes), sem acesso às listas
        if (f.modo === 'sharepoint' && f.carregarCliente && meus.every(x => x === 'Cliente') && !DOMINIOS_SYSTECH.includes(dominioDe(f.email()))) {
          const dc = await f.carregarCliente();
          if (!vivo) return;
          setFonte(f); setUsuario(nome); setDados(dc); assinatura.current = assinar(dc); ultimaSync.current = Date.now(); setAtualizadoEm(horaAgora());
          return;
        }
        interno.current = meus.some(x => x === 'PMO' || x === 'Técnico');
        const d = await garantirGates(f, await f.carregar());
        if (!vivo) return;
        setFonte(f);
        setUsuario(nome);
        setDados(d);
        assinatura.current = assinar(d);
        ultimaSync.current = Date.now();
        setAtualizadoEm(horaAgora());
        aplicarRemarcadas(f, d);
        if (f.modo === 'sharepoint') reenviarPendentes(f);
        if (meus.includes('PMO')) statusReportsDaSemana(f, d).then(r => {
          if (!r.length) return;
          setDados(prev => (prev ? { ...prev, projetos: prev.projetos.map(x => { const e = r.find(y => y.cod === x.codigo); return e ? { ...x, ultimoStatusReport: e.data } : x; }) } : prev));
          toast(`Status report semanal enviado de ${r.length} projeto(s).`);
        });
        verificarAtrasos(f, d).then(m => {
          if (!m.length) return;
          setDados(prev => { if (!prev) return prev; let n = prev; for (const x of m) n = comItem<Atividade>(n, 'atividades', x.cod, x.codigo, x.campos); assinatura.current = assinar(n); return n; });
          if (meus.includes('PMO')) toast(`PMO e técnicos avisados por e-mail de ${m.length} atividade(s) atrasada(s).`);
        });
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
    for (const m of mud) registrarSeguro(f, { quando: new Date().toISOString(), usuario: 'Outlook (remarcação aceita pelo organizador)', projeto: m.cod, tipo: 'Reunião', acao: 'Remarcada', descricao: m.texto });
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
      const novo = fonte.modoCliente && fonte.carregarCliente ? await fonte.carregarCliente() : await garantirGates(fonte, await fonte.carregar());
      const nova = assinar(novo), mudou = nova !== assinatura.current;
      ultimaSync.current = Date.now();
      setAtualizadoEm(horaAgora());
      if (mudou) { setDados(novo); assinatura.current = nova; }
      aplicarRemarcadas(fonte, novo);
      reenviarPendentes(fonte);
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
    // só relê com a aba do navegador visível (aba em segundo plano não gasta o limite do SharePoint)
    const t = setInterval(() => { if (!document.hidden) atualizar(false); }, Math.max(30, config.sincronizarSegundos) * 1000);
    const aoVoltar = () => { if (!document.hidden && Date.now() - ultimaSync.current > 60000) atualizar(false); };
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
    /** valida status e datas de uma atividade antes de gravar; erros bloqueiam, avisos voltam para mostrar depois */
    const validarAtividade = (cod: string, atv: Atividade, campos: Partial<Atividade>, modo: 'estrutura' | 'reprogramacao'): string[] => {
      const lista = dados.atividades[cod] || [], depois = { ...atv, ...campos } as Atividade;
      const erros: string[] = [];
      if (CAMPOS_STATUS.some(c => c in campos)) erros.push(...conferirStatus(atv, depois, fonte.hoje(), lista.some(x => x.pai === atv.codigo && x.status !== 'Cancelado')));
      let avisos: string[] = [];
      if ('inicio' in campos || 'termino' in campos) {
        const dt = conferirDatas(depois, projeto(cod), lista, modo);
        erros.push(...dt.erros); avisos = dt.avisos;
      }
      if (erros.length) throw new Error('Não foi possível salvar: ' + erros.join('; ') + '.');
      return avisos;
    };
    /** avisos de validação: mostrados logo depois da mensagem de confirmação da tela */
    const avisarDepois = (l: string[]) => { setTimeout(() => toast('Atenção: ' + l.join('; ') + '.'), 400); };
    /** grava uma atividade; se outra pessoa mudou o item nesse meio tempo, recarrega os dados e repassa o aviso */
    const gravarAtividade = async (cod: string, atv: Atividade, campos: Partial<Atividade>) => {
      try { await fonte.salvarAtividade(cod, atv, campos); }
      catch (e) { if (e instanceof ConflitoEdicao) atualizar(true).catch(() => undefined); throw e; }   // força a recarga: o painel ainda está aberto
    };
    /** checklist do G3/G4: bloqueia o pedido e a aprovação enquanto houver item pendente */
    const exigirChecklist = async (p: Projeto, gate: string) => {
      if (gate !== 'G3' && gate !== 'G4') return;
      let temTrd: boolean | null = null;
      if (gate === 'G4' && fonte.modo !== 'piloto') {
        const pastas = await fonte.documentos(p.codigo).catch(() => []);
        temTrd = pastas.some(x => x.arquivos.some(a => /\btrd\b|termo\s*de\s*aceite/i.test(a.nome)));
      }
      const falta = checklistGate(gate, p, dados, temTrd).filter(i => i.ok === false);
      if (falta.length) throw new Error(`Antes do ${gate}: ${falta.map(i => i.texto).join('; ')}.`);
    };

    const v: PortalValor = {
      fonte, dados, usuario, email: fonte.email(), hoje: hojeAtual || fonte.hoje(), sincronizando, ocupado: emAndamento > 0, atualizadoEm, atualizar,
      bloquear,

      async salvarAtividade(cod, codigo, campos) {
        const atv = (dados.atividades[cod] || []).find(a => a.codigo === codigo)!;
        exigirPreRequisitos(atv, campos, dados.atividades[cod] || []);
        if (campos.inicio && campos.termino) campos = { ...campos, duracao: Math.max(1, diasUteis(campos.inicio, campos.termino)) };
        // principal: o % não é editável — vem das subatividades concluídas (ou 0/100 pelo status, se não tiver)
        if (!atv.pai && ('percentual' in campos || 'status' in campos)) {
          campos = { ...campos, percentual: percentualPrincipal(atv, (dados.atividades[cod] || []).filter(a => a.pai === codigo), campos.status ?? atv.status) };
        }
        const avisos = validarAtividade(cod, atv, campos, 'estrutura');
        await gravarAtividade(cod, atv, campos);
        if (avisos.length) avisarDepois(avisos);
        avisarStatusSubatividade(fonte, dados.projetos.find(x => x.codigo === cod), atv, campos, usuario, toast);
        let novo = comItem<Atividade>(dados, 'atividades', cod, codigo, campos);
        // mudança de fase: as subatividades acompanham a nova fase, mantendo progresso, datas, status e o resto
        if (campos.fase && campos.fase !== atv.fase) {
          for (const sub of (dados.atividades[cod] || []).filter(a => a.pai === codigo && a.fase !== campos.fase)) {
            await fonte.salvarAtividade(cod, sub, { fase: campos.fase });
          }
          novo = { ...novo, atividades: { ...novo.atividades, [cod]: novo.atividades[cod].map(a => (a.pai === codigo ? { ...a, fase: campos.fase! } : a)) } };
        }
        // subatividade mudou de status: a principal recalcula o %
        if (atv.pai && 'status' in campos) {
          const doPai = await recalcularPrincipal(fonte, novo.atividades[cod] || [], cod, atv.pai);
          if (doPai) novo = comItem<Atividade>(novo, 'atividades', cod, atv.pai, doPai);
        }
        aplicar(novo);
      },
      async salvarRisco(cod, codigo, campos) {
        const r = (dados.riscos[cod] || []).find(x => x.codigo === codigo)!;
        if (riscoAltoSemMitigacao({ ...r, ...campos })) throw new Error('Risco alto (impacto alto, probabilidade média ou alta): informe o plano de mitigação.');
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
        await exigirChecklist(p, gate);
        await fonte.salvarGate(p, g, { situacao: 'Aguardando aprovação' });
        aplicar({ ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : { ...x, fases: x.fases.map(y => (y.gate === gate ? { ...y, situacao: 'Aguardando aprovação' } : y)) }) });
      },
      async decidirGate(cod, gate, { aprovar, parecer, congelarBaseline }) {
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        if (aprovar) await exigirChecklist(p, gate);
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
        const dt = conferirDatas(completa, p, dados.atividades[cod] || [], 'estrutura');
        if (dt.erros.length) throw new Error('Não foi possível criar: ' + dt.erros.join('; ') + '.');
        if (dt.avisos.length) avisarDepois(dt.avisos);
        const criada = await fonte.criarAtividade(p, completa);
        const lista = [...(dados.atividades[cod] || []), criada];
        // tarefa que já nasce lançada para o técnico (criada pelo PMO): avisa o técnico no sino e por e-mail
        if (criada.pai && atv.lancada === true && atv.responsavel) {
          notificar(fonte, atv.responsavel, { titulo: `1 tarefa nova para você · ${p.codigo}`, texto: criada.nome, link: '/atualizar', tipo: 'tarefa' });
          const para = config.emailAoLancarTarefa && fonte.enviarEmail ? destinatarios(atv.responsavel) : '';
          if (para && fonte.enviarEmail && atv.responsavel.toLowerCase() !== (fonte.modo === 'sharepoint' ? fonte.email().toLowerCase() : '')) {
            const nome = p.equipe.find(m => m.email.toLowerCase() === atv.responsavel!.toLowerCase())?.nome || atv.responsavel;
            const { assunto, html } = emailTarefasLancadas(p, nome, [criada], usuario);
            fonte.enviarEmail(assunto, html, para).catch(() => undefined);
          }
        }
        let novo: Dados = { ...dados, atividades: { ...dados.atividades, [cod]: lista } };
        if (criada.pai) {
          const doPai = await recalcularPrincipal(fonte, lista, cod, criada.pai);
          if (doPai) novo = comItem<Atividade>(novo, 'atividades', cod, criada.pai, doPai);
        }
        aplicar(novo);
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
        const para = destinatarios(equipe, pmosDe(p), patrocinadoresDe(p));
        if (!para) throw new Error('ninguém da equipe tem e-mail e não há PMO nem patrocinador na lista Portal Tecnicos');
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
          notificar(fonte, pmosDe(), { titulo: `Cadastro para aprovar · ${p.codigo}`, texto: `${usuario} enviou o projeto “${p.nome}” para aprovação (G1).`, link: `/projeto/${encodeURIComponent(cod)}`, tipo: 'aprovacao' });
          if (config.emailAoSolicitarAprovacao && fonte.enviarEmail && pmosDe()) {
            const { assunto, html } = emailSolicitacaoProjeto({ ...novoProj, projeto: { ...p, situacaoCadastro: 'Em aprovação' } }, usuario);
            fonte.enviarEmail(assunto, html, destinatarios(pmosDe())).catch(() => undefined);
          }
          return;
        }
        const aprov = { situacao: 'Aprovado' as const, aprovadoPor: usuario, dataAprovacao: fonte.hoje(), parecer: 'Ativado pelo patrocinador a partir do rascunho' };
        await fonte.salvarProjeto(p, { situacaoCadastro: 'Ativo', fase: 'Planejamento' });
        if (g1) await fonte.salvarGate(p, g1, aprov);
        aplicar({ ...dados, projetos: dados.projetos.map(x => x.codigo !== cod ? x : {
          ...x, situacaoCadastro: 'Ativo', fase: 'Planejamento', fases: x.fases.map(g => (g.gate === 'G1' ? { ...g, ...aprov } : g)) }) });
        notificar(fonte, [pmosDe(p), patrocinadoresDe(p), ...p.equipe.map(m => m.email)].filter(Boolean).join(', '), { titulo: `Projeto aprovado · ${p.codigo}`, texto: `${usuario} aprovou o cadastro de “${p.nome}”. O projeto está ativo, na fase Planejamento.`, link: `/projeto/${encodeURIComponent(cod)}`, tipo: 'aprovacao' });
        if (config.emailAoCriarProjeto && fonte.enviarEmail) {
          const { assunto, html } = emailProjetoCriadoPeloPmo({ ...novoProj, projeto: { ...p, situacaoCadastro: 'Ativo', fase: 'Planejamento' } }, usuario);
          fonte.enviarEmail(assunto, html, destinatarios(pmosDe(p), patrocinadoresDe(p)) || undefined).catch(() => undefined);
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
        exigirPreRequisitos(a, campos, dados.atividades[cod] || []);
        const lista = dados.atividades[cod] || [];
        if (!a.pai) campos = { ...campos, percentual: percentualPrincipal(a, lista.filter(x => x.pai === codigo), campos.status ?? a.status) };
        const avisosData = validarAtividade(cod, a, campos, 'reprogramacao');
        const registro = { ...campos, dataUltimaAtualizacao: fonte.hoje(), atualizadoPor: usuario };
        await gravarAtividade(cod, a, registro);
        if (avisosData.length) avisarDepois(avisosData);
        avisarStatusSubatividade(fonte, dados.projetos.find(x => x.codigo === cod), a, campos, usuario, toast);
        aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, codigo, registro));
        if (a.pai && campos.status && campos.status !== a.status) {
          const doPai = await recalcularPrincipal(fonte, lista.map(x => (x.codigo === codigo ? { ...x, ...registro } : x)), cod, a.pai);
          if (doPai) aplicarCom(d => comItem<Atividade>(d, 'atividades', cod, a.pai, doPai));
        }
        // reprogramação: nova data prevista depois da baseline (e diferente da que já estava)
        const nova = campos.termino;
        if (!nova || !a.baselineTermino || nova <= a.baselineTermino || nova === a.termino) return '';
        notificar(fonte, pmosDe(projeto(cod)), { titulo: `Reprogramação · ${cod} · ${a.codigo}`, texto: `${usuario} mudou a data prevista de “${a.nome}” para ${nova.split('-').reverse().join('/')} (baseline ${a.baselineTermino.split('-').reverse().join('/')}).`, link: `/atualizar?item=${encodeURIComponent(`${cod}|${a.codigo}`)}`, tipo: 'reprogramacao' });
        if (!config.emailAoReprogramar || !fonte.enviarEmail) return '';
        const p = projeto(cod), para = destinatarios(pmosDe(p));
        if (!para) return '';
        const { assunto, html } = emailReprogramacao(p, a, nova, { causa: campos.causaAtraso || '', observacao: campos.observacao || '', impedimento: !!campos.impedimento, autor: usuario });
        try { return await fonte.enviarEmail(assunto, html, para); } catch { return ''; }
      },
      async lancarTarefas(cod, codigos) {
        const p = projeto(cod);
        const alvo = (dados.atividades[cod] || []).filter(a => codigos.includes(a.codigo) && a.pai && a.lancada === false);
        if (fonte.tarefasGravaveis && !fonte.tarefasGravaveis()) throw new Error('a lista Portal Atividades ainda não tem a coluna "Lançada para o técnico". Rode o script provisionar-portal.ps1 (sem -Piloto) e recarregue o portal');
        const semResp = alvo.filter(a => !a.responsavel);
        if (semResp.length) throw new Error(`Escolha o técnico responsável antes de lançar: ${semResp.map(a => a.codigo).join(', ')}.`);
        let novo = dados;
        for (const a of alvo) { await fonte.salvarAtividade(cod, a, { lancada: true }); novo = comItem<Atividade>(novo, 'atividades', cod, a.codigo, { lancada: true }); }
        aplicar(novo);
        // um e-mail por técnico com as tarefas dele
        {
          const porTec = new Map<string, Atividade[]>();
          for (const a of alvo) porTec.set(a.responsavel!.toLowerCase(), [...(porTec.get(a.responsavel!.toLowerCase()) || []), a]);
          for (const [email, tarefas] of porTec)
            notificar(fonte, email, { titulo: `${tarefas.length} tarefa(s) nova(s) para você · ${p.codigo}`, texto: tarefas.map(t => t.nome).join(' · '), link: '/atualizar', tipo: 'tarefa' });
        }
        if (config.emailAoLancarTarefa && fonte.enviarEmail) {
          const porTecnico = new Map<string, Atividade[]>();
          for (const a of alvo) porTecnico.set(a.responsavel!.toLowerCase(), [...(porTecnico.get(a.responsavel!.toLowerCase()) || []), a]);
          for (const [email, tarefas] of porTecnico) {
            const nome = p.equipe.find(m => m.email.toLowerCase() === email)?.nome || email;
            const para = destinatarios(email);
            if (!para) continue;
            const { assunto, html } = emailTarefasLancadas(p, nome, tarefas, usuario);
            fonte.enviarEmail(assunto, html, para).catch(() => undefined);
          }
        }
      },
      async enviarDocumento(cod, pasta, arquivo) { await fonte.enviarArquivo(cod, pasta, arquivo); },
      async excluirDocumento(cod, pasta, arquivo) {
        if (!fonte.excluirArquivo) throw new Error('A exclusão de documentos funciona quando o portal está conectado ao SharePoint.');
        await fonte.excluirArquivo(cod, pasta, arquivo);
      },
      historico(cod) { return fonte.historico(cod); },
      statusHistorico,
      pessoasApp,
      notificacoes,
      async marcarNotificacoesLidas(ids) {
        if (!ids.length) return;
        setNotificacoes(l => l.map(n => (ids.includes(n.id) ? { ...n, lida: true } : n)));
        await fonte.marcarNotificacoesLidas?.(ids);
      },
      reenviarHistorico() { return reenviarPendentes(fonte); },
      async criarRisco(cod, r) {
        if (riscoAltoSemMitigacao(r)) throw new Error('Risco alto (impacto alto, probabilidade média ou alta): informe o plano de mitigação.');
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
      tarefasGravaveis: !fonte.tarefasGravaveis || fonte.tarefasGravaveis(),
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
        const restante = lista.filter(a => !alvo.includes(a));
        let novo: Dados = { ...dados, atividades: { ...dados.atividades, [cod]: restante } };
        const excluida = lista.find(a => a.codigo === codigo);
        if (excluida?.pai) {
          const doPai = await recalcularPrincipal(fonte, restante, cod, excluida.pai);
          if (doPai) novo = comItem<Atividade>(novo, 'atividades', cod, excluida.pai, doPai);
        }
        aplicar(novo);
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
      async enviarStatusReport(cod) {
        const p = projeto(cod);
        const r = await enviarStatusReport(fonte, dados, p);
        aplicar({ ...dados, projetos: dados.projetos.map(x => (x.codigo === cod ? { ...x, ultimoStatusReport: fonte.hoje() } : x)) });
        return r;
      },
      async avisarPmoProjeto(novoProjeto) {
        notificar(fonte, pmosDe(), { titulo: `Cadastro para aprovar · ${novoProjeto.projeto.codigo}`, texto: `${usuario} cadastrou “${novoProjeto.projeto.nome}” e pediu a aprovação (G1).`, link: `/projeto/${encodeURIComponent(novoProjeto.projeto.codigo)}`, tipo: 'aprovacao' });
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        if (!pmosDe()) throw new Error('não há PMO com e-mail na lista Portal Tecnicos (nem emailPmo no config.js)');
        const { assunto, html } = emailSolicitacaoProjeto(novoProjeto, usuario);
        return fonte.enviarEmail(assunto, html, destinatarios(pmosDe()));   // cadastro: quem aprova é o PMO
      },
      async avisarPmoGate(cod, gate) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        { const p0 = projeto(cod), g0 = p0.fases.find(x => x.gate === gate);
          notificar(fonte, patrocinadoresDe(p0), { titulo: `${gate} aguardando sua aprovação · ${p0.codigo}`, texto: `${usuario} pediu a aprovação do ${gate}${g0 ? ` (fim de ${g0.fase})` : ''} do projeto “${p0.nome}”.`, link: `/projeto/${encodeURIComponent(cod)}`, tipo: 'aprovacao' }); }
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        if (!patrocinadoresDe(p)) throw new Error('o projeto não tem patrocinador com e-mail na equipe nem na lista Portal Tecnicos');
        const fases = g.fase === 'Encerramento' ? ['Monitoramento', 'Encerramento'] as const : [g.fase];
        const prog = fases.map(f => progressoFase(dados, cod, f)).reduce((s, x) => ({ feitas: s.feitas + x.feitas, total: s.total + x.total }), { feitas: 0, total: 0 });
        const { assunto, html } = emailSolicitacaoGate(p, g, prog, usuario);
        return fonte.enviarEmail(assunto, html, destinatarios(patrocinadoresDe(p)));   // G2–G4: quem aprova é o patrocinador
      },
      async avisarAprovacao(cod, gate, parecer) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        const p = projeto(cod), g = p.fases.find(x => x.gate === gate)!;
        const para = destinatarios(pmosDe(p), patrocinadoresDe(p), p.equipe.map(m => m.email).filter(Boolean).join(', '));
        if (!para) throw new Error('ninguém do projeto tem e-mail e não há PMO nem patrocinador na lista Portal Tecnicos');
        const proxima = gate === 'G4' ? 'Encerrado' : (PROXIMA_FASE[g.fase] || p.fase);
        notificar(fonte, [pmosDe(p), patrocinadoresDe(p), ...p.equipe.map(m => m.email)].filter(Boolean).join(', '), { titulo: `${gate} aprovado · ${p.codigo}`, texto: gate === 'G4' ? `${usuario} aprovou o encerramento do projeto “${p.nome}”.` : `${usuario} aprovou o ${gate}. O projeto segue para ${proxima}.`, link: `/projeto/${encodeURIComponent(cod)}`, tipo: 'aprovacao' });
        const { assunto, html } = emailGateAprovado(p, g, { por: usuario, em: fonte.hoje(), parecer, proximaFase: proxima });
        return fonte.enviarEmail(assunto, html, para);
      },
      async enviarEmailCriacao(novoProjeto) {
        if (!fonte.enviarEmail) throw new Error('no modo piloto o e-mail não é enviado');
        notificar(fonte, [patrocinadoresDe(novoProjeto.projeto), ...novoProjeto.projeto.equipe.map(m => m.email)].filter(Boolean).join(', '), { titulo: `Novo projeto · ${novoProjeto.projeto.codigo}`, texto: `${usuario} criou o projeto “${novoProjeto.projeto.nome}” (${novoProjeto.projeto.cliente}).`, link: `/projeto/${encodeURIComponent(novoProjeto.projeto.codigo)}`, tipo: 'projeto' });
        // projeto criado pelo PMO já nasce aprovado: avisa GP e PMO
        const para = destinatarios(pmosDe(novoProjeto.projeto), patrocinadoresDe(novoProjeto.projeto));
        const { assunto, html } = emailProjetoCriadoPeloPmo(novoProjeto, usuario);
        return fonte.enviarEmail(assunto, html, para || undefined);
      },
      async restaurarPiloto() {
        fonte.restaurar?.();
        aplicar(await garantirGates(fonte, await fonte.carregar()));
      }
    };
    // toda ação assíncrona conta como "ocupado" enquanto roda (barrinha de carregamento no topo)
    // e, se der certo, vira um registro no histórico do projeto (quem, quando, o que mudou)
    // leituras (historico, lerReuniao) ficam de fora: senão cada leitura recriaria o contexto e dispararia outra leitura
    const ACOES_BLOQUEADAS_ENCERRADO = new Set<string>(['salvarAtividade', 'criarAtividade', 'excluirAtividade', 'atualizarSemanal', 'lancarTarefas',
      'salvarRisco', 'criarRisco', 'excluirRisco', 'salvarPendencia', 'criarPendencia', 'excluirPendencia',
      'agendarReuniao', 'atualizarReuniao', 'cancelarReuniao', 'solicitarGate', 'decidirGate']);
    const SEM_INDICADOR = new Set(['marcarNotificacoesLidas', 'atualizar', 'bloquear', 'historico', 'lerReuniao', 'reenviarHistorico', 'carregarPessoasApp']);
    const quem = `${usuario} (${papel})`;
    for (const k of Object.keys(v) as (keyof PortalValor)[]) {
      const fn = v[k];
      if (typeof fn !== 'function' || SEM_INDICADOR.has(k)) continue;
      (v as unknown as Record<string, unknown>)[k] = (...args: unknown[]) => {
        // projeto encerrado: somente leitura (atividades, riscos, pendências, reuniões e gates)
        if (ACOES_BLOQUEADAS_ENCERRADO.has(k) && typeof args[0] === 'string' && dados.projetos.find(p => p.codigo === args[0])?.situacaoCadastro === 'Encerrado')
          return Promise.reject(new Error('Projeto encerrado: somente leitura. Não é possível alterar atividades, riscos, pendências, reuniões ou gates.'));
        const r = (fn as (...a: unknown[]) => unknown).apply(v, args);
        if (r instanceof Promise) {
          setEmAndamento(n => n + 1);
          // operação demorada (mais de meio segundo): tela de carregamento com a frase da ação
          const msg = MENSAGEM_ACAO[k];
          let mostrou = false;
          const timer = msg ? window.setTimeout(() => { mostrou = true; longas.current++; setAcaoLonga(msg); }, 500) : 0;
          return r.then(res => {
            const l = descrever(k, args, dados, res);
            if (l) registrarSeguro(fonte, { quando: new Date().toISOString(), usuario: quem, projeto: l.cod, tipo: l.tipo, acao: l.acao, descricao: l.descricao, item: l.item, antes: l.antes, depois: l.depois });
            return res;
          }).finally(() => {
            setEmAndamento(n => Math.max(0, n - 1));
            if (timer) window.clearTimeout(timer);
            if (mostrou && --longas.current <= 0) { longas.current = 0; setAcaoLonga(null); }
          });
        }
        return r;
      };
    }
    return v;
  }, [dados, fonte, usuario, papel, hojeAtual, sincronizando, emAndamento, atualizadoEm, atualizar, aplicar, aplicarCom, bloquear, statusHistorico, pessoasApp, notificacoes]);

  if (erro) {
    return (
      <main className="main">
        <Mensagem tipo="erro"><b>Não foi possível carregar os dados.</b><br />{erro}</Mensagem>
        <p className="sub">Confira o arquivo config.js (tenantId, clientId, sharepointHost e sitePath) e se as listas foram criadas pelo script.</p>
      </main>
    );
  }
  if (semPerfil && fonte) return (
    <main className="semPerfil">
      <div className="card semPerfilCartao">
        <div className="vazioIcone" aria-hidden="true">?</div>
        <h1 className="h2" style={{ fontSize: 22, fontWeight: 700 }}>Você ainda não tem um perfil na Central Systech</h1>
        <p className="sub" style={{ fontSize: 14, lineHeight: 1.6 }}>
          Entrou como <b>{usuario || fonte.email()}</b>, mas nenhuma função do portal (PMO, Patrocinador, Técnico ou Cliente) está atribuída a esta conta
          no aplicativo <b>Portal PMO</b> do Entra ID. Peça ao PMO ou à TI para atribuir o seu perfil e entre de novo.
        </p>
        <button type="button" className="btn pri" onClick={() => fonte.sair()}>Sair e entrar com outra conta</button>
      </div>
    </main>
  );
  if (!valor) return <Carregando texto="Carregando o portal…" telaCheia />;
  return (
    <PortalContext.Provider value={valor}>
      {children}
      {acaoLonga && (
        <div className="overlayCarregando" role="alertdialog" aria-busy="true" aria-label={acaoLonga}>
          <div className="overlayCartao"><span className="spinner" aria-hidden="true" /><b>{acaoLonga}</b><span className="sub">Aguarde, isso pode levar alguns segundos.</span></div>
        </div>
      )}
    </PortalContext.Provider>
  );
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
