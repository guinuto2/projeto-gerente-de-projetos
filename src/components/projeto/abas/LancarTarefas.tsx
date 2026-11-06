import { useState } from 'react';
import type { Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { dm } from '../../../lib/datas';
import { Mensagem } from '../../ui/Mensagem';
import { avisoSobrecarga, tarefasNoPeriodo } from '../../../lib/validacoes';

/** Faixa "N tarefas em preparação" no cronograma do PMO, com a janela para escolher e lançar para os técnicos. */
export function LancarTarefas({ projeto: p }: { projeto: Projeto }) {
  const { dados, lancarTarefas, tarefasGravaveis } = usePortal();
  const toast = useToast();
  const pendentes = (dados.atividades[p.codigo] || []).filter(a => a.pai && a.lancada === false && a.status !== 'Cancelado')
    .sort((x, y) => x.codigo.localeCompare(y.codigo, 'pt-BR', { numeric: true }));
  const [aberto, setAberto] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [erro, setErro] = useState(''); const [enviando, setEnviando] = useState(false);
  const nome = (e?: string) => (e ? p.equipe.find(m => m.email.toLowerCase() === e.toLowerCase())?.nome || e : '');
  if (!tarefasGravaveis) return <Mensagem tipo="info">Para criar tarefas em preparação e lançá-las depois para o técnico, rode o script provisionar-portal.ps1 (sem -Piloto) e recarregue o portal.</Mensagem>;
  if (!pendentes.length) return null;
  const abrir = () => { setMarcadas(pendentes.filter(a => a.responsavel).map(a => a.codigo)); setErro(''); setAberto(true); };
  const lancar = async () => {
    if (!marcadas.length) { setErro('Marque ao menos uma tarefa.'); return; }
    setEnviando(true); setErro('');
    try { await lancarTarefas(p.codigo, marcadas); toast(`${marcadas.length} tarefa(s) lançada(s) para o técnico.`); setAberto(false); }
    catch (e) { setErro((e as Error).message); }
    finally { setEnviando(false); }
  };
  return (
    <>
      <div className="faixaPrep">
        <span><b>{pendentes.length} tarefa(s) em preparação</b> — o técnico ainda não vê.</span>
        <button type="button" className="btn pq pri" onClick={abrir}>Ver e lançar</button>
      </div>
      {aberto && (
        <>
          <div className="fundoDr" onClick={() => !enviando && setAberto(false)} />
          <div className="modal" role="dialog" aria-modal="true" aria-label="Lançar tarefas para o técnico" style={{ width: 'min(640px, 94vw)' }}>
            <h2 className="h3">Lançar tarefas para o técnico</h2>
            <p className="sub" style={{ margin: '4px 0 10px' }}>As tarefas marcadas passam a aparecer para o técnico responsável, que recebe um e-mail.</p>
            <div className="lancarLista">
              {pendentes.map(a => (
                <label key={a.codigo} className={`lancarItem ${a.responsavel ? '' : 'semResp'}`}>
                  <input type="checkbox" disabled={!a.responsavel} checked={marcadas.includes(a.codigo)}
                    onChange={e => setMarcadas(m => (e.target.checked ? [...m, a.codigo] : m.filter(x => x !== a.codigo)))} />
                  <span className="mono">{a.codigo}</span>
                  <span className="lancarNome">{a.nome}</span>
                  <span className="sub">{a.responsavel ? nome(a.responsavel) : 'sem técnico — escolha no painel da tarefa'} · até {dm(a.termino)}</span>
                  {a.responsavel && avisoSobrecarga(tarefasNoPeriodo(dados, a.responsavel, a.inicio, a.termino, { projeto: p.codigo, codigo: a.codigo })) &&
                    <span className="dica fds" style={{ gridColumn: 3 }}>Atenção: {nome(a.responsavel)} {avisoSobrecarga(tarefasNoPeriodo(dados, a.responsavel, a.inicio, a.termino, { projeto: p.codigo, codigo: a.codigo }))}.</span>}
                </label>
              ))}
            </div>
            {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
            <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn" disabled={enviando} onClick={() => setAberto(false)}>Cancelar</button>
              <button type="button" className="btn pri" disabled={enviando || !marcadas.length} onClick={lancar}>{enviando ? 'Lançando…' : `Lançar ${marcadas.length} tarefa(s)`}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
