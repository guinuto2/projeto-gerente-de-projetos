import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ARQUIVOS_LOCAIS, DESCRICAO_ARQUIVO, FABRICANTES, docParaTexto, juntarDocumentos, nomeCorreto, textoParaSecoes, tipoArquivo, urlLocal, type ArquivoWiki, type Fabricante, type Modelo, type ModeloSalvo } from '../lib/wiki';
import { usePortal } from '../state/PortalContext';
import { useToast } from '../state/ToastContext';
import { usePapel } from '../state/PapelContext';
import { Mensagem } from '../components/ui/Mensagem';
import { Confirmacao } from '../components/ui/Confirmacao';

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
  const carregarArquivos = () => {
    if (!fonte.arquivosWiki) return Promise.resolve();
    return fonte.arquivosWiki().then(l => {
      if (!l) return;   // biblioteca ainda não criada: ficam os arquivos que vêm com o portal
      setNoSharePoint(true);
      // a descrição digitada por quem enviou tem prioridade sobre a descrição padrão
      setArquivos(l.map(a => { const nome = nomeCorreto(a.nome); return { ...a, nome, descricao: a.descricao || DESCRICAO_ARQUIVO[nome] || 'Arquivo da pasta da equipe técnica.', local: false }; }));
    }).catch(() => undefined);
  };
  useEffect(() => { carregarArquivos(); }, [fonte]); // eslint-disable-line react-hooks/exhaustive-deps
  /** documentos de comprovação para editais, por fabricante (pasta Comprovacoes/<id> da biblioteca) */
  const [comprovacoes, setComprovacoes] = useState<Record<string, ArquivoWiki[]>>({});
  const carregarComprovacoes = () => {
    if (!fonte.comprovacoesWiki) return Promise.resolve();
    return fonte.comprovacoesWiki(FABRICANTES.map(f => f.id)).then(r => {
      if (!r) return;
      const out: Record<string, ArquivoWiki[]> = {};
      for (const [fid, l] of Object.entries(r)) out[fid] = l.map(a => ({ ...a, descricao: a.tipo === 'pasta' ? '' : a.descricao || 'Documento de comprovação para editais.', local: false }));
      setComprovacoes(out);
    }).catch(() => undefined);
  };
  useEffect(() => { carregarComprovacoes(); }, [fonte]); // eslint-disable-line react-hooks/exhaustive-deps
  const [destinoInicial, setDestinoInicial] = useState('');
  const [adicionando, setAdicionando] = useState(false);
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
  const sel = params.get('item') || '';
  const [tipo, id] = sel.split(':');
  type Segmento = 'fab' | 'modelo' | 'arq';
  const segmento: Segmento = (sel ? tipo : params.get('seg') || 'fab') as Segmento;
  const abrirSegmento = (sg: Segmento) => { setEditando(null); setEmResultado(true); setParams({ seg: sg }, { replace: true }); };
  const modelo = tipo === 'modelo' ? docs.find(m => m.id === id) : undefined;
  const fab = tipo === 'fab' ? FABRICANTES.find(f => f.id === id) : undefined;
  const arquivo = tipo === 'arq' ? arquivos.find(a => a.nome === decodeURIComponent(sel.slice(4))) : undefined;
  const abrir = (v: string) => setParams({ item: v }, { replace: true });
  /** abre o fabricante já na aba de comprovação para editais */
  const abrirComprovacao = (fid: string, pasta = '') => setParams({ item: `fab:${fid}`, aba: 'comp', ...(pasta ? { pasta } : {}) }, { replace: true });
  const [editandoItem, setEditandoItem] = useState<{ fid: string; item: ArquivoWiki } | null>(null);
  const [excluindoItem, setExcluindoItem] = useState<{ fid: string; item: ArquivoWiki } | null>(null);
  const [excluindoOcupado, setExcluindoOcupado] = useState(false); const [excluindoErro, setExcluindoErro] = useState('');
  const q = normal(busca.trim());
  const confere = (...t: string[]) => !q || normal(t.join(' ')).includes(q);
  const modelos = useMemo(() => docs.filter(m => confere(m.titulo, m.descricao, ...m.secoes.map(s => `${s.titulo} ${s.itens.join(' ')}`))), [q, docs]); // eslint-disable-line react-hooks/exhaustive-deps
  const arquivosFiltrados = useMemo(() => arquivos.filter(a => confere(a.nome, a.descricao, tipoArquivo(a.nome).rotulo)), [q, arquivos]); // eslint-disable-line react-hooks/exhaustive-deps
  const comprovFiltradas = useMemo(() => FABRICANTES.flatMap(f => (comprovacoes[f.id] || []).filter(a => a.tipo !== 'pasta' && confere(a.nome, a.descricao, f.nome, a.pasta || '', 'comprovação edital')).map(a => ({ f, a }))), [q, comprovacoes]); // eslint-disable-line react-hooks/exhaustive-deps
  const fabricantes = useMemo(() => FABRICANTES.filter(f => confere(f.nome, f.sigla, f.descricao, ...f.dicas, ...f.sites.map(s => `${s.titulo} ${s.descricao}`)) || (!!q && comprovFiltradas.some(x => x.f.id === f.id))), [q, comprovFiltradas]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {podeEditar && <button type="button" className="btn pri pq wikiAdicionar" onClick={() => setAdicionando(true)}>+ Adicionar à Wiki</button>}
          <div className="wikiAbas" role="tablist" aria-label="Seções da Wiki">
            {([['fab', 'Fabricantes', fabricantes.length], ['modelo', 'Documentos', modelos.length], ['arq', 'Arquivos', arquivosFiltrados.length]] as const).map(([sg, rot, n]) => (
              <button key={sg} type="button" role="tab" aria-selected={segmento === sg} className={`wikiAba ${segmento === sg ? 'on' : ''}`} onClick={() => abrirSegmento(sg)}>
                {rot}<span className="wikiAbaN">{n}</span>
              </button>
            ))}
          </div>
          {segmento === 'modelo' && <>
            {modelos.map(m => (
              <button key={m.id} type="button" className={`wikiItem ${sel === `modelo:${m.id}` ? 'on' : ''}`} onClick={() => { setEmResultado(true); abrir(`modelo:${m.id}`); }}>
                <span className="wikiDoc" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
                </span>{m.titulo}
              </button>
            ))}
            {!modelos.length && <p className="sub" style={{ padding: '2px 8px' }}>Nenhum documento encontrado.</p>}
          </>}
          {segmento === 'fab' && <>
            {fabricantes.map(f => (
              <button key={f.id} type="button" className={`wikiItem ${sel === `fab:${f.id}` ? 'on' : ''}`} onClick={() => { setEmResultado(true); abrir(`fab:${f.id}`); }}>
                <span className="wikiSigla" style={{ background: f.cor }} aria-hidden="true">{f.sigla}</span>{f.nome}
              </button>
            ))}
            {!fabricantes.length && <p className="sub" style={{ padding: '2px 8px' }}>Nenhum fabricante encontrado.</p>}
          </>}
          {segmento === 'arq' && <>
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
          </>}
        </aside>

        {excluindoItem && (() => {
          const { fid, item } = excluindoItem;
          const rel = item.pasta ? `${item.pasta}/${item.nome}` : item.nome;
          // itens dentro da pasta (todos os níveis), para avisar o que vai junto
          const dentro = item.tipo === 'pasta' ? (comprovacoes[fid] || []).filter(a => (a.pasta || '') === rel || (a.pasta || '').startsWith(rel + '/')) : [];
          const docs = dentro.filter(a => a.tipo !== 'pasta').length, subpastas = dentro.length - docs;
          return (
            <Confirmacao titulo={item.tipo === 'pasta' ? 'Excluir pasta' : 'Excluir documento'} rotuloConfirmar={excluindoOcupado ? 'Excluindo…' : 'Excluir'}
              ocupado={excluindoOcupado} erro={excluindoErro || undefined}
              aoCancelar={() => { setExcluindoItem(null); setExcluindoErro(''); }}
              aoConfirmar={async () => {
                setExcluindoOcupado(true); setExcluindoErro('');
                try {
                  await fonte.excluirItemWiki!(item.id!);
                  // a pasta aberta (ou uma de cima dela) foi excluída: volta para onde ela estava
                  const aberta = params.get('pasta') || '';
                  if (item.tipo === 'pasta' && (aberta === rel || aberta.startsWith(rel + '/'))) abrirComprovacao(fid, item.pasta || '');
                  await carregarComprovacoes(); setExcluindoItem(null);
                  toast(item.tipo === 'pasta' ? `Pasta “${item.nome}” excluída.` : `“${item.nome}” excluído.`);
                } catch (e) { setExcluindoErro((e as Error).message); }
                finally { setExcluindoOcupado(false); }
              }}>
              <p>Excluir {item.tipo === 'pasta' ? 'a pasta' : 'o documento'} <b>“{item.nome}”</b>?</p>
              {item.tipo === 'pasta' && dentro.length > 0 && <p><b>Tudo o que está dentro vai junto:</b> {docs} documento(s){subpastas ? ` e ${subpastas} subpasta(s)` : ''}.</p>}
              <p className="sub">Vai para a lixeira do site no SharePoint, de onde pode ser restaurado se for engano.</p>
            </Confirmacao>
          );
        })()}
        {editandoItem && (
          <EditarItemWiki item={editandoItem.item} aoFechar={() => setEditandoItem(null)}
            aoExcluir={() => { setExcluindoItem(editandoItem); setEditandoItem(null); }}
            aoSalvar={async (nome, descricao) => {
              const { fid, item } = editandoItem;
              if (nome !== item.nome) await fonte.renomearItemWiki!(item.id!, nome);
              if (item.tipo !== 'pasta' && descricao !== (item.descricao === 'Documento de comprovação para editais.' ? '' : item.descricao)) await fonte.descreverItemWiki!(item.id!, descricao);
              // pasta renomeada: se ela (ou uma de dentro) estava aberta, acompanha o novo nome
              if (item.tipo === 'pasta' && nome !== item.nome) {
                const antigo = item.pasta ? `${item.pasta}/${item.nome}` : item.nome, novo = item.pasta ? `${item.pasta}/${nome}` : nome;
                const aberta = params.get('pasta') || '';
                if (aberta === antigo || aberta.startsWith(antigo + '/')) abrirComprovacao(fid, novo + aberta.slice(antigo.length));
              }
              await carregarComprovacoes(); setEditandoItem(null); toast(item.tipo === 'pasta' ? 'Pasta atualizada.' : 'Documento atualizado.');
            }} />
        )}
        {adicionando && (
          <AdicionarWiki arquivos={arquivos} comprovacoes={comprovacoes} destinoInicial={destinoInicial} podeEnviar={noSharePoint && !!fonte.enviarArquivoWiki} piloto={fonte.modo === 'piloto'}
            aoFechar={() => { setAdicionando(false); setDestinoInicial(''); }}
            aoDocumento={() => { setAdicionando(false); setDestinoInicial(''); setEditando('novo'); setEmResultado(true); }}
            aoEnviar={async (arq, descricao, pasta) => {
              await fonte.enviarArquivoWiki!(arq, descricao, pasta);
              setAdicionando(false); setDestinoInicial(''); setEmResultado(true);
              if (pasta) {
                const [, fid, ...sub] = pasta.split('/');
                await carregarComprovacoes(); abrirComprovacao(fid, sub.join('/'));
                toast(`“${arq.name}” adicionado à comprovação para editais (${FABRICANTES.find(f => f.id === fid)?.nome}).`);
              } else {
                await carregarArquivos(); abrir(`arq:${encodeURIComponent(arq.name)}`);
                toast(`“${arq.name}” enviado para a biblioteca Wiki Tecnicos.`);
              }
            }} />
        )}
        <section className="card wikiConteudo">
          {q && !emResultado ? (
            <div>
              <div className="wikiTipo">Resultados da busca</div>
              <h2 className="h2" style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 12px' }}>“{busca.trim()}”</h2>
              {!modelos.length && !fabricantes.length && !arquivosFiltrados.length && !comprovFiltradas.length && <p className="sub">Nada encontrado nos documentos, fabricantes e arquivos.</p>}
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
              {comprovFiltradas.map(({ f, a }) => (
                <button key={f.id + (a.pasta || '') + a.nome} type="button" className="wikiResultado" onClick={() => { setEmResultado(true); abrirComprovacao(f.id, a.pasta || ''); }}>
                  <span className="wikiResTit"><Destaque texto={a.nome} termo={busca} /> <span className="sub">· comprovação para editais · {[f.nome, ...(a.pasta ? a.pasta.split('/') : [])].join(' › ')}</span></span>
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
          {!editando && fab && <VerFabricante key={fab.id} f={fab} aba={params.get('aba') === 'comp' ? 'comp' : 'links'} termo={q ? busca : ''}
            documentos={comprovacoes[fab.id] || []} podeAdicionar={podeEditar} noSharePoint={noSharePoint} pasta={params.get('pasta') || ''}
            aoTrocarAba={a => setParams(a === 'comp' ? { item: `fab:${fab.id}`, aba: 'comp' } : { item: `fab:${fab.id}` }, { replace: true })}
            aoAbrirPasta={p => abrirComprovacao(fab.id, p)}
            aoAdicionar={() => { const p = params.get('pasta') || ''; setDestinoInicial(`Comprovacoes/${fab.id}${p ? '/' + p : ''}`); setAdicionando(true); }}
            aoCriarPasta={async nome => {
              const p = params.get('pasta') || '';
              await fonte.criarPastaWiki!(`Comprovacoes/${fab.id}/${p ? p + '/' : ''}${nome}`);
              await carregarComprovacoes(); toast(`Pasta “${nome}” criada.`);
            }}
            aoEditar={item => setEditandoItem({ fid: fab.id, item })}
            aoBaixar={a => baixarArquivo(a, fonte).catch(e => toast((e as Error).message))} />}
          {!editando && arquivo && <VerArquivo a={arquivo} noSharePoint={noSharePoint} />}
          {!editando && !modelo && !fab && !arquivo && (
            <VisaoSegmento segmento={segmento} fabricantes={fabricantes} documentos={modelos} arquivos={arquivosFiltrados} filtrando={!!q}
              aoAbrir={v => { setEmResultado(true); abrir(v); }} aoBaixar={a => baixarArquivo(a, fonte).catch(e => toast((e as Error).message))} />
          )}
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

function VerFabricante({ f, aba, termo, documentos, podeAdicionar, noSharePoint, pasta, aoTrocarAba, aoAbrirPasta, aoAdicionar, aoCriarPasta, aoEditar, aoBaixar }: {
  f: Fabricante; aba: 'links' | 'comp'; termo: string; documentos: ArquivoWiki[]; podeAdicionar: boolean; noSharePoint: boolean; pasta: string;
  aoTrocarAba: (a: 'links' | 'comp') => void; aoAbrirPasta: (p: string) => void; aoAdicionar: () => void; aoCriarPasta: (nome: string) => Promise<void>;
  aoEditar: (a: ArquivoWiki) => void; aoBaixar: (a: ArquivoWiki) => void;
}) {
  const totalDocs = documentos.filter(a => a.tipo !== 'pasta').length;
  const naPasta = documentos.filter(a => (a.pasta || '') === pasta);
  const partes = pasta ? pasta.split('/') : [];
  const [novaPasta, setNovaPasta] = useState<string | null>(null);
  const [erroPasta, setErroPasta] = useState(''); const [criando, setCriando] = useState(false);
  const criarPasta = async () => {
    const nome = (novaPasta || '').trim();
    const invalido = validarNomeWiki(nome, naPasta.map(a => a.nome));
    if (invalido) { setErroPasta(invalido); return; }
    setCriando(true); setErroPasta('');
    try { await aoCriarPasta(nome); setNovaPasta(null); } catch (e) { setErroPasta((e as Error).message); } finally { setCriando(false); }
  };
  const comAbas = true;
  const ehGeral = f.id === 'editais';   // "Comprovações para editais": documentos gerais, de mais de um fabricante
  return (
    <>
      <div className="wikiTopo">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="wikiSigla grande" style={{ background: f.cor }} aria-hidden="true">{f.sigla}</span>
          <div>
            <div className="wikiTipo">{f.id === 'editais' ? 'Referências' : 'Fabricante'}</div>
            <h2 className="h2" style={{ fontSize: 24, fontWeight: 700 }}>{f.nome}</h2>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--medio)' }}>{f.descricao}</p>
      {comAbas && (
        <div className="fabAbas" role="tablist" aria-label={`Seções de ${f.nome}`}>
          <button type="button" role="tab" aria-selected={aba === 'links'} className={`fabAba ${aba === 'links' ? 'on' : ''}`} onClick={() => aoTrocarAba('links')}>Links <span className="wikiAbaN">{f.sites.length}</span></button>
          <button type="button" role="tab" aria-selected={aba === 'comp'} className={`fabAba ${aba === 'comp' ? 'on' : ''}`} onClick={() => aoTrocarAba('comp')}>{ehGeral ? 'Arquivos' : 'Comprovação para editais'} <span className="wikiAbaN">{totalDocs}</span></button>
        </div>
      )}
      {(!comAbas || aba === 'links') && <>
      {/* links agrupados (portal do parceiro, certificações, ferramentas, suporte); sem grupo = "Sites importantes" */}
      {Array.from(new Set(f.sites.map(x => x.grupo || 'Sites importantes'))).map(g => (
        <div key={g} className="wikiGrupoSites">
          <h3 className="h3" style={{ fontSize: 15 }}>{g}</h3>
          <div className="wikiSites">
            {f.sites.filter(x => (x.grupo || 'Sites importantes') === g).map(x => (
              <a key={x.url} className="wikiSite" href={x.url} target="_blank" rel="noopener noreferrer">
                <span className="wikiSiteTit">{x.titulo} <span aria-hidden="true">↗</span></span>
                <span className="sub">{x.descricao}</span>
                <span className="wikiUrl">{x.url.replace(/^https?:\/\//, '').replace(/[?#].*$/, '')}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
      {f.dicas.length > 0 && (
        <div className="wikiDicas">
          <b>Dicas</b>
          <ul className="ul">{f.dicas.map(d => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
      <p className="sub" style={{ fontSize: 12 }}>Links oficiais dos fabricantes. Os portais de parceiro, de certificação e de suporte pedem login de cada pessoa.</p>
      </>}
      {comAbas && aba === 'comp' && (
        <div className="wikiComprovacao">
          <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 className="h3" style={{ fontSize: 15 }}>{ehGeral ? 'Arquivos de comprovação (gerais)' : 'Documentos de comprovação para editais'}</h3>
              <span className="sub" style={{ fontSize: 12.5 }}>{ehGeral ? 'Prints, declarações e comprovantes que valem para mais de um fabricante (associações, catálogos de compatibilidade).' : `Declarações, certificados e comprovantes da ${f.nome} para anexar às propostas.`}</span>
            </div>
            {podeAdicionar && noSharePoint && <span className="linha" style={{ gap: 6 }}>
              <button type="button" className="btn pq" onClick={() => { setNovaPasta(''); setErroPasta(''); }}>+ Nova pasta</button>
              <button type="button" className="btn pri pq" onClick={aoAdicionar}>+ Adicionar documento</button>
            </span>}
          </div>
          {/* caminho: fabricante › pasta › subpasta */}
          <nav className="wikiCaminho" aria-label="Pasta">
            <button type="button" className="linkBtn" disabled={!pasta} onClick={() => aoAbrirPasta('')}>{f.nome}</button>
            {partes.map((p, k) => (
              <span key={k}> › <button type="button" className="linkBtn" disabled={k === partes.length - 1} onClick={() => aoAbrirPasta(partes.slice(0, k + 1).join('/'))}>{p}</button></span>
            ))}
          </nav>
          {novaPasta !== null && (
            <div className="wikiNovaPasta">
              <input className="ctl" autoFocus placeholder="Nome da pasta (ex.: Certificados)" value={novaPasta} disabled={criando}
                onChange={e => setNovaPasta(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') criarPasta(); if (e.key === 'Escape') setNovaPasta(null); }} />
              <button type="button" className="btn pri pq" disabled={criando} onClick={criarPasta}>{criando ? 'Criando…' : 'Criar pasta'}</button>
              <button type="button" className="btn pq" disabled={criando} onClick={() => setNovaPasta(null)}>Cancelar</button>
              {erroPasta && <span className="dica" style={{ color: '#9A2E12', flexBasis: '100%' }}>{erroPasta}</span>}
            </div>
          )}
          {!noSharePoint && <p className="sub" style={{ fontSize: 12.5 }}>Os documentos ficam no SharePoint (biblioteca Wiki Tecnicos): disponíveis com o portal conectado.</p>}
          {naPasta.length ? (
            <div className="twrap">
              <table className="tbl wikiTabela">
                <thead><tr><th>Tipo</th><th>Nome</th><th>Descrição</th><th>Atualizado</th><th /></tr></thead>
                <tbody>
                  {naPasta.map(a => {
                    if (a.tipo === 'pasta') {
                      const rel = a.pasta ? `${a.pasta}/${a.nome}` : a.nome;
                      return (
                        <tr key={'p:' + a.nome} className="cl" tabIndex={0} onClick={() => aoAbrirPasta(rel)} onKeyDown={e => { if (e.key === 'Enter') aoAbrirPasta(rel); }}>
                          <td><span className="wikiExt wikiPastaIco" aria-hidden="true">📁</span></td>
                          <td style={{ fontWeight: 600 }}>{a.nome}<div className="sub" style={{ fontWeight: 400 }}>{a.qtd || 0} item(ns)</div></td>
                          <td className="sub">Pasta</td>
                          <td className="mono" style={{ whiteSpace: 'nowrap' }}>{a.modificado ? new Date(a.modificado).toLocaleDateString('pt-BR') : '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{podeAdicionar && <>
                            <button type="button" className="btn pq" title="Renomear ou excluir a pasta" onClick={e => { e.stopPropagation(); aoEditar(a); }}>✎ Editar</button>
                          </>}</td>
                        </tr>
                      );
                    }
                    const t = tipoArquivo(a.nome);
                    return (
                      <tr key={a.nome}>
                        <td><span className="wikiExt" style={{ background: t.cor }}>{t.rotulo}</span></td>
                        <td style={{ fontWeight: 600 }}><Destaque texto={a.nome} termo={termo} /><div className="sub mono" style={{ fontWeight: 400 }}>{tamanhoLegivel(a.tamanho)}</div></td>
                        <td className="sub"><Destaque texto={a.descricao} termo={termo} /></td>
                        <td className="mono" style={{ whiteSpace: 'nowrap' }}>{a.modificado ? new Date(a.modificado).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {podeAdicionar && <><button type="button" className="btn pq" title="Alterar o nome e a descrição, ou excluir" onClick={() => aoEditar(a)}>✎ Editar</button>{' '}</>}
                          <button type="button" className="btn pq" onClick={() => aoBaixar(a)}>Baixar</button>{' '}
                          {a.url && <a className="btn pq" href={a.url} target="_blank" rel="noopener noreferrer" title="Abrir no SharePoint">↗</a>}

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="sub">{pasta ? 'Esta pasta está vazia.' : ehGeral ? 'Nenhum arquivo ainda.' : `Nenhum documento de comprovação da ${f.nome} ainda.`}{podeAdicionar && noSharePoint ? ' Use “+ Adicionar documento”.' : ''}</p>}
        </div>
      )}
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
  const conteudo = () => blobDoArquivo(a, fonte);
  useEffect(() => {
    setTexto(null);
    if (ehTexto) conteudo().then(b => b.text()).then(setTexto).catch(() => setTexto(''));
  }, [a.nome]); // eslint-disable-line react-hooks/exhaustive-deps
  const baixar = async () => {
    setBaixando(true);
    try { await baixarArquivo(a, fonte); } catch (e) { toast((e as Error).message); }
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
  const [previa, setPrevia] = useState(false);   // alterna entre editar e ver a prévia (o texto ocupa a largura toda)
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
      <div className="wikiEditorTopo">
        <span className="dica">{previa ? 'Assim o documento vai aparecer na Wiki.' : <><b># Seção</b> · <b>• tópico</b> (ou - tópico) · <b>1. passo</b> · <b>## subtítulo</b> · <b>Obs.:</b> observação · <b>NOTA:</b> nota · linha comum = parágrafo</>}</span>
        <button type="button" className="btn pq" onClick={() => setPrevia(v => !v)}>{previa ? '✎ Voltar a editar' : '👁 Ver prévia'}</button>
      </div>
      {previa ? (
        <div className="wikiPrevia">
          <VerModelo m={{ id, titulo: titulo || 'Sem título', descricao, secoes }} aoCopiar={() => undefined} previa />
        </div>
      ) : (
        <label className="campo">Conteúdo
          <textarea className="ctl wikiTextarea" value={texto} onChange={e => setTexto(e.target.value)} spellCheck />
        </label>
      )}
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

/** Janela "+ Adicionar à Wiki": o técnico escolhe entre um documento (texto) e um arquivo (enviado ao SharePoint). */
function AdicionarWiki({ arquivos, comprovacoes, destinoInicial = '', podeEnviar, piloto, aoFechar, aoDocumento, aoEnviar }: {
  arquivos: ArquivoWiki[]; comprovacoes: Record<string, ArquivoWiki[]>; destinoInicial?: string; podeEnviar: boolean; piloto: boolean;
  aoFechar: () => void; aoDocumento: () => void; aoEnviar: (a: File, descricao: string, pasta: string) => Promise<void>;
}) {
  const [modo, setModo] = useState<'escolha' | 'arquivo'>(destinoInicial ? 'arquivo' : 'escolha');
  /** onde guardar: '' = Arquivos da Wiki; 'Comprovacoes/<id>' = comprovação para editais do fabricante */
  const [destino, setDestino] = useState(destinoInicial);
  const [arq, setArq] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [substituir, setSubstituir] = useState(false);
  const [enviando, setEnviando] = useState(false); const [erro, setErro] = useState('');
  const [, fidDestino, ...subDestino] = destino.split('/');
  const naPasta = destino ? (comprovacoes[fidDestino] || []).filter(a => a.tipo !== 'pasta' && (a.pasta || '') === subDestino.join('/')) : arquivos;
  const existe = !!arq && naPasta.some(a => a.nome.toLowerCase() === arq.name.toLowerCase());
  const LIMITE = 250 * 1024 * 1024;
  const enviar = async () => {
    if (!arq) { setErro('Escolha o arquivo.'); return; }
    if (arq.size > LIMITE) { setErro('O arquivo passa de 250 MB. Envie direto pela biblioteca no SharePoint.'); return; }
    if (existe && !substituir) { setErro('Já existe um arquivo com esse nome: marque “Substituir o arquivo existente” ou renomeie o arquivo antes.'); return; }
    setEnviando(true); setErro('');
    try { await aoEnviar(arq, descricao, destino); } catch (e) { setErro((e as Error).message); setEnviando(false); }
  };
  return (
    <>
      <div className="fundoDr" onClick={() => !enviando && aoFechar()} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Adicionar à Wiki" style={{ width: 'min(620px, 94vw)' }}>
        <h2 className="h3">Adicionar à Wiki</h2>
        {modo === 'escolha' ? (
          <>
            <p className="sub" style={{ margin: '4px 0 14px' }}>O que você vai adicionar?</p>
            <div className="wikiEscolha">
              <button type="button" className="wikiOpcao" onClick={aoDocumento}>
                <span className="wikiOpcaoIco" aria-hidden="true">📝</span>
                <b>Documento</b>
                <span className="sub">Texto escrito aqui na Wiki: procedimentos, questionamentos, requisitos. Abre o editor, com prévia ao vivo; aparece em “Documentos”.</span>
              </button>
              <button type="button" className="wikiOpcao" onClick={() => setModo('arquivo')}>
                <span className="wikiOpcaoIco" aria-hidden="true">📎</span>
                <b>Arquivo</b>
                <span className="sub">Word, Excel, PDF, PowerPoint… Vai para a biblioteca “Wiki Tecnicos” do SharePoint: em “Arquivos” ou na comprovação para editais de um fabricante.</span>
              </button>
            </div>
            <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 14 }}><button type="button" className="btn" onClick={aoFechar}>Cancelar</button></div>
          </>
        ) : (
          <>
            {!podeEnviar && <Mensagem tipo="info">{piloto ? 'No modo piloto não há SharePoint: o envio de arquivos funciona com o portal conectado.' : 'A biblioteca “Wiki Tecnicos” ainda não existe: rode o script provisionar-portal.ps1 (sem -Piloto).'}</Mensagem>}
            <label className="campo" style={{ marginTop: 10 }}>Onde guardar
              <select className="ctl" value={destino} disabled={enviando} onChange={e => { setDestino(e.target.value); setSubstituir(false); }}>
                <option value="">Arquivos da Wiki</option>
                <optgroup label="Comprovação para editais">
                  {FABRICANTES.map(f => <option key={f.id} value={`Comprovacoes/${f.id}`}>{f.nome}</option>)}
                  {/* subpastas do fabricante */}
                  {FABRICANTES.flatMap(f => (comprovacoes[f.id] || []).filter(a => a.tipo === 'pasta').map(a => {
                    const rel = a.pasta ? `${a.pasta}/${a.nome}` : a.nome;
                    return <option key={f.id + rel} value={`Comprovacoes/${f.id}/${rel}`}>{[f.nome, ...rel.split('/')].join(' › ')}</option>;
                  }))}
                </optgroup>
              </select>
            </label>
            <label className="campo" style={{ marginTop: 10 }}>Arquivo *
              <input className="ctl" type="file" disabled={!podeEnviar || enviando} onChange={e => { setArq(e.target.files?.[0] || null); setSubstituir(false); setErro(''); }} />
              {arq && <span className="dica">{arq.name} · {arq.size < 1048576 ? `${Math.max(1, Math.round(arq.size / 1024))} KB` : `${(arq.size / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`}</span>}
            </label>
            {existe && (
              <label className="chk" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={substituir} onChange={e => setSubstituir(e.target.checked)} />
                <span>Já existe “{arq!.name}” {destino ? 'na comprovação deste fabricante' : 'na Wiki'}. <b>Substituir o arquivo existente</b></span>
              </label>
            )}
            <label className="campo" style={{ marginTop: 10 }}>Descrição
              <textarea className="ctl" rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Para que serve o arquivo (aparece na Wiki e na busca)." disabled={!podeEnviar || enviando} />
            </label>
            {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
            <div className="linha" style={{ justifyContent: 'space-between', marginTop: 14 }}>
              <button type="button" className="linkBtn" disabled={enviando} onClick={() => setModo('escolha')}>← Voltar</button>
              <span className="linha">
                <button type="button" className="btn" disabled={enviando} onClick={aoFechar}>Cancelar</button>
                <button type="button" className="btn pri" disabled={!podeEnviar || !arq || enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar para o SharePoint'}</button>
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** Conteúdo de um arquivo da Wiki: da biblioteca do SharePoint ou da cópia que vem com o portal. */
async function blobDoArquivo(a: ArquivoWiki, fonte: ReturnType<typeof usePortal>['fonte']): Promise<Blob> {
  if (!a.local && a.id && fonte.baixarArquivoWiki) return fonte.baixarArquivoWiki(a.id);
  const r = await fetch(urlLocal(a.arquivo || a.nome)); if (!r.ok) throw new Error('Arquivo não encontrado.'); return r.blob();
}
async function baixarArquivo(a: ArquivoWiki, fonte: ReturnType<typeof usePortal>['fonte']) {
  const url = URL.createObjectURL(await blobDoArquivo(a, fonte));
  const el = document.createElement('a'); el.href = url; el.download = a.nome; el.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Página de abertura de cada seção da Wiki (Fabricantes, Documentos, Arquivos). */
function VisaoSegmento({ segmento, fabricantes, documentos, arquivos, filtrando, aoAbrir, aoBaixar }: {
  segmento: 'fab' | 'modelo' | 'arq'; fabricantes: Fabricante[]; documentos: ModeloSalvo[]; arquivos: ArquivoWiki[]; filtrando: boolean;
  aoAbrir: (v: string) => void; aoBaixar: (a: ArquivoWiki) => void;
}) {
  const titulo = { fab: 'Fabricantes', modelo: 'Documentos', arq: 'Arquivos' }[segmento];
  const resumo = {
    fab: 'Sites oficiais de suporte, downloads, documentação e compatibilidade de cada fabricante.',
    modelo: 'Textos da equipe técnica: qualificações, questionamentos, procedimentos e requisitos.',
    arq: 'Planilhas, modelos e instruções da equipe técnica, guardados na biblioteca “Wiki Tecnicos” do SharePoint.'
  }[segmento];
  const n = { fab: fabricantes.length, modelo: documentos.length, arq: arquivos.length }[segmento];
  return (
    <>
      <div className="wikiTopo">
        <div>
          <div className="wikiTipo">Wiki · {n} {segmento === 'fab' ? 'fabricante(s)' : segmento === 'modelo' ? 'documento(s)' : 'arquivo(s)'}{filtrando ? ' encontrados na busca' : ''}</div>
          <h2 className="h2" style={{ fontSize: 24, fontWeight: 700 }}>{titulo}</h2>
          <p className="sub" style={{ marginTop: 4 }}>{resumo}</p>
        </div>
      </div>
      {!n && <p className="sub">Nada {filtrando ? 'encontrado nesta seção' : 'cadastrado ainda'}.</p>}
      {segmento === 'fab' && (
        <div className="wikiGrade">
          {fabricantes.map(f => (
            <button key={f.id} type="button" className="wikiCartao" onClick={() => aoAbrir(`fab:${f.id}`)}>
              <span className="wikiSigla grande" style={{ background: f.cor }} aria-hidden="true">{f.sigla}</span>
              <b>{f.nome}</b>
              <span className="sub">{f.descricao}</span>
              <span className="wikiCartaoPe">{f.sites.length} link(s) →</span>
            </button>
          ))}
        </div>
      )}
      {segmento === 'modelo' && (
        <div className="wikiGrade">
          {documentos.map(m => (
            <button key={m.id} type="button" className="wikiCartao" onClick={() => aoAbrir(`modelo:${m.id}`)}>
              <span className="wikiDoc grande" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
              </span>
              <b>{m.titulo}</b>
              <span className="sub">{m.descricao}</span>
              <span className="wikiCartaoPe">{m.secoes.length} seção(ões){m.atualizado ? ` · editado em ${new Date(m.atualizado).toLocaleDateString('pt-BR')}` : ''} →</span>
            </button>
          ))}
        </div>
      )}
      {segmento === 'arq' && n > 0 && (
        <div className="twrap">
          <table className="tbl wikiTabela">
            <thead><tr><th>Tipo</th><th>Arquivo</th><th>Descrição</th><th>Tamanho</th><th /></tr></thead>
            <tbody>
              {arquivos.map(a => {
                const t = tipoArquivo(a.nome);
                return (
                  <tr key={a.nome} className="cl" tabIndex={0} onClick={() => aoAbrir(`arq:${encodeURIComponent(a.nome)}`)} onKeyDown={e => { if (e.key === 'Enter') aoAbrir(`arq:${encodeURIComponent(a.nome)}`); }}>
                    <td><span className="wikiExt" style={{ background: t.cor }}>{t.rotulo}</span></td>
                    <td style={{ fontWeight: 600 }}>{a.nome}</td>
                    <td className="sub">{a.descricao}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{tamanhoLegivel(a.tamanho)}</td>
                    <td><button type="button" className="btn pq" onClick={e => { e.stopPropagation(); aoBaixar(a); }}>Baixar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Nome de arquivo ou pasta aceito pelo SharePoint (e que não repita um da mesma pasta). Devolve o problema, ou "". */
function validarNomeWiki(nome: string, existentes: string[], atual = ''): string {
  if (!nome.trim()) return 'Informe o nome.';
  if (/["*:<>?/\\|]/.test(nome)) return 'O nome não pode ter os caracteres " * : < > ? / \\ |';
  if (/^\.|\.$|^\s|\s$/.test(nome)) return 'O nome não pode começar ou terminar com ponto ou espaço.';
  if (nome.length > 200) return 'O nome é muito longo (máximo de 200 caracteres).';
  if (existentes.some(x => x.toLowerCase() === nome.toLowerCase() && x.toLowerCase() !== atual.toLowerCase())) return `Já existe “${nome}” nesta pasta.`;
  return '';
}

/** Janela "Editar": nome e descrição de um documento, ou nome de uma pasta. */
function EditarItemWiki({ item, aoFechar, aoSalvar, aoExcluir }: { item: ArquivoWiki; aoFechar: () => void; aoSalvar: (nome: string, descricao: string) => Promise<void>; aoExcluir: () => void }) {
  const ehPasta = item.tipo === 'pasta';
  const ext = ehPasta ? '' : (/\.[^.]+$/.exec(item.nome)?.[0] || '');
  const [nome, setNome] = useState(ehPasta ? item.nome : item.nome.slice(0, item.nome.length - ext.length));
  const [descricao, setDescricao] = useState(item.descricao === 'Documento de comprovação para editais.' ? '' : item.descricao || '');
  const [salvando, setSalvando] = useState(false); const [erro, setErro] = useState('');
  const salvar = async () => {
    const final = nome.trim() + ext;   // a extensão do arquivo é mantida
    const invalido = validarNomeWiki(nome.trim() ? final : '', [], item.nome);
    if (invalido) { setErro(invalido); return; }
    setSalvando(true); setErro('');
    try { await aoSalvar(final, descricao.trim()); } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  return (
    <>
      <div className="fundoDr" onClick={() => !salvando && aoFechar()} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={ehPasta ? 'Renomear pasta' : 'Editar documento'} style={{ width: 'min(560px, 94vw)' }}>
        <h2 className="h3">{ehPasta ? 'Editar pasta' : 'Editar documento'}</h2>
        <label className="campo" style={{ marginTop: 12 }}>{ehPasta ? 'Nome da pasta' : 'Nome do arquivo'}
          <span className="wikiNomeExt">
            <input className="ctl" autoFocus value={nome} disabled={salvando} onChange={e => setNome(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ehPasta) salvar(); }} />
            {ext && <span className="mono sub">{ext}</span>}
          </span>
          {ext && <span className="dica">A extensão ({ext}) é mantida para o arquivo continuar abrindo no programa certo.</span>}
        </label>
        {!ehPasta && (
          <label className="campo" style={{ marginTop: 10 }}>Descrição
            <textarea className="ctl" rows={3} value={descricao} disabled={salvando} onChange={e => setDescricao(e.target.value)} placeholder="Para que serve o documento (ex.: item 8.6.1.4 – declaração de revenda autorizada)." />
          </label>
        )}
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="linha" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <button type="button" className="btn perigo" disabled={salvando} onClick={aoExcluir}>{ehPasta ? 'Excluir pasta' : 'Excluir documento'}</button>
          <span className="linha">
            <button type="button" className="btn" disabled={salvando} onClick={aoFechar}>Cancelar</button>
            <button type="button" className="btn pri" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          </span>
        </div>
      </div>
    </>
  );
}
