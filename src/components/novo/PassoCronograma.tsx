import { useState } from 'react';
import type { Fase } from '../../types/models';
import type { ModeloProjeto } from '../../lib/modelos';
import { FASES } from '../../lib/constantes';
import { novaAtividade, renumerar, type LinhaAtividade } from './formulario';

const EQUIPES_ATIVIDADE = ['Systech', 'Cliente', 'Systech/Cliente', 'Systech/Fabricante', 'Systech/Cliente/Fabricante'] as const;

interface Props { linhas: LinhaAtividade[]; aoMudar: (l: LinhaAtividade[]) => void; aoMudarData: (indice: number, campo: 'inicio' | 'termino', data: string) => void; dataMinima?: string;
  /** modelos disponíveis (os do tipo do projeto primeiro) e quantas tarefas do modelo aplicado serão criadas */
  modelos: ModeloProjeto[]; tipo: string; tarefasDoModelo: number; aoAplicarModelo: (m: ModeloProjeto) => void }

export function PassoCronograma({ linhas, aoMudar, aoMudarData, dataMinima, modelos, tipo, tarefasDoModelo, aoAplicarModelo }: Props) {
  const ordenados = [...modelos].sort((a, b) => Number(b.tipo === tipo) - Number(a.tipo === tipo) || Number(!!b.padrao) - Number(!!a.padrao) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const [escolhido, setEscolhido] = useState('');
  const atual = ordenados.find(m => m.id === (escolhido || ordenados[0]?.id));
  const mudar = <K extends keyof LinhaAtividade>(i: number, c: K, v: LinhaAtividade[K]) => {
    const novas = linhas.map((l, k) => (k === i ? { ...l, [c]: v } : l));
    aoMudar(c === 'fase' ? renumerar(novas) : novas);   // o código acompanha a fase
  };
  return (
    <>
      <div className="linha">
        <p className="sub">Liste as atividades macro. As datas informadas viram a baseline do projeto. Ao mudar uma data, as atividades seguintes acompanham a diferença de dias, preservando suas durações. Marque como marco as entregas que exigem aceite do cliente.</p>
      </div>
      <div className="modeloEscolha">
        <label className="campo">Modelo de cronograma
          <select className="ctl" value={atual?.id || ''} onChange={e => setEscolhido(e.target.value)}>
            {ordenados.map(m => <option key={m.id} value={m.id}>{m.nome}{m.tipo ? ` · ${m.tipo}` : ''}{m.tipo && m.tipo !== tipo ? ' (outro tipo)' : ''}</option>)}
          </select>
          {atual && <span className="dica">{atual.descricao || 'Sem descrição.'} · {atual.itens.filter(i => !i.pai).length} atividade(s){atual.itens.some(i => i.pai) ? ` e ${atual.itens.filter(i => i.pai).length} tarefa(s)` : ''}.</span>}
        </label>
        <button type="button" className="btn pq pri" disabled={!atual} onClick={() => atual && aoAplicarModelo(atual)}>Aplicar modelo</button>
      </div>
      {tarefasDoModelo > 0 && <p className="sub" style={{ fontSize: 12.5 }}>O modelo aplicado também traz <b>{tarefasDoModelo} tarefa(s)</b>, criadas junto com o projeto em preparação (lance para os técnicos depois).</p>}
      <div className="twrap">
        <table className="tbl ftbl">
          <thead><tr><th>Cód.</th><th>Atividade *</th><th>Fase</th><th>Equipe</th><th>Início *</th><th>Término *</th><th>Marco</th><th /></tr></thead>
          <tbody>
            {linhas.map((a, i) => (
              <tr key={i}>
                <td style={{ width: 70 }}><input className="ctl mono" aria-label="Código" value={a.codigo} disabled title="Gerado pela fase: Iniciação 1.x, Planejamento 2.x, Execução 3.x, Monitoramento 4.x, Encerramento 5.x" /></td>
                <td style={{ minWidth: 240 }}><input className="ctl" aria-label="Atividade" value={a.nome} onChange={e => mudar(i, 'nome', e.target.value)} /></td>
                <td><select className="ctl" aria-label="Fase" value={a.fase} onChange={e => mudar(i, 'fase', e.target.value as Fase)}>{FASES.map(f => <option key={f}>{f}</option>)}</select></td>
                <td style={{ minWidth: 210 }}>
                  <select className="ctl" aria-label="Equipe" value={a.equipe} onChange={e => mudar(i, 'equipe', e.target.value)}>
                    {!a.equipe && <option value="" disabled>Selecione a equipe</option>}
                    {a.equipe && !EQUIPES_ATIVIDADE.some(equipe => equipe === a.equipe) && (
                      <option value={a.equipe}>{a.equipe} (valor do modelo)</option>
                    )}
                    {EQUIPES_ATIVIDADE.map(equipe => <option key={equipe} value={equipe}>{equipe}</option>)}
                  </select>
                </td>
                <td><input className={`ctl ${dataMinima && a.inicio && a.inicio < dataMinima ? 'erro' : ''}`} type="date" aria-label="Início" min={dataMinima} value={a.inicio} onChange={e => aoMudarData(i, 'inicio', e.target.value)} /></td>
                <td><input className="ctl" type="date" aria-label="Término" min={a.inicio || dataMinima} value={a.termino} onChange={e => aoMudarData(i, 'termino', e.target.value)} /></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" aria-label="Marco" checked={a.marco} onChange={e => mudar(i, 'marco', e.target.checked)} /></td>
                <td><button type="button" className="rm" aria-label="Remover atividade" onClick={() => aoMudar(renumerar(linhas.filter((_, k) => k !== i)))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="linha">
        <button type="button" className="btn pq" onClick={() => aoMudar(renumerar([...linhas, novaAtividade(linhas.map(l => l.codigo), linhas[linhas.length - 1]?.fase || 'Iniciação')]))}>+ Adicionar atividade</button>
        <span className="sub">O código é gerado pela fase: Iniciação 1.0, 1.1…; Planejamento 2.0…; Execução 3.0…; Monitoramento 4.0…; Encerramento 5.0…</span>
      </div>
    </>
  );
}
