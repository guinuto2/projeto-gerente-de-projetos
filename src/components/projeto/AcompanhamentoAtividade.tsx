import { useEffect, useState } from 'react';
import type { Atividade, Projeto, RegistroHistorico } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { CAMPOS_RETRATO } from '../../lib/historico';
import { dma } from '../../lib/datas';

type Retrato = Record<string, unknown>;
const ler = (s?: string): Retrato | null => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

/** Valor de um campo do retrato, legível. */
function valor(k: string, v: unknown, p: Projeto): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (k === 'percentual') return `${v}%`;
  if (k === 'horasRealizadas') return `${v} h`;
  if (k === 'responsavel') return p.equipe.find(m => m.email.toLowerCase() === String(v).toLowerCase())?.nome || String(v);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return dma(v.slice(0, 10));
  return String(v);
}
const quando = (iso: string) => { const d = new Date(iso); return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };

/**
 * Acompanhamento de uma atividade/subatividade: cada atualização com quem fez, quando,
 * o que mudou (antes → depois) e o retrato completo de como estava antes.
 */
export function AcompanhamentoAtividade({ projeto: p, a, compacto = false }: { projeto: Projeto; a: Atividade; compacto?: boolean }) {
  const { fonte } = usePortal();
  const [lista, setLista] = useState<RegistroHistorico[] | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState<number | null>(null);      // retrato "como estava antes"
  const [expandido, setExpandido] = useState<number | null>(null);  // mudanças da atualização
  // relê quando a atividade muda (uma atualização nova aparece logo)
  const versao = JSON.stringify([a.status, a.percentual, a.termino, a.dataUltimaAtualizacao, a.realizado, a.observacao, a.horasRealizadas]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      fonte.historico(p.codigo)
        .then(l => { setLista(l.filter(r => r.item === a.codigo || (!r.item && r.descricao.startsWith(`${a.codigo} ·`)))); setErro(''); })
        .catch(e => setErro((e as Error).message));
    }, 600);
    return () => window.clearTimeout(t);
  }, [fonte, p.codigo, a.codigo, versao]);

  return (
    <div className="acomp">
      <div className="h3" style={{ fontSize: 14 }}>Acompanhamento {lista && lista.length > 0 && <span className="cnt">{lista.length}</span>}</div>
      {erro && <p className="sub">{erro}</p>}
      {!erro && lista === null && <p className="sub">Buscando as atualizações…</p>}
      {lista && !lista.length && <p className="sub">Nenhuma atualização registrada ainda.</p>}
      <ol className="acompLinha">
        {(lista || []).slice(0, compacto ? 5 : undefined).map((r, i) => {
          const antes = ler(r.antes), depois = ler(r.depois);
          // vazio, ausente e "Não" contam como a mesma coisa (não aparecem como mudança)
          const n = (v: unknown) => (v === undefined || v === null || v === '' || v === false ? null : v);
          const mudou = antes && depois ? CAMPOS_RETRATO.filter(([k]) => JSON.stringify(n(antes[k])) !== JSON.stringify(n(depois[k]))) : [];
          return (
            <li key={i} className="acompItem">
              <button type="button" className="acompTopo acompBtn" aria-expanded={expandido === i} onClick={() => { setExpandido(expandido === i ? null : i); setAberto(null); }}>
                <b>{r.acao}</b><span className="sub">{quando(r.quando)} · {r.usuario}</span><span className="acompSeta" aria-hidden="true">{expandido === i ? '▾' : '▸'}</span>
              </button>
              {expandido === i && (
                <>
                  {mudou.length > 0 ? (
                    <table className="acompTab">
                      <thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
                      <tbody>{mudou.map(([k, rot]) => (
                        <tr key={k}><td>{rot}</td><td className="antes">{valor(k, antes![k], p)}</td><td className="depois">{valor(k, depois![k], p)}</td></tr>
                      ))}</tbody>
                    </table>
                  ) : <div className="sub" style={{ marginTop: 4 }}>{r.descricao}</div>}
                  {antes && (
                    <>
                      <button type="button" className="linkBtn" onClick={() => setAberto(aberto === i ? null : i)}>{aberto === i ? 'Esconder' : 'Ver como estava antes'}</button>
                      {aberto === i && (
                        <div className="retrato">{CAMPOS_RETRATO.map(([k, rot]) => (
                          <div key={k}><span>{rot}</span><b>{valor(k, antes[k], p)}</b></div>
                        ))}</div>
                      )}
                    </>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
      {compacto && lista && lista.length > 5 && <p className="sub">Mais {lista.length - 5} atualização(ões) na aba Acompanhamento do projeto.</p>}
    </div>
  );
}
