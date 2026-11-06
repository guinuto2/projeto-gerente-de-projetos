import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ARQUIVOS_LOCAIS, DESCRICAO_ARQUIVO, FABRICANTES, docParaTexto, juntarDocumentos, nomeCorreto, textoParaSecoes, tipoArquivo, urlLocal, type ArquivoWiki, type Fabricante, type Modelo, type ModeloSalvo } from '../lib/wiki';
import { usePortal } from '../state/PortalContext';
import { useToast } from '../state/ToastContext';
import { usePapel } from '../state/PapelContext';
import { Mensagem } from '../components/ui/Mensagem';

/** Tipo de cada linha do documento: tópico (•), passo (1.), subtítulo (##), Obs., NOTA ou trecho a preencher (<<< >>>). */
type Linha = { tipo: 'topico' | 'passo' | 'subtitulo' | 'obs' | 'nota' | 'pendente' | 'texto'; texto: string; num?: string };
function linha(i: string): Linha {
  if (i.startsWith('• ')) return { tipo: 'topico', texto: i.slice(2) };
  if (i.startsWith('## ')) return { tipo: 'subtitulo', texto: i.slice(3) };
  if (i.includes('<<<<<')) return { tipo: 'pendente', texto: i };
  if (/^Obs\.:/.test(i)) return { tipo: 'obs', texto: i.replace(/^Obs\.:\s*/, '') };
  if (/^NOTA\s*:/.test(i)) return { tipo: 'nota', texto: i.replace(/^NOTA\s*:\s*/, '') };
  const m = /^(\d+)\.\s+(.*)$/.exec(i);
  if (m) return { tipo: 'passo', texto: m[2], num: m[1] };
  return { tipo: 'texto', texto: i };
}

/** Normaliza para a busca: sem acentos e em minúsculas. */
const normal = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Marca o termo buscado dentro do texto (ignora acentos e maiúsculas). */
function Destaque({ texto, termo }: { texto: string; termo: string }) {
  const q = normal(termo.trim());
  if (!q) return <>{texto}</>;
  const n = normal(texto), partes: ReactNode[] = [];
  let i = 0, k = 0;
  for (let p = n.indexOf(q); p >= 0; p = n.indexOf(q, p + q.length)) {
    if (p > i) partes.push(texto.slice(i, p));
    partes.push(<mark key={k++} className="wikiMarca">{texto.slice(p, p + q.length)}</mark>);
    i = p + q.length;
  }
  partes.push(texto.slice(i));
  return <>{partes}</>;
}

/** Trechos do documento onde o termo aparece (para a lista de resultados). */
function trechos(m: Modelo, termo: string): { secao: string; texto: string }[] {
  const q = normal(termo.trim()); if (!q) return [];
  const out: { secao: string; texto: string }[] = [];
  for (const s of m.secoes) for (const i of [s.titulo, ...s.itens]) {
    const p = normal(i).indexOf(q);
    if (p < 0) continue;
    const ini = Math.max(0, p - 70), fim = Math.min(i.length, p + q.length + 110);
    out.push({ secao: s.titulo, texto: `${ini > 0 ? '…' : ''}${i.slice(ini, fim).replace(/^[•#\s]+/, '')}${fim < i.length ? '…' : ''}` });
  }
  return out;
}

/** Texto simples do modelo (para copiar). */
const comoTexto = (m: Modelo) => [m.titulo.toUpperCase(), '', ...m.secoes.flatMap(s => [s.titulo, ...s.itens.map(i => `  ${i}`), ''])].join('\n');

/** Arquivo .doc (HTML que o Word abre) com o modelo. */
function baixarWord(m: Modelo) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta charset="utf-8"><title>${esc(m.titulo)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{color:#7E181C;font-size:18pt}h2{font-size:13pt;border-bottom:1px solid #ccc;margin-top:16pt}</style></head><body>
<h1>${esc(m.titulo)}</h1><p style="color:#555">${esc(m.descricao)}</p>
${m.secoes.map(s => `<h2>${esc(s.titulo)}</h2>${s.itens.map(i => {
  const l = linha(i);
  if (l.tipo === 'topico') return `<p style="margin-left:14pt">• ${esc(l.texto)}</p>`;
  if (l.tipo === 'passo') return `<p style="margin-left:14pt"><b>${l.num}.</b> ${esc(l.texto)}</p>`;
  if (l.tipo === 'subtitulo') return `<h3 style="font-size:12pt">${esc(l.texto)}</h3>`;
  if (l.tipo === 'obs') return `<p style="background:#FFF4DB;border-left:3pt solid #E0A800;padding:4pt 6pt"><b>Obs.:</b> ${esc(l.texto)}</p>`;
  if (l.tipo === 'nota') return `<p style="background:#E8EEF7;border-left:3pt solid #2B4C7E;padding:4pt 6pt"><b>NOTA:</b> ${esc(l.texto)}</p>`;
  if (l.tipo === 'pendente') return `<p style="color:#9A2E12;font-weight:bold">${esc(l.texto)}</p>`;
  return `<p>${esc(l.texto)}</p>`;
}).join('')}`).join('')}
<p style="color:#888;font-size:9pt;margin-top:24pt">Central Systech</p></body></html>`;
  // acentos como entidades (&#231;): o Word lê certo qualquer que seja a codificação que ele escolher para o arquivo
  const seguro = html.replace(/[^\x00-\x7F]/gu, c => `&#${c.codePointAt(0)};`);
  const url = URL.createObjectURL(new Blob([seguro], { type: 'application/msword' }));
  const a = document.createElement('a'); a.href = url; a.download = `${m.titulo.replace(/\s*[—–]\s*/g, ' - ').replace(/[^\wÀ-ú ()-]/g, '').replace(/\s+/g, ' ').trim()}.doc`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Wiki do técnico: documentos modelo e sites importantes dos fabricantes. */
export function WikiPage() {
  const toast = useToast();
  const { papel } = usePapel();
  const [params, setParams] = useSearchParams();
  const { fonte } = usePortal();
  const [arquivos, setArquivos] = useState<ArquivoWiki[]>(ARQUIVOS_LOCAIS);
  const [noSharePoint, setNoSharePoint] = useState(false);
  useEffect(() => {
    if (!fonte.arquivosWiki) return;
    fonte.arquivosWiki().then(l => {
      if (!l) return;   // biblioteca ainda não criada: ficam os arquivos que vêm com o portal
      setNoSharePoint(true);
      setArquivos(l.map(a => { const nome = nomeCorreto(a.nome); return { ...a, nome, descricao: DESCRICAO_ARQUIVO[nome] || 'Arquivo da pasta da equipe técnica.', local: false }; }));
    }).catch(() => undefined);
  }, [fonte]);
  const [salvos, setSalvos] = useState<ModeloSalvo[] | null | undefined>(undefined);
  const carregarDocs = () => { (fonte.wikiDocs ? fonte.wikiDocs() : Promise.resolve(null)).then(setSalvos).catch(() => setSalvos(null)); };
  useEffect(carregarDocs, [fonte]); // eslint-disable-line react-hooks/exhaustive-deps
  const docs = useMemo(() => juntarDocumentos(salvos || null), [salvos]);
  /** edição: o técnico edita os documentos (precisa da lista "Portal Wiki" no modo conectado) */
  const podeEditar = papel === 'Técnico';
  const gravavel = !!fonte.salvarWikiDoc && salvos !== null;
  const [editando, setEditando] = useState<ModeloSalvo | 'novo' | null>(null);
  const [busca, setBusca] = useState('');
  /** com termo digitado, a área principal mostra os resultados; ao abrir um, mostra o documento (com o termo marcado) */
  const [emResultado, setEmResultado] = useState(false);
  const sel = params.get('item') || `modelo:${docs[0]?.id || ''}`;
  const [tipo, id] = sel.split(':');
  const modelo = tipo === 'modelo' ? docs.find(m => m.id === id) : undefined;
  const fab = tipo === 'fab' ? FABRICANTES.find(f => f.id === id) : undefined;
  const arquivo = tipo === 'arq' ? arquivos.find(a => a.nome === decodeURIComponent(sel.slice(4))) : undefined;
  const abrir = (v: string) => setParams({ item: v }, { replace: true });
  const q = normal(busca.trim());
  const confere = (...t: string[]) => !q || normal(t.join(' ')).includes(q);
  const modelos = useMemo(() => docs.filter(m => confere(m.titulo, m.descricao, ...m.secoes.map(s => `${s.titulo} ${s.itens.join(' ')}`))), [q, docs]); // eslint-disable-line react-hooks/exhaustive-deps
  const arquivosFiltrados = useMemo(() => arquivos.filter(a => confere(a.nome, a.descricao, tipoArquivo(a.nome).rotulo)), [q, arquivos]); // eslint-disable-line react-hooks/exhaustive-deps
  const fabricantes = useMemo(() => FABRICANTES.filter(f => confere(f.nome, f.sigla, f.descricao, ...f.dicas, ...f.sites.map(s => `${s.titulo} ${s.descricao}`))), [q]); // eslint-disable-line react-hooks/exhaustive-deps

  if (papel !== 'Técnico') return (
    <main className="main"><Mensagem tipo="info">A Wiki é exclusiva do perfil Técnico.</Mensagem></main>
  );
  return (
    <main className="main">
      <div>
        <div className="migalha"><Link to="/">Central Systech</Link> › Wiki</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Wiki</h1>
      </div>
      <div className="wiki">
        <aside className="card wikiLado" aria-label="Conteúdo da Wiki">
          <input className="ctl" type="search" placeholder="Buscar na Wiki" value={busca} onChange={e => { setBusca(e.target.value); setEmResultado(false); }} aria-label="Buscar na Wiki" />
          <div className="wikiGrupo wikiGrupoAcao">Documentos
            {podeEditar && <button type="button" className="linkBtn" onClick={() => { setEditando('novo'); setEmResultado(true); }} title="Criar um documento">+ Novo</button>}
          </div>
          {modelos.map(m => (
            <button key={m.id} type="button" className={`wikiItem ${sel === `modelo:${m.id}` ? 'on' : ''}`} onClick={() => { setEmResultado(true); abrir(`modelo:${m.id}`); }}>
              <span className="wikiDoc" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
              </span>{m.titulo}
            </button>
          ))}
          {!modelos.length && <p className="sub" style={{ padding: '2px 8px' }}>Nenhum documento encontrado.</p>}
          <div className="wikiGrupo">Fabricantes</div>
          {fabricantes.map(f => (
            <button key={f.id} type="button" className={`wikiItem ${sel === `fab:${f.id}` ? 'on' : ''}`} onClick={() => { setEmResultado(true); abrir(`fab:${f.id}`); }}>
              <span className="wikiSigla" style={{ background: f.cor }} aria-hidden="true">{f.sigla}</span>{f.nome}
            </button>
          ))}
          {!fabricantes.length && <p className="sub" style={{ padding: '2px 8px' }}>Nenhum fabricante encontrado.</p>}
          <div className="wikiGrupo">Arquivos</div>
          {arquivosFiltrados.map(a => {
            const t = tipoArquivo(a.nome);
            return (
              <button key={a.nome} type="button" className={`wikiItem ${sel === `arq:${encodeURIComponent(a.nome)}` ? 'on' : ''}`} title={a.nome}
                onClick={() => { setEmResultado(true); abrir(`arq:${encodeURIComponent(a.nome)}`); }}>
                <span className="wikiExt" style={{ background: t.cor }} aria-hidden="true">{t.rotulo}</span>
                <span className="wikiItemNome">{a.nome.replace(/\.[^.]+$/, '')}</span>
              </button>
            );
          })}
          {!arquivosFiltrados.length && <p className="sub" style={{ padding: '2px 8px' }}>Nenhum arquivo encontrado.</p>}
        </aside>

        <section className="card wikiConteudo">
          {q && !emResultado ? (
            <div>
              <div className="wikiTipo">Resultados da busca</div>
              <h2 className="h2" style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 12px' }}>“{busca.trim()}”</h2>
              {!modelos.length && !fabricantes.length && !arquivosFiltrados.length && <p className="sub">Nada encontrado nos documentos, fabricantes e arquivos.</p>}
              {modelos.map(m => {
                const t = trechos(m, busca);
                return (
                  <button key={m.id} type="button" className="wikiResultado" onClick={() => { setEmResultado(true); abrir(`modelo:${m.id}`); }}>
                    <span className="wikiResTit"><Destaque texto={m.titulo} termo={busca} /> <span className="sub">· {t.length} trecho(s)</span></span>
                    {t.slice(0, 3).map((x, k) => <span key={k} className="wikiResTrecho"><b>{x.secao}:</b> <Destaque texto={x.texto} termo={busca} /></span>)}
                  </button>
                );
              })}
              {arquivosFiltrados.map(a => (
                <button key={a.nome} type="button" className="wikiResultado" onClick={() => { setEmResultado(true); abrir(`arq:${encodeURIComponent(a.nome)}`); }}>
                  <span className="wikiResTit"><Destaque texto={a.nome} termo={busca} /> <span className="sub">· arquivo {tipoArquivo(a.nome).rotulo}</span></span>
                  <span className="wikiResTrecho"><Destaque texto={a.descricao} termo={busca} /></span>
                </button>
              ))}
              {fabricantes.map(f => (
                <button key={f.id} type="button" className="wikiResultado" onClick={() => { setEmResultado(true); abrir(`fab:${f.id}`); }}>
                  <span className="wikiResTit">{f.nome} <span className="sub">· fabricante</span></span>
                  <span className="wikiResTrecho">{f.descricao}</span>
                </button>
              ))}
            </div>
          ) : (<>
          {q && <button type="button" className="linkBtn" style={{ alignSelf: 'flex-start' }} onClick={() => setEmResultado(false)}>← Voltar aos resultados</button>}
          {editando && (
            <EditorDoc inicial={editando === 'novo' ? null : editando} gravavel={gravavel} piloto={fonte.modo === 'piloto'}
              aoCancelar={() => setEditando(null)}
              aoSalvar={async d => {
                await fonte.salvarWikiDoc!(d); toast(d.excluido ? 'Documento excluído.' : 'Documento salvo.');
                setEditando(null); carregarDocs(); if (!d.excluido) abrir(`modelo:${d.id}`); else abrir(`modelo:${docs.find(x => x.id !== d.id)?.id || ''}`);
              }} />
          )}
          {!editando && modelo && <VerModelo m={modelo} aoEditar={podeEditar ? () => setEditando(modelo) : undefined} termo={q ? busca : ''} aoCopiar={() => navigator.clipboard?.writeText(comoTexto(modelo)).then(() => toast('Modelo copiado.')).catch(() => toast('Não foi possível copiar.'))} />}
          {!editando && fab && <VerFabricante f={fab} />}
          {!editando && arquivo && <VerArquivo a={arquivo} noSharePoint={noSharePoint} />}
          {!editando && !modelo && !fab && !arquivo && <p className="sub">Escolha um item na barra lateral.</p>}
          </>)}
        </section>
      </div>
    </main>
  );
}

function VerModelo({ m, aoCopiar, termo = '', aoEditar, previa = false }: { m: ModeloSalvo; aoCopiar: () => void; termo?: string; aoEditar?: () => void; previa?: boolean }) {
  const D = ({ t }: { t: string }) => <Destaque texto={t} termo={termo} />;
  return (
    <>
      <div className="wikiTopo">
        <div>
          <div className="wikiTipo">Documento</div>
          <h2 className="h2" style={{ fontSize: 24, fontWeight: 700 }}>{m.titulo}</h2>
          <p className="sub" style={{ marginTop: 4 }}>{m.descricao}</p>
          {m.atualizado && <p className="sub" style={{ marginTop: 2, fontSize: 11.5 }}>Editado em {new Date(m.atualizado).toLocaleDateString('pt-BR')}{m.atualizadoPor ? ` por ${m.atualizadoPor}` : ''}</p>}
        </div>
        {!previa && <div className="linha" style={{ flexShrink: 0 }}>
          {aoEditar && <button type="button" className="btn pq" onClick={aoEditar}>Editar</button>}
          <button type="button" className="btn pq" onClick={aoCopiar}>Copiar texto</button>
          <button type="button" className="btn pq pri" onClick={() => baixarWord(m)}>Baixar para Word</button>
        </div>}
      </div>
      <div className="wikiFolha">
        {m.secoes.map(s => (
          <div key={s.titulo} className="wikiSecao">
            <h3><D t={s.titulo} /></h3>
            {s.itens.map((i, k) => {
              const l = linha(i);
              if (l.tipo === 'topico') return <p key={k} className="wikiTopico"><D t={l.texto} /></p>;
              if (l.tipo === 'passo') return <p key={k} className="wikiPasso"><span className="wikiNum">{l.num}.</span><span><D t={l.texto} /></span></p>;
              if (l.tipo === 'subtitulo') return <h4 key={k} className="wikiSub"><D t={l.texto} /></h4>;
              if (l.tipo === 'obs') return <p key={k} className="wikiObs"><b>Obs.:</b> <D t={l.texto} /></p>;
              if (l.tipo === 'nota') return <p key={k} className="wikiNota"><b>NOTA:</b> <D t={l.texto} /></p>;
              if (l.tipo === 'pendente') return <p key={k} className="wikiPendente"><D t={l.texto} /></p>;
              return <p key={k}><D t={l.texto} /></p>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function VerFabricante({ f }: { f: Fabricante }) {
  return (
    <>
      <div className="wikiTopo">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="wikiSigla grande" style={{ background: f.cor }} aria-hidden="true">{f.sigla}</span>
          <div>
            <div className="wikiTipo">Fabricante</div>
            <h2 className="h2" style={{ fontSize: 24, fontWeight: 700 }}>{f.nome}</h2>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--medio)' }}>{f.descricao}</p>
      <h3 className="h3" style={{ fontSize: 15 }}>Sites importantes</h3>
      <div className="wikiSites">
        {f.sites.map(s => (
          <a key={s.url} className="wikiSite" href={s.url} target="_blank" rel="noopener noreferrer">
            <span className="wikiSiteTit">{s.titulo} <span aria-hidden="true">↗</span></span>
            <span className="sub">{s.descricao}</span>
            <span className="wikiUrl">{s.url.replace('https://', '')}</span>
          </a>
        ))}
      </div>
      {f.dicas.length > 0 && (
        <div className="wikiDicas">
          <b>Dicas</b>
          <ul className="ul">{f.dicas.map(d => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
      <p className="sub" style={{ fontSize: 12 }}>Os links desta página são fictícios (exemplo) e serão trocados pelos endereços oficiais.</p>
    </>
  );
}

const tamanhoLegivel = (b?: number) => (b === undefined ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`);

/** Painel de um arquivo da pasta: descrição, tamanho, baixar (e prévia do texto, se for .txt). */
function VerArquivo({ a, noSharePoint }: { a: ArquivoWiki; noSharePoint: boolean }) {
  const { fonte } = usePortal();
  const toast = useToast();
  const t = tipoArquivo(a.nome);
  const [baixando, setBaixando] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);
  const ehTexto = /\.txt$/i.test(a.nome);
  const conteudo = async (): Promise<Blob> => {
    if (!a.local && a.id && fonte.baixarArquivoWiki) return fonte.baixarArquivoWiki(a.id);
    const r = await fetch(urlLocal(a.arquivo || a.nome)); if (!r.ok) throw new Error('Arquivo não encontrado.'); return r.blob();
  };
  useEffect(() => {
    setTexto(null);
    if (ehTexto) conteudo().then(b => b.text()).then(setTexto).catch(() => setTexto(''));
  }, [a.nome]); // eslint-disable-line react-hooks/exhaustive-deps
  const baixar = async () => {
    setBaixando(true);
    try {
      const url = URL.createObjectURL(await conteudo());
      const el = document.createElement('a'); el.href = url; el.download = a.nome; el.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { toast((e as Error).message); }
    finally { setBaixando(false); }
  };
  return (
    <>
      <div className="wikiTopo">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
          <span className="wikiExt grande" style={{ background: t.cor }} aria-hidden="true">{t.rotulo}</span>
          <div style={{ minWidth: 0 }}>
            <div className="wikiTipo">Arquivo</div>
            <h2 className="h2" style={{ fontSize: 22, fontWeight: 700, overflowWrap: 'anywhere' }}>{a.nome}</h2>
            <div className="sub" style={{ marginTop: 2 }}>{[t.rotulo, tamanhoLegivel(a.tamanho), a.modificado ? `atualizado em ${new Date(a.modificado).toLocaleDateString('pt-BR')}` : ''].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <div className="linha" style={{ flexShrink: 0 }}>
          {a.url && <a className="btn pq" href={a.url} target="_blank" rel="noopener noreferrer">Abrir no SharePoint ↗</a>}
          <button type="button" className="btn pq pri" disabled={baixando} onClick={baixar}>{baixando ? 'Baixando…' : 'Baixar'}</button>
        </div>
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--medio)' }}>{a.descricao}</p>
      {ehTexto && (texto === null ? <p className="sub">Carregando o conteúdo…</p> : texto && <pre className="wikiTexto">{texto}</pre>)}
      <p className="sub" style={{ fontSize: 12 }}>{noSharePoint ? 'Arquivo da biblioteca "Wiki Tecnicos" do SharePoint.' : 'Cópia do arquivo que vem junto com o portal.'}</p>
    </>
  );
}

/** Editor de documento da Wiki: título, descrição e texto com marcações simples, com prévia ao vivo. */
function EditorDoc({ inicial, gravavel, piloto, aoSalvar, aoCancelar }: { inicial: ModeloSalvo | null; gravavel: boolean; piloto: boolean; aoSalvar: (d: ModeloSalvo) => Promise<void>; aoCancelar: () => void }) {
  const [titulo, setTitulo] = useState(inicial?.titulo || '');
  const [descricao, setDescricao] = useState(inicial?.descricao || '');
  const [texto, setTexto] = useState(inicial ? docParaTexto(inicial) : '# Primeira seção\nEscreva aqui o conteúdo.');
  const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false); const [excluir, setExcluir] = useState(false);
  const secoes = textoParaSecoes(texto);
  const id = inicial?.id || (titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'documento') + '-' + Date.now().toString(36);
  const gravar = async (excluido = false) => {
    if (!excluido && !titulo.trim()) { setErro('Informe o título.'); return; }
    if (!excluido && !secoes.some(s => s.itens.length)) { setErro('Escreva o conteúdo do documento.'); return; }
    setSalvando(true); setErro('');
    try { await aoSalvar({ id, titulo: titulo.trim() || inicial?.titulo || '', descricao: descricao.trim(), secoes: excluido ? (inicial?.secoes || []) : secoes, excluido }); }
    catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="wikiTopo">
        <div>
          <div className="wikiTipo">{inicial ? 'Editando documento' : 'Novo documento'}</div>
          <h2 className="h2" style={{ fontSize: 22, fontWeight: 700 }}>{titulo || 'Sem título'}</h2>
        </div>
        <div className="linha" style={{ flexShrink: 0 }}>
          {inicial && <button type="button" className="btn pq perigo" disabled={salvando || !gravavel} onClick={() => setExcluir(true)}>Excluir</button>}
          <button type="button" className="btn pq" disabled={salvando} onClick={aoCancelar}>Cancelar</button>
          <button type="button" className="btn pq pri" disabled={salvando || !gravavel} onClick={() => gravar()}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
      {!gravavel && <Mensagem tipo="info">Para salvar edições, rode o script provisionar-portal.ps1 (sem -Piloto): ele cria a lista "Portal Wiki" no SharePoint.</Mensagem>}
      {piloto && <p className="sub" style={{ fontSize: 12 }}>Modo piloto: as edições ficam só neste navegador.</p>}
      <div className="fg2">
        <label className="campo">Título *<input className="ctl" value={titulo} onChange={e => setTitulo(e.target.value)} /></label>
        <label className="campo">Descrição<input className="ctl" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Resumo de uma linha" /></label>
      </div>
      <div className="wikiEditor">
        <label className="campo">Conteúdo
          <textarea className="ctl wikiTextarea" value={texto} onChange={e => setTexto(e.target.value)} spellCheck />
          <span className="dica"><b># Seção</b> · <b>• tópico</b> (ou - tópico) · <b>1. passo</b> · <b>## subtítulo</b> · <b>Obs.:</b> observação · <b>NOTA:</b> nota · linha comum = parágrafo</span>
        </label>
        <div className="wikiPrevia">
          <div className="wikiTipo" style={{ marginBottom: 8 }}>Prévia</div>
          <VerModelo m={{ id, titulo: titulo || 'Sem título', descricao, secoes }} aoCopiar={() => undefined} previa />
        </div>
      </div>
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      {excluir && (
        <Mensagem tipo="erro">
          <span>Excluir “{inicial?.titulo}” da Wiki? </span>
          <button type="button" className="btn pq perigo" disabled={salvando} onClick={() => gravar(true)}>Excluir documento</button>{' '}
          <button type="button" className="btn pq" onClick={() => setExcluir(false)}>Cancelar</button>
        </Mensagem>
      )}
    </div>
  );
}
