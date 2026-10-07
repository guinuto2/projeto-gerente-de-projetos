import type { PortalConfig } from '../config/config';
import type {
  Arquivo, Atividade, Dados, Fase, Gate, MembroEquipe, NovaReuniao, NovoProjeto, PastaDocumentos, Pendencia, Projeto, RegistroHistorico, Risco, Tecnico
} from '../types/models';
import { GATE_DA_FASE, PASTAS, normalizarTipo } from '../lib/constantes';
import { hojeIso, isoDeDataHora, iso, linhas } from '../lib/datas';
import type { Autenticador } from './auth';
import type { FonteDados } from './FonteDados';
import { GraphClient, fetchGraph } from './graph';

/** Nomes das listas criadas por provisionar-portal.ps1. */
export const LISTAS = {
  projetos: 'Portal Projetos',
  atividades: 'Portal Atividades',
  riscos: 'Portal Riscos',
  pendencias: 'Portal Pendencias',
  gates: 'Portal Gates',
  decisoes: 'Portal Decisoes'
} as const;
type ChaveLista = keyof typeof LISTAS;

type Campos = Record<string, unknown>;
interface ItemLista { id: string; fields: Campos }
interface ItemDrive {
  id?: string; name: string; webUrl: string; lastModifiedDateTime: string;
  lastModifiedBy?: { user?: { displayName?: string } }; file?: unknown; folder?: unknown;
}

const txt = (v: unknown): string => (v == null ? '' : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
/** Campo de data só-data é gravado ao meio-dia UTC para não "voltar um dia" no fuso do Brasil. */
const dataSp = (v?: string): string | null => (v ? v + 'T12:00:00Z' : null);

/** Mapeia nomes de propriedades do portal para colunas da lista; datas e listas são convertidas. */
function paraColunas(campos: Campos, mapa: Record<string, string>): Campos {
  const out: Campos = {};
  for (const [k, v] of Object.entries(campos)) {
    const coluna = mapa[k];
    if (!coluna) continue;
    if (coluna.startsWith('Data')) out[coluna] = dataSp(v as string);
    else if (coluna === 'Equipe' && Array.isArray(v)) out[coluna] = (v as MembroEquipe[]).map(e => [e.nome, e.funcao, e.empresa, e.email].join(' | ')).join('\n');
    else out[coluna] = Array.isArray(v) ? v.join('\n') : v;
  }
  return out;
}

const COLUNAS_PROJETO: Record<string, string> = {
  nome: 'Title', cliente: 'Cliente', tipo: 'TipoProjeto', fase: 'Fase', farol: 'Farol', situacaoCadastro: 'Situacao',
  gerente: 'Gerente', arquiteto: 'Arquiteto', patrocinador: 'Patrocinador', contrato: 'Contrato',
  inicio: 'DataInicio', terminoBaseline: 'DataTerminoBaseline', terminoPrevisto: 'DataTerminoPrevista', objetivo: 'Objetivo',
  escopoIncluido: 'EscopoIncluido', escopoExcluido: 'EscopoExcluido', premissas: 'Premissas', dependencias: 'Dependencias', restricoes: 'Restricoes',
  equipe: 'Equipe'
};
const COLUNAS_ATIVIDADE: Record<string, string> = {
  nome: 'Title', codigo: 'Codigo', fase: 'Fase', equipe: 'Equipe', duracao: 'Duracao', descricao: 'Descricao', marco: 'Marco',
  inicio: 'DataInicio', termino: 'DataTermino', baselineInicio: 'DataBaselineInicio', baselineTermino: 'DataBaselineTermino',
  status: 'Status', percentual: 'Percentual', pai: 'AtividadePai', observacao: 'Observacao',
  reuniaoUrl: 'ReuniaoTeams', reuniaoInicio: 'ReuniaoInicio', reuniaoId: 'ReuniaoId', reuniaoTipo: 'ReuniaoTipo',
  responsavel: 'ResponsavelEmail', dataReal: 'DataReal', dependeRdm: 'DependeRDM', numeroRdm: 'NumeroRDM', impedimento: 'Impedimento',
  causaAtraso: 'CausaAtraso', horasRealizadas: 'HorasRealizadas', dataUltimaAtualizacao: 'DataUltimaAtualizacao', atualizadoPor: 'AtualizadoPor'
};
const COLUNAS_GATE: Record<string, string> = {
  nome: 'Title', gate: 'Gate', situacao: 'Situacao', data: 'DataPrevista', info: 'Info',
  aprovadoPor: 'AprovadoPor', dataAprovacao: 'DataAprovacao', parecer: 'Parecer'
};

export class FonteSharePoint implements FonteDados {
  readonly modo = 'sharepoint' as const;
  private graph: GraphClient;
  private siteId = '';
  private ids: Partial<Record<ChaveLista, string>> = {};
  private driveId = '';
  private driveUrl = '';

  constructor(private cfg: PortalConfig, private auth: Autenticador) {
    this.graph = new GraphClient(auth);
  }

  entrar() { return this.auth.entrar(); }
  sair() { return this.auth.sair(); }
  email() { return this.auth.email(); }
  hoje() { return /^\d{4}-\d{2}-\d{2}$/.test(this.cfg.dataSimulada || '') ? this.cfg.dataSimulada : hojeIso(); }

  private preparando?: Promise<void>;

  /** Descobre o site, as listas e a biblioteca (uma vez por sessão, mesmo com chamadas simultâneas). */
  private preparar(): Promise<void> {
    if (!this.preparando) this.preparando = this.descobrir().catch(e => { this.preparando = undefined; throw e; });
    return this.preparando;
  }

  private async descobrir(): Promise<void> {
    const site = await this.graph.get<{ id: string }>(`/sites/${this.cfg.sharepointHost}:${this.cfg.sitePath}`);
    this.siteId = site.id;
    const listas = await this.graph.todos<{ id: string; displayName: string }>(`/sites/${this.siteId}/lists?$select=id,displayName`);
    for (const [k, nome] of Object.entries(LISTAS) as [ChaveLista, string][]) {
      const l = listas.find(x => x.displayName === nome);
      if (!l) throw new Error(`A lista "${nome}" não existe no site. Rode o script provisionar-portal.ps1.`);
      this.ids[k] = l.id;
    }
    // lista opcional: sem ela o portal funciona, só não oferece os técnicos
    this.idTecnicos = listas.find(x => x.displayName === 'Portal Tecnicos')?.id || '';
    this.idHistorico = listas.find(x => x.displayName === 'Portal Historico')?.id || '';
    const colunas = await this.graph.todos<{ name: string }>(`/sites/${this.siteId}/lists/${this.ids.atividades}/columns?$select=name`);
    this.colunasAtividades = new Set(colunas.map(c => c.name));
    const drives = await this.graph.todos<{ id: string; name: string; webUrl: string }>(`/sites/${this.siteId}/drives?$select=id,name,webUrl`);
    const bib = drives.find(x => x.name === this.cfg.biblioteca);
    if (!bib) throw new Error(`A biblioteca "${this.cfg.biblioteca}" não existe no site.`);
    this.driveId = bib.id;
    this.driveUrl = bib.webUrl;
  }

  /** Quantos itens duplicados de gate foram ignorados na última leitura (o script limpa). */
  gatesDuplicados = 0;

  private colunasAtividades = new Set<string>();
  private idTecnicos = '';
  private idHistorico = '';
  reuniaoGravavel() { return ['ReuniaoTeams', 'ReuniaoInicio', 'ReuniaoId'].every(c => this.colunasAtividades.has(c)); }

  /** Colunas que o site ainda não tem (rodar provisionar-portal.ps1 cria). */
  colunasAusentes = new Set<string>();

  /**
   * Grava e, se a lista ainda não tiver alguma coluna nova (ex.: Parecer), tira a coluna e tenta de novo.
   * Assim o portal continua funcionando antes de o script atualizado ser executado.
   */
  private async gravar<T>(acao: (campos: Campos) => Promise<T>, campos: Campos): Promise<T> {
    const c = { ...campos };
    for (let i = 0; i < 8; i++) {
      try { return await acao(c); }
      catch (e) {
        const m = /Field '([^']+)' is not recognized|campo '([^']+)'|Column '([^']+)' does not exist/i.exec((e as Error).message);
        const coluna = m && (m[1] || m[2] || m[3]);
        if (!coluna || !(coluna in c)) throw e;
        delete c[coluna];
        this.colunasAusentes.add(coluna);
      }
    }
    return acao(c);
  }
  private patchItem(k: ChaveLista, id: string | undefined, campos: Campos) {
    return this.gravar(c => this.graph.patch(this.url(k, id) + '/fields', c), campos);
  }
  private postItem(k: ChaveLista, campos: Campos) {
    return this.gravar(c => this.graph.post<{ id: string }>(this.url(k), { fields: c }), campos);
  }

  private itens(k: ChaveLista) {
    return this.graph.todos<ItemLista>(`/sites/${this.siteId}/lists/${this.ids[k]}/items?$expand=fields&$top=500`);
  }
  private url(k: ChaveLista, id?: string) {
    return `/sites/${this.siteId}/lists/${this.ids[k]}/items` + (id ? `/${id}` : '');
  }

  async carregar(): Promise<Dados> {
    await this.preparar();
    this.gatesDuplicados = 0;
    const [P, A, R, Pe, G, D] = await Promise.all(
      (['projetos', 'atividades', 'riscos', 'pendencias', 'gates', 'decisoes'] as ChaveLista[]).map(k => this.itens(k))
    );
    const tecnicosItens = this.idTecnicos
      ? await this.graph.todos<ItemLista>(`/sites/${this.siteId}/lists/${this.idTecnicos}/items?$expand=fields&$top=500`) : [];
    const tecnicos: Tecnico[] = tecnicosItens.map(it => ({
      _id: it.id, nome: txt(it.fields.Title), email: txt(it.fields.Email).trim(), funcao: txt(it.fields.Funcao) || 'Técnico',
      ativo: it.fields.Ativo === undefined ? true : !!it.fields.Ativo
    })).filter(t => t.nome);
    const d: Dados = { referencia: this.hoje(), projetos: [], atividades: {}, riscos: {}, pendencias: {}, decisoes: {}, documentos: {}, tecnicos };
    const codigoPorId: Record<string, string> = {};

    for (const it of P) {
      const f = it.fields, cod = txt(f.Codigo);
      codigoPorId[it.id] = cod;
      d.projetos.push({
        _id: it.id, codigo: cod, nome: txt(f.Title), cliente: txt(f.Cliente), tipo: normalizarTipo(txt(f.TipoProjeto)),
        fase: (txt(f.Fase) || 'Iniciação') as Fase, farol: (txt(f.Farol) || 'Verde') as Projeto['farol'],
        situacaoCadastro: (txt(f.Situacao) || 'Rascunho') as Projeto['situacaoCadastro'],
        gerente: txt(f.Gerente), arquiteto: txt(f.Arquiteto), patrocinador: txt(f.Patrocinador), contrato: txt(f.Contrato),
        inicio: isoDeDataHora(f.DataInicio as string), terminoBaseline: isoDeDataHora(f.DataTerminoBaseline as string),
        terminoPrevisto: isoDeDataHora(f.DataTerminoPrevista as string), objetivo: txt(f.Objetivo),
        escopoIncluido: linhas(txt(f.EscopoIncluido)), escopoExcluido: linhas(txt(f.EscopoExcluido)),
        premissas: linhas(txt(f.Premissas)), dependencias: linhas(txt(f.Dependencias)), restricoes: linhas(txt(f.Restricoes)),
        numeros: null,
        equipe: linhas(txt(f.Equipe)).map(l => {
          const [nome = '', funcao = '', empresa = '', email = ''] = l.split('|').map(x => x.trim());
          return { nome, funcao, empresa, email };
        }),
        fases: []
      });
      d.atividades[cod] = []; d.riscos[cod] = []; d.pendencias[cod] = []; d.decisoes[cod] = [];
    }
    const projetoDe = (f: Campos) => codigoPorId[txt(f.ProjetoLookupId)];

    for (const it of A) {
      const f = it.fields, c = projetoDe(f); if (!c) continue;
      d.atividades[c].push({
        _id: it.id, codigo: txt(f.Codigo), nome: txt(f.Title), fase: (txt(f.Fase) || 'Execução') as Fase, equipe: txt(f.Equipe),
        duracao: num(f.Duracao), descricao: txt(f.Descricao), marco: !!f.Marco,
        inicio: isoDeDataHora(f.DataInicio as string), termino: isoDeDataHora(f.DataTermino as string),
        baselineInicio: isoDeDataHora(f.DataBaselineInicio as string), baselineTermino: isoDeDataHora(f.DataBaselineTermino as string),
        status: (txt(f.Status) || 'Planejado') as Atividade['status'], percentual: num(f.Percentual),
        pai: txt(f.AtividadePai), observacao: txt(f.Observacao),
        reuniaoUrl: txt(f.ReuniaoTeams) || undefined, reuniaoInicio: txt(f.ReuniaoInicio) || undefined, reuniaoId: txt(f.ReuniaoId) || undefined, reuniaoTipo: txt(f.ReuniaoTipo) || undefined,
        responsavel: txt(f.ResponsavelEmail) || undefined, dataReal: isoDeDataHora(f.DataReal as string) || undefined,
        dependeRdm: !!f.DependeRDM, numeroRdm: txt(f.NumeroRDM) || undefined, impedimento: !!f.Impedimento,
        causaAtraso: txt(f.CausaAtraso) || undefined, horasRealizadas: f.HorasRealizadas == null ? undefined : num(f.HorasRealizadas),
        dataUltimaAtualizacao: isoDeDataHora(f.DataUltimaAtualizacao as string) || undefined, atualizadoPor: txt(f.AtualizadoPor) || undefined
      });
    }
    for (const it of R) {
      const f = it.fields, c = projetoDe(f); if (!c) continue;
      d.riscos[c].push({
        _id: it.id, codigo: txt(f.Codigo), descricao: txt(f.Title), impactoProjeto: txt(f.ImpactoProjeto), cenarios: txt(f.Cenarios),
        probabilidade: (txt(f.Probabilidade) || 'Médio') as Risco['probabilidade'], impacto: (txt(f.Impacto) || 'Médio') as Risco['impacto'],
        mitigacao: txt(f.Mitigacao), contingencia: txt(f.Contingencia), responsavel: txt(f.Responsavel),
        situacao: (txt(f.Situacao) || 'Aberto') as Risco['situacao']
      });
    }
    for (const it of Pe) {
      const f = it.fields, c = projetoDe(f); if (!c) continue;
      d.pendencias[c].push({
        _id: it.id, codigo: txt(f.Codigo), pergunta: txt(f.Title), detalhe: txt(f.Detalhe), impacto: txt(f.Impacto),
        situacao: (txt(f.Situacao) || 'Aberta') as Pendencia['situacao'], resposta: txt(f.Resposta)
      });
    }
    for (const it of D) {
      const f = it.fields, c = projetoDe(f); if (!c) continue;
      d.decisoes[c].push({ _id: it.id, codigo: txt(f.Codigo), decisao: txt(f.Title), descricao: txt(f.Descricao), justificativa: txt(f.Justificativa), impacto: txt(f.Impacto) });
    }
    for (const it of G) {
      const f = it.fields, p = d.projetos.find(x => x.codigo === projetoDe(f)); if (!p) continue;
      const fase = txt(f.Fase) as Fase, padrao = GATE_DA_FASE[fase];
      const titulo = txt(f.Title);
      p.fases.push({
        _id: it.id, fase,
        // a coluna Gate pode estar vazia em sites criados pela versão antiga do script
        gate: txt(f.Gate) || padrao?.gate || '',
        nome: !titulo || /^G\d$/.test(titulo) ? (padrao?.nome || titulo) : titulo,
        situacao: (txt(f.Situacao) || 'Pendente') as Gate['situacao'], data: isoDeDataHora(f.DataPrevista as string), info: txt(f.Info),
        aprovadoPor: txt(f.AprovadoPor), dataAprovacao: isoDeDataHora(f.DataAprovacao as string), parecer: txt(f.Parecer)
      });
    }
    // gates duplicados no mesmo projeto: fica o mais avançado (Aprovado > Aguardando > Pendente) e, no empate, o mais antigo
    const peso: Record<string, number> = { 'Aprovado': 3, 'Aguardando aprovação': 2, 'Pendente': 1 };
    for (const p of d.projetos) {
      const unicos = new Map<string, Gate>();
      for (const g of p.fases) {
        const chave = g.gate || GATE_DA_FASE[g.fase]?.gate || g.fase, atual = unicos.get(chave);
        if (!atual || (peso[g.situacao] || 0) > (peso[atual.situacao] || 0) ||
            ((peso[g.situacao] || 0) === (peso[atual.situacao] || 0) && Number(g._id) < Number(atual._id))) unicos.set(chave, g);
      }
      const mantidos = new Set(Array.from(unicos.values()));
      p.gatesRepetidos = p.fases.filter(g => !mantidos.has(g) && g._id).map(g => g._id!);
      this.gatesDuplicados += p.gatesRepetidos.length;
      p.fases = Array.from(unicos.values()).sort((a, b) => a.gate.localeCompare(b.gate));
    }
    const ordem = (a: { codigo: string }, b: { codigo: string }) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true });
    Object.values(d.pendencias).forEach(l => l.sort(ordem));
    Object.values(d.decisoes).forEach(l => l.sort(ordem));
    return d;
  }

  /* ------------------------------------------------------------ gravação */

  async salvarAtividade(_cod: string, atv: Atividade, campos: Partial<Atividade>) {
    await this.patchItem('atividades', atv._id, paraColunas(campos, COLUNAS_ATIVIDADE));
  }
  async criarAtividade(p: Projeto, a: Atividade): Promise<Atividade> {
    const item = await this.postItem('atividades', { ...paraColunas(a as unknown as Campos, COLUNAS_ATIVIDADE), ProjetoLookupId: Number(p._id) });
    return { ...a, _id: item.id };
  }
  async excluirAtividade(_cod: string, a: Atividade) {
    await this.graph.excluir(this.url('atividades', a._id));
  }
  async criarRisco(p: Projeto, r: Risco): Promise<Risco> {
    const item = await this.postItem('riscos', {
      Title: r.descricao, ProjetoLookupId: Number(p._id), Codigo: r.codigo, ImpactoProjeto: r.impactoProjeto, Probabilidade: r.probabilidade,
      Impacto: r.impacto, Mitigacao: r.mitigacao, Contingencia: r.contingencia, Responsavel: r.responsavel, Situacao: r.situacao
    });
    return { ...r, _id: item.id };
  }
  /** Procura de novo a lista do histórico (o script pode ter rodado com o portal já aberto). */
  private procuraHistorico = 0;
  private async listaHistorico(): Promise<string> {
    await this.preparar();
    if (!this.idHistorico && Date.now() - this.procuraHistorico > 30000) {
      this.procuraHistorico = Date.now();
      const listas = await this.graph.todos<{ id: string; displayName: string }>(`/sites/${this.siteId}/lists?$select=id,displayName`);
      this.idHistorico = listas.find(x => x.displayName === 'Portal Historico')?.id || '';
    }
    if (!this.idHistorico) throw new Error('A lista "Portal Historico" não existe no site. Rode o script provisionar-portal.ps1 (sem -Piloto)');
    return this.idHistorico;
  }

  /** Histórico: lista "Portal Historico" (o script cria). Erros sobem para o portal avisar e guardar o registro. */
  async registrar(r: RegistroHistorico) {
    const id = await this.listaHistorico();
    try {
      await this.graph.post(`/sites/${this.siteId}/lists/${id}/items`, { fields: {
        Title: r.descricao.slice(0, 250), Detalhe: r.descricao, ProjetoCodigo: r.projeto, TipoMudanca: r.tipo, Acao: r.acao, Usuario: r.usuario,
        Quando: r.quando.replace(/\.\d{3}Z$/, 'Z')
      } });
    } catch (e) {
      const msg = (e as Error).message;
      // coluna faltando: diz qual é
      const campo = /Field '([^']+)' is not recognized/i.exec(msg)?.[1];
      throw new Error(campo ? `a lista Portal Historico não tem a coluna "${campo}". Rode o script provisionar-portal.ps1 (sem -Piloto)` : msg);
    }
  }
  async historico(cod: string): Promise<RegistroHistorico[]> {
    await this.listaHistorico();
    const filtro = encodeURIComponent(`fields/ProjetoCodigo eq '${cod.replace(/'/g, "''")}'`);
    const itens = await this.graph.todos<ItemLista>(`/sites/${this.siteId}/lists/${this.idHistorico}/items?$expand=fields&$top=500&$filter=${filtro}`,
      { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' });
    return itens.map(it => ({
      quando: txt(it.fields.Quando), usuario: txt(it.fields.Usuario), projeto: txt(it.fields.ProjetoCodigo),
      tipo: txt(it.fields.TipoMudanca) || txt(it.fields.Tipo), acao: txt(it.fields.Acao), descricao: txt(it.fields.Detalhe) || txt(it.fields.Title)
    })).sort((a, b) => b.quando.localeCompare(a.quando));
  }
  async excluirArquivo(_cod: string, _pasta: string, arquivo: Arquivo) {
    await this.preparar();
    if (!arquivo.id) throw new Error('Arquivo sem identificador; recarregue a aba Documentos.');
    await this.graph.excluir(`/drives/${this.driveId}/items/${arquivo.id}`);
  }
  async excluirRisco(_cod: string, r: Risco) { await this.graph.excluir(this.url('riscos', r._id)); }
  async criarPendencia(p: Projeto, x: Pendencia): Promise<Pendencia> {
    const item = await this.postItem('pendencias', {
      Title: x.pergunta, ProjetoLookupId: Number(p._id), Codigo: x.codigo, Detalhe: x.detalhe, Impacto: x.impacto, Situacao: x.situacao, Resposta: x.resposta || ''
    });
    return { ...x, _id: item.id };
  }
  async excluirPendencia(_cod: string, x: Pendencia) { await this.graph.excluir(this.url('pendencias', x._id)); }

  async pastasSemProjeto(codigos: string[]) {
    await this.preparar();
    const itens = await this.graph.todos<ItemDrive>(`/drives/${this.driveId}/root/children?$select=name,webUrl,folder`);
    const existentes = new Set(codigos.map(c => c.toLowerCase()));
    return itens.filter(x => x.folder && x.name !== 'Forms' && !existentes.has(x.name.toLowerCase())).map(x => ({ nome: x.name, url: x.webUrl }));
  }
  async excluirPasta(nome: string) {
    await this.preparar();
    await this.graph.excluir(`/drives/${this.driveId}/root:/${encodeURIComponent(nome)}`);
  }
  async salvarRisco(_cod: string, r: Risco, campos: Partial<Risco>) {
    await this.graph.patch(this.url('riscos', r._id) + '/fields',
      paraColunas(campos, { situacao: 'Situacao', mitigacao: 'Mitigacao', responsavel: 'Responsavel', probabilidade: 'Probabilidade', impacto: 'Impacto' }));
  }
  async salvarPendencia(_cod: string, p: Pendencia, campos: Partial<Pendencia>) {
    await this.graph.patch(this.url('pendencias', p._id) + '/fields', paraColunas(campos, { situacao: 'Situacao', resposta: 'Resposta' }));
  }
  async salvarProjeto(p: Projeto, campos: Partial<Projeto>) {
    await this.patchItem('projetos', p._id, paraColunas(campos, COLUNAS_PROJETO));
  }
  async salvarGate(p: Projeto, g: Gate, campos: Partial<Gate>) {
    // gate que ainda não existe na lista é criado na primeira gravação
    if (!g._id) { await this.criarGate(p, { ...g, ...campos }); return; }
    // grava também o código, para consertar gates criados sem ele
    await this.patchItem('gates', g._id, paraColunas({ gate: g.gate, ...campos }, COLUNAS_GATE));
  }
  async excluirGates(ids: string[]) {
    for (const id of ids) await this.graph.excluir(this.url('gates', id));
  }
  async criarGate(p: Projeto, g: Gate): Promise<Gate> {
    const item = await this.postItem('gates', { ...paraColunas(g as unknown as Campos, COLUNAS_GATE), Fase: g.fase, ProjetoLookupId: Number(p._id) });
    return { ...g, _id: item.id };
  }

  async criarProjeto({ projeto: p, atividades, riscos }: NovoProjeto) {
    await this.preparar();
    const item = await this.postItem('projetos', {
        Title: p.nome, Codigo: p.codigo, Cliente: p.cliente, TipoProjeto: p.tipo, Fase: p.fase, Farol: p.farol, Situacao: p.situacaoCadastro,
        Gerente: p.gerente, Arquiteto: p.arquiteto, Patrocinador: p.patrocinador, Contrato: p.contrato,
        DataInicio: dataSp(p.inicio), DataTerminoBaseline: dataSp(p.terminoBaseline), DataTerminoPrevista: dataSp(p.terminoPrevisto),
        Objetivo: p.objetivo, EscopoIncluido: p.escopoIncluido.join('\n'), EscopoExcluido: p.escopoExcluido.join('\n'),
        Premissas: p.premissas.join('\n'), Dependencias: p.dependencias.join('\n'), Restricoes: p.restricoes.join('\n'),
        Equipe: p.equipe.map(e => [e.nome, e.funcao, e.empresa, e.email].join(' | ')).join('\n')
    });
    const pid = Number(item.id);
    for (const a of atividades) {
      await this.postItem('atividades', { ...paraColunas(a as unknown as Campos, COLUNAS_ATIVIDADE), ProjetoLookupId: pid });
    }
    for (const r of riscos) {
      await this.postItem('riscos', { Title: r.descricao, ProjetoLookupId: pid, Codigo: r.codigo, Probabilidade: r.probabilidade, Impacto: r.impacto, Mitigacao: r.mitigacao, Responsavel: r.responsavel, Situacao: 'Aberto' });
    }
    for (const g of p.fases.filter(x => x.gate)) {
      await this.postItem('gates', { ...paraColunas(g as unknown as Campos, COLUNAS_GATE), ProjetoLookupId: pid, Fase: g.fase });
    }
    await this.criarPasta('', p.codigo);
    for (const pasta of PASTAS) await this.criarPasta(encodeURIComponent(p.codigo), pasta);
  }

  async excluirProjeto(d: Dados, p: Projeto, { documentos }: { documentos: boolean }) {
    await this.preparar();
    const c = p.codigo;
    const filhos: [ChaveLista, (string | undefined)[]][] = [
      ['gates', [...p.fases.map(g => g._id), ...(p.gatesRepetidos || [])]],
      ['atividades', (d.atividades[c] || []).map(a => a._id)],
      ['riscos', (d.riscos[c] || []).map(r => r._id)],
      ['pendencias', (d.pendencias[c] || []).map(x => x._id)],
      ['decisoes', (d.decisoes[c] || []).map(x => x._id)]
    ];
    for (const [lista, ids] of filhos) {
      for (const id of ids) {
        if (!id) continue;
        try { await this.graph.excluir(this.url(lista, id)); }
        catch (e) { if (!/404/.test((e as Error).message)) throw e; }   // já apagado: segue
      }
    }
    await this.graph.excluir(this.url('projetos', p._id));
    if (documentos) {
      // vai para a lixeira do site (pode ser restaurada por 93 dias)
      try { await this.graph.excluir(`/drives/${this.driveId}/root:/${encodeURIComponent(c)}`); }
      catch (e) { if (!/404/.test((e as Error).message)) throw e; }
    }
  }

  /* ------------------------------------------------------------ documentos */

  private async criarPasta(pai: string, nome: string) {
    const alvo = pai ? `/drives/${this.driveId}/root:/${pai}:/children` : `/drives/${this.driveId}/root/children`;
    try {
      await this.graph.post(alvo, { name: nome, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' });
    } catch (e) {
      if (!/409|nameAlreadyExists|already exists/i.test((e as Error).message)) throw e;
    }
  }

  /**
   * Pastas do projeto: 1 chamada para ver as subpastas (com a quantidade de arquivos de cada uma)
   * e só depois lê as pastas que têm arquivos — em vez de 2 chamadas por pasta.
   */
  async documentos(cod: string): Promise<PastaDocumentos[]> {
    await this.preparar();
    const base = `/drives/${this.driveId}/root:/${encodeURIComponent(cod)}`;
    let subpastas: (ItemDrive & { id: string; folder?: { childCount?: number } })[] = [];
    try { subpastas = await this.graph.todos(`${base}:/children?$select=id,name,webUrl,folder`); } catch { /* pasta do projeto ainda não existe */ }
    const pastas: PastaDocumentos[] = [];
    for (const p of PASTAS) {
      const sp = subpastas.find(x => x.folder && x.name === p);
      let arquivos: PastaDocumentos['arquivos'] = [];
      if (sp && (sp.folder?.childCount ?? 1) > 0) {
        try {
          const filhos = await this.graph.todos<ItemDrive>(`/drives/${this.driveId}/items/${sp.id}/children?$select=id,name,webUrl,lastModifiedDateTime,lastModifiedBy,file`);
          arquivos = filhos.filter(x => x.file).map(x => ({
            id: x.id, nome: x.name, url: x.webUrl, modificado: iso(new Date(x.lastModifiedDateTime)), autor: x.lastModifiedBy?.user?.displayName || ''
          }));
        } catch { /* sem acesso à pasta */ }
      }
      pastas.push({ pasta: p, url: sp?.webUrl || '', arquivos });
    }
    return pastas;
  }


  async enviarArquivo(cod: string, pasta: string, arquivo: File) {
    await this.preparar();
    const caminho = `/drives/${this.driveId}/root:/${encodeURIComponent(cod)}/${encodeURIComponent(pasta)}/${encodeURIComponent(arquivo.name)}`;
    await this.graph.enviar(caminho, arquivo);
  }

  /**
   * Envia pelo Microsoft Graph.
   * - Com config.emailRemetente: sai COMO a caixa compartilhada (/users/{caixa}/sendMail, permissão Mail.Send.Shared;
   *   quem está logado precisa ter "Enviar como" nessa caixa no Exchange).
   * - Sem: sai pela conta logada (/me/sendMail, permissão Mail.Send).
   * Sem destinatário = a própria conta logada.
   */
  async enviarEmail(assunto: string, html: string, para?: string): Promise<string> {
    let destino = para;
    if (!destino) {
      const eu = await this.graph.get<{ mail?: string; userPrincipalName: string }>('/me?$select=mail,userPrincipalName');
      destino = eu.mail || eu.userPrincipalName;
    }
    const remetente = this.cfg.emailRemetente.trim();
    const token = await this.auth.tokenPara([remetente ? 'Mail.Send.Shared' : 'Mail.Send']);
    const endpoint = remetente ? `/users/${encodeURIComponent(remetente)}/sendMail` : '/me/sendMail';
    const r = await fetchGraph('https://graph.microsoft.com/v1.0' + endpoint, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { subject: assunto, body: { contentType: 'HTML', content: html },
        toRecipients: destino.split(/[,;]/).map(x => x.trim()).filter(Boolean).map(address => ({ emailAddress: { address } })) }, saveToSentItems: true })
    });
    if (!r.ok) {
      let msg = r.statusText, codigo = '';
      try { const j = await r.json(); msg = j?.error?.message || msg; codigo = j?.error?.code || ''; } catch { /* sem corpo */ }
      if (remetente && (r.status === 403 || /SendAs|AccessDenied/i.test(codigo + msg)))
        throw new Error(`sua conta não tem permissão "Enviar como" na caixa ${remetente}. Peça ao administrador do Exchange para incluí-la (pode levar até 1 hora para valer)`);
      if (remetente && (r.status === 404 || /ResourceNotFound|MailboxNotEnabled/i.test(codigo + msg)))
        throw new Error(`a caixa ${remetente} não foi encontrada. Confira o endereço em emailRemetente no config.js`);
      throw new Error(`envio recusado (${r.status}): ${msg}`);
    }
    return remetente ? `${destino} (enviado por ${remetente})` : destino;
  }

  /**
   * Reunião do Teams: POST /me/events com isOnlineMeeting (permissão delegada Calendars.ReadWrite).
   * O organizador é quem está logado; o Outlook envia os convites aos participantes.
   */
  private static FUSO = 'E. South America Standard Time';

  private corpoEvento(r: NovaReuniao, corpoHtml: string) {
    const fim = new Date(new Date(r.inicio + ':00').getTime() + r.duracaoMin * 60000);
    const d2 = (n: number) => String(n).padStart(2, '0');
    const fimLocal = `${fim.getFullYear()}-${d2(fim.getMonth() + 1)}-${d2(fim.getDate())}T${d2(fim.getHours())}:${d2(fim.getMinutes())}:00`;
    return {
      subject: r.titulo,
      body: { contentType: 'HTML', content: corpoHtml },
      start: { dateTime: r.inicio + ':00', timeZone: FonteSharePoint.FUSO },
      end: { dateTime: fimLocal, timeZone: FonteSharePoint.FUSO },
      attendees: r.participantes.map(address => ({ emailAddress: { address }, type: 'required' }))
    };
  }

  /** Chamada ao calendário de quem está logado (permissão delegada Calendars.ReadWrite). */
  private async calendario<T>(caminho: string, metodo: string, corpo?: unknown): Promise<T | null> {
    const token = await this.auth.tokenPara(['Calendars.ReadWrite']);
    const resp = await fetchGraph('https://graph.microsoft.com/v1.0' + caminho, {
      method: metodo,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: `outlook.timezone="${FonteSharePoint.FUSO}"` },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
    if (!resp.ok) {
      let msg = resp.statusText;
      try { const j = await resp.json(); msg = j?.error?.message || msg; } catch { /* sem corpo */ }
      if (resp.status === 403) throw new Error('o app Portal PMO ainda não tem a permissão Calendars.ReadWrite (Entra ID → Permissões de API)');
      if (resp.status === 404) throw new Error('a reunião não está no seu calendário. Só quem criou a reunião (o organizador) pode alterá-la ou cancelá-la; ela também pode ter sido cancelada no Outlook');
      throw new Error(`o Outlook recusou a operação (${resp.status}): ${msg}`);
    }
    return resp.status === 202 || resp.status === 204 ? null : await resp.json() as T;
  }

  /**
   * Reunião do Teams: POST /me/events com isOnlineMeeting. O organizador é quem está logado;
   * o Outlook envia os convites aos participantes.
   */
  async criarReuniaoTeams(r: NovaReuniao, corpoHtml: string): Promise<{ id: string; joinUrl: string }> {
    const ev = await this.calendario<{ id: string; webLink?: string; onlineMeeting?: { joinUrl?: string } }>('/me/events', 'POST', {
      ...this.corpoEvento(r, corpoHtml), isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness', allowNewTimeProposals: true
    });
    return { id: ev!.id, joinUrl: ev!.onlineMeeting?.joinUrl || ev!.webLink || '' };
  }

  /** Lê o início atual das reuniões em lote. Reuniões de outro organizador (404) são ignoradas. */
  async lerReunioes(ids: string[]): Promise<Record<string, string>> {
    const token = await this.auth.tokenSilencioso(['Calendars.ReadWrite']);
    const resultado: Record<string, string> = {};
    if (!token || !ids.length) return resultado;
    for (let i = 0; i < ids.length; i += 20) {
      const lote = ids.slice(i, i + 20);
      const resp = await fetchGraph('https://graph.microsoft.com/v1.0/$batch', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: lote.map((id, k) => ({
          id: String(k), method: 'GET', url: `/me/events/${encodeURIComponent(id)}?$select=start,isCancelled`,
          headers: { Prefer: `outlook.timezone="${FonteSharePoint.FUSO}"` }
        })) })
      });
      if (!resp.ok) continue;
      const j = await resp.json() as { responses: { id: string; status: number; body?: { start?: { dateTime: string }; isCancelled?: boolean } }[] };
      for (const r of j.responses || []) {
        const ini = r.body?.start?.dateTime;
        if (r.status === 200 && ini && !r.body?.isCancelled) resultado[lote[Number(r.id)]] = ini.slice(0, 16);
      }
    }
    return resultado;
  }

  async obterReuniaoTeams(id: string): Promise<NovaReuniao> {
    const ev = await this.calendario<{ subject: string; start: { dateTime: string }; end: { dateTime: string }; attendees: { emailAddress: { address: string } }[] }>(
      `/me/events/${encodeURIComponent(id)}?$select=subject,start,end,attendees`, 'GET');
    const ini = ev!.start.dateTime.slice(0, 16), fim = ev!.end.dateTime.slice(0, 16);
    return {
      titulo: ev!.subject, inicio: ini,
      duracaoMin: Math.max(15, Math.round((new Date(fim + ':00').getTime() - new Date(ini + ':00').getTime()) / 60000)),
      pauta: '', participantes: ev!.attendees.map(a => a.emailAddress.address.toLowerCase())
    };
  }

  async atualizarReuniaoTeams(id: string, r: NovaReuniao, corpoHtml: string): Promise<void> {
    await this.calendario(`/me/events/${encodeURIComponent(id)}`, 'PATCH', this.corpoEvento(r, corpoHtml));
  }

  async cancelarReuniaoTeams(id: string, mensagem: string): Promise<void> {
    await this.calendario(`/me/events/${encodeURIComponent(id)}/cancel`, 'POST', { comment: mensagem || 'Reunião cancelada pelo Portal PMO.' });
  }

  linkBiblioteca(cod?: string) {
    return this.driveUrl ? this.driveUrl + (cod ? '/' + encodeURIComponent(cod) : '') : '';
  }
}
