import { useState } from 'react';
import type { Atividade, Fase, Projeto, StatusAtividade } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { usePapel } from '../../../state/PapelContext';
import { macro } from '../../../lib/calculos';
import { FASES, STATUS_ATIVIDADE } from '../../../lib/constantes';
import { dma } from '../../../lib/datas';
import { Drawer } from '../../ui/Drawer';

interface Props {
  projeto: Projeto;
  /** sem código = nova atividade */
  codigo?: string;
  /** fase sugerida para a nova atividade (a selecionada no ciclo de vida) */
  faseInicial?: Fase | null;
  aoFechar: () => void;
}

function proximoCodigo(lista: Atividade[]): string {
  const nums = lista.filter(a => !a.pai).map(a => Number(String(a.codigo).split('.').pop())).filter(n => !isNaN(n));
  const pref = lista.find(a => /^\d+\.\d+$/.test(a.codigo))?.codigo.split('.')[0];
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return pref ? `${pref}.${n}` : String(n);
}

/** Cria, edita ou exclui uma atividade do cronograma. */
export function EditarAtividade({ projeto, codigo, faseInicial, aoFechar }: Props) {
  const { dados, salvarAtividade, criarAtividade, excluirAtividade } = usePortal();
  const toast = useToast();
  const { pode, papel } = usePapel();
  const estrutura = pode('gerenciarAtividades');   // nome, fase, equipe, datas, marco, descrição
  const lista = dados.atividades[projeto.codigo] || [];
  const existente = codigo ? lista.find(x => x.codigo === codigo) : undefined;
  const nova = !existente;
  const filhos = existente ? lista.filter(x => x.pai === existente.codigo) : [];
  const macros = macro(dados, projeto.codigo);

  const [f, setF] = useState({
    codigo: existente?.codigo || proximoCodigo(lista),
    nome: existente?.nome || '',
    fase: (existente?.fase || faseInicial || 'Execução') as Fase,
    equipe: existente?.equipe || 'Systech',
    status: (existente?.status || 'Planejado') as StatusAtividade,
    percentual: String(existente?.percentual ?? 0),
    inicio: existente?.inicio || '',
    termino: existente?.termino || '',
    marco: existente?.marco || false,
    pai: existente?.pai || '',
    descricao: existente?.descricao || '',
    observacao: existente?.observacao || ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  const salvar = async () => {
    if (!f.nome.trim()) { setErro('Informe o nome da atividade.'); return; }
    if (!f.inicio || !f.termino) { setErro('Informe início e término.'); return; }
    if (f.termino < f.inicio) { setErro('O término não pode ser antes do início.'); return; }
    setSalvando(true); setErro('');
    const pct = f.status === 'Concluído' ? 100 : Math.max(0, Math.min(100, Number(f.percentual) || 0));
    const campos = {
      nome: f.nome.trim(), fase: f.fase, equipe: f.equipe.trim() || 'Systech', status: f.status, percentual: pct,
      inicio: f.inicio, termino: f.termino, marco: f.marco, descricao: f.descricao.trim(), observacao: f.observacao.trim()
    };
    try {
      if (nova) {
        await criarAtividade(projeto.codigo, {
          ...campos, codigo: f.codigo.trim(), pai: f.pai, duracao: 0,
          // nova atividade entra com a baseline igual ao previsto
          baselineInicio: f.inicio, baselineTermino: f.termino
        });
        toast('Atividade incluída no cronograma.');
      } else {
        await salvarAtividade(projeto.codigo, existente.codigo, campos);
        toast('Alteração salva.');
      }
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  const excluir = async () => {
    if (!existente) return;
    const extra = filhos.length ? ` e as ${filhos.length} subatividades` : '';
    if (!confirm(`Excluir a atividade ${existente.codigo} · ${existente.nome}${extra}? Esta ação não pode ser desfeita.`)) return;
    setSalvando(true);
    try { await excluirAtividade(projeto.codigo, existente.codigo); toast('Atividade excluída.'); aoFechar(); }
    catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar}
      titulo={nova ? 'Nova atividade' : `${existente.codigo} · ${existente.nome}`}
      subtitulo={nova ? `${projeto.codigo} · cronograma` : `${projeto.codigo} · ${existente.fase} · ${existente.equipe}${existente.duracao ? ` · ${existente.duracao} dias úteis` : ''}`}
      rotuloSalvar={nova ? 'Incluir atividade' : 'Salvar'}
      acoes={!nova && estrutura && <button type="button" className="btn perigo" disabled={salvando} onClick={excluir}>Excluir</button>}>
      {!estrutura && <div className="msg info">Perfil {papel}: você atualiza status, % concluído e observação. Datas e escopo da atividade são definidos pelo GP.</div>}
      <div className="fg2">
        <label className="campo">Código
          <input className="ctl" value={f.codigo} onChange={muda('codigo')} disabled={!nova} title={nova ? undefined : 'O código identifica a atividade e não pode ser alterado'} />
        </label>
        <label className="campo">Fase
          <select className="ctl" disabled={!estrutura} value={f.fase} onChange={e => setF(s => ({ ...s, fase: e.target.value as Fase }))}>{FASES.map(x => <option key={x}>{x}</option>)}</select>
        </label>
      </div>
      <label className="campo">Atividade *<input className="ctl" value={f.nome} onChange={muda('nome')} disabled={!estrutura} placeholder="O que será feito" /></label>
      <div className="fg2">
        <label className="campo">Equipe<input className="ctl" value={f.equipe} onChange={muda('equipe')} disabled={!estrutura} placeholder="Systech, cliente ou ambos" /></label>
        {nova
          ? <label className="campo">Subatividade de
              <select className="ctl" value={f.pai} onChange={muda('pai')}>
                <option value="">— atividade principal —</option>
                {macros.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} · {a.nome}</option>)}
              </select>
            </label>
          : <label className="campo">Status
              <select className="ctl" value={f.status} onChange={e => setF(s => ({ ...s, status: e.target.value as StatusAtividade }))}>{STATUS_ATIVIDADE.map(s => <option key={s}>{s}</option>)}</select>
            </label>}
        <label className="campo">Início previsto *<input className="ctl" type="date" value={f.inicio} onChange={muda('inicio')} disabled={!estrutura} /></label>
        <label className="campo">Término previsto *<input className="ctl" type="date" value={f.termino} onChange={muda('termino')} disabled={!estrutura} /></label>
        {!nova && <label className="campo">% concluído<input className="ctl" type="number" min={0} max={100} value={f.percentual} onChange={muda('percentual')} /></label>}
      </div>
      <label className="checar"><input type="checkbox" disabled={!estrutura} checked={f.marco} onChange={e => setF(s => ({ ...s, marco: e.target.checked }))} />
        <span>É um marco<br /><span className="sub">Entrega que exige aceite do cliente; aparece com losango no Gantt e em “Próximos marcos”.</span></span></label>
      {existente && <div className="sub">Baseline: {dma(existente.baselineInicio)} a {dma(existente.baselineTermino)}</div>}
      <label className="campo">Descrição<textarea className="ctl" value={f.descricao} onChange={muda('descricao')} disabled={!estrutura} placeholder="Escopo da atividade" /></label>
      {!nova && (
        <label className="campo">Observação / próximo passo
          <textarea className="ctl" value={f.observacao} onChange={muda('observacao')} placeholder="O que falta, quem depende de quem e qual a próxima data." />
        </label>
      )}
      {filhos.length > 0 && (
        <div>
          <div className="h3" style={{ fontSize: 14 }}>Subatividades</div>
          <ul className="ul">{filhos.map(s => <li key={s.codigo}>{s.nome} <span className="sub">· {s.equipe}</span></li>)}</ul>
        </div>
      )}
    </Drawer>
  );
}
