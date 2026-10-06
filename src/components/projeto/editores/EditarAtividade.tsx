import { useState } from 'react';
import type { Atividade, Fase, NovaReuniao, Projeto, StatusAtividade } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { usePapel } from '../../../state/PapelContext';
import { macro } from '../../../lib/calculos';
import { FASES, STATUS_ATIVIDADE } from '../../../lib/constantes';
import { dma } from '../../../lib/datas';
import { Drawer } from '../../ui/Drawer';
import { convidados, formReuniaoInicial, ReuniaoTeams, type FormReuniao } from './ReuniaoTeams';
import { Confirmacao } from '../../ui/Confirmacao';

interface Props {
  projeto: Projeto;
  /** sem código = nova atividade */
  codigo?: string;
  /** fase sugerida para a nova atividade (a selecionada no ciclo de vida) */
  faseInicial?: Fase | null;
  aoFechar: () => void;
  /** chamado ao incluir uma subatividade, com o código da atividade principal */
  aoCriarSubatividade?: (pai: string) => void;
}

/** Próximo código de subatividade: 3.2 → 3.2.1, 3.2.2… */
function proximoCodigoFilho(lista: Atividade[], pai: string): string {
  const nums = lista.filter(a => a.pai === pai).map(a => Number(a.codigo.split('.').pop())).filter(n => !isNaN(n));
  return `${pai}.${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

function proximoCodigo(lista: Atividade[]): string {
  const nums = lista.filter(a => !a.pai).map(a => Number(String(a.codigo).split('.').pop())).filter(n => !isNaN(n));
  const pref = lista.find(a => /^\d+\.\d+$/.test(a.codigo))?.codigo.split('.')[0];
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return pref ? `${pref}.${n}` : String(n);
}

/** Cria, edita ou exclui uma atividade do cronograma. */
export function EditarAtividade({ projeto, codigo, faseInicial, aoFechar, aoCriarSubatividade }: Props) {
  const { hoje, dados, salvarAtividade, criarAtividade, excluirAtividade, agendarReuniao, atualizarReuniao, cancelarReuniao, lerReuniao, reuniaoGravavel, fonte, email: meuEmail } = usePortal();
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
    observacao: existente?.observacao || '',
    responsavel: existente?.responsavel || ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [reuniao, setReuniao] = useState<FormReuniao>(() => formReuniaoInicial(
    projeto.equipe, '', existente?.inicio || '', meuEmail));   // título vazio = automático "Tipo · projeto · atividade"
  const podeAgendar = estrutura && !!fonte.criarReuniaoTeams && reuniaoGravavel;
  /** editando a reunião já existente (em vez de criar outra) */
  const [editandoReuniao, setEditandoReuniao] = useState(false);
  /** como a reunião estava antes da edição (para o e-mail "antes → agora") */
  const [reuniaoOriginal, setReuniaoOriginal] = useState<NovaReuniao | undefined>(undefined);
  const [carregandoReuniao, setCarregandoReuniao] = useState(false);
  const [cancelar, setCancelar] = useState<null | { mensagem: string; ocupado: boolean; erro: string }>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<null | { cancelarReuniao: boolean; ocupado: boolean }>(null);
  const temReuniao = !!existente?.reuniaoId;
  const quando = (s?: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} às ${s.slice(11, 16)}` : '');

  const abrirEdicaoReuniao = async () => {
    if (!existente) return;
    setCarregandoReuniao(true); setErro('');
    try {
      const r = { ...(await lerReuniao(existente)), tipo: existente.reuniaoTipo || 'Alinhamento' };
      setReuniaoOriginal(r);
      const daEquipe = new Set(projeto.equipe.filter(m => m.email).map(m => m.email.toLowerCase()));
      const marcados: Record<string, boolean> = {};
      for (const e of daEquipe) if (e !== meuEmail.toLowerCase()) marcados[e] = r.participantes.includes(e);
      setReuniao({ ativa: true, tipo: r.tipo, titulo: r.titulo, data: r.inicio.slice(0, 10), hora: r.inicio.slice(11, 16), duracaoMin: r.duracaoMin, pauta: '',
        marcados, extras: r.participantes.filter(e => !daEquipe.has(e)).join(', ') });
      setEditandoReuniao(true);
    } catch (e) { setErro('Não foi possível abrir a reunião: ' + (e as Error).message); }
    finally { setCarregandoReuniao(false); }
  };

  const confirmarCancelamento = async () => {
    if (!existente || !cancelar) return;
    setCancelar({ ...cancelar, ocupado: true, erro: '' });
    try {
      await cancelarReuniao(projeto.codigo, existente, cancelar.mensagem.trim());
      toast('Reunião cancelada. Os convidados recebem o cancelamento pelo Outlook.');
      setCancelar(null); aoFechar();
    } catch (e) { setCancelar({ ...cancelar, ocupado: false, erro: (e as Error).message }); }
  };
  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  const salvar = async () => {
    if (!f.nome.trim()) { setErro('Informe o nome da atividade.'); return; }
    if (!f.inicio || !f.termino) { setErro('Informe início e término.'); return; }
    if (f.termino < f.inicio) { setErro('O término não pode ser antes do início.'); return; }
    // datas novas ou alteradas não podem ficar no passado (datas antigas que não mudaram continuam valendo)
    const br = (s: string) => s.split('-').reverse().join('/');
    if ((nova || f.inicio !== existente?.inicio) && f.inicio < hoje) { setErro(`O início não pode ser antes de hoje (${br(hoje)}).`); return; }
    if ((nova || f.termino !== existente?.termino) && f.termino < hoje) { setErro(`O término não pode ser antes de hoje (${br(hoje)}).`); return; }
    if (reuniao.ativa && (reuniao.data || f.inicio) < hoje) { setErro(`A reunião não pode ser marcada antes de hoje (${br(hoje)}).`); return; }
    setSalvando(true); setErro('');
    const pct = f.status === 'Concluído' ? 100 : Math.max(0, Math.min(100, Number(f.percentual) || 0));
    const campos = {
      nome: f.nome.trim(), fase: f.fase, equipe: f.equipe.trim() || 'Systech', status: f.status, percentual: pct,
      inicio: f.inicio, termino: f.termino, marco: f.marco, descricao: f.descricao.trim(), observacao: f.observacao.trim(),
      responsavel: f.responsavel
    };
    // validação da reunião antes de gravar qualquer coisa
    const vaiReunir = reuniao.ativa && (editandoReuniao || podeAgendar);
    const dataReuniao = reuniao.data || f.inicio;
    if (vaiReunir) {
      if (!dataReuniao || !reuniao.hora) { setErro('Informe data e horário da reunião.'); setSalvando(false); return; }
      if (!convidados(reuniao).length) { setErro('Marque ao menos um participante para a reunião.'); setSalvando(false); return; }
    }
    try {
      let atv: Atividade;
      if (nova) {
        atv = await criarAtividade(projeto.codigo, {
          ...campos, codigo: f.codigo.trim(), pai: f.pai, duracao: 0,
          // nova atividade entra com a baseline igual ao previsto
          baselineInicio: f.inicio, baselineTermino: f.termino
        });
        if (f.pai) aoCriarSubatividade?.(f.pai);
      } else {
        await salvarAtividade(projeto.codigo, existente.codigo, campos);
        atv = { ...existente, ...campos };
      }
      if (vaiReunir) {
        try {
          const titulo = reuniao.titulo.trim() || `${reuniao.tipo} · ${projeto.codigo} · ${atv.codigo} ${atv.nome}`;
          const dadosReuniao = { tipo: reuniao.tipo, titulo, inicio: `${dataReuniao}T${reuniao.hora}`, duracaoMin: reuniao.duracaoMin, pauta: reuniao.pauta.trim(), participantes: convidados(reuniao) };
          if (editandoReuniao) {
            const { convidados: lista, email } = await atualizarReuniao(projeto.codigo, atv, dadosReuniao, reuniaoOriginal);
            toast(`Reunião atualizada${lista.length ? ` para: ${lista.join(', ')}` : ''}.${email && !email.startsWith('falhou') ? ' Resumo da alteração enviado por e-mail.' : email ? ` O e-mail de resumo não saiu (${email.replace('falhou: ', '')}).` : ''}`);
            aoFechar();
            return;
          }
          const lista = await agendarReuniao(projeto.codigo, atv, dadosReuniao);
          toast(lista.length
            ? `${nova ? 'Atividade incluída' : 'Alteração salva'}. Reunião do Teams criada na sua agenda e convite enviado para: ${lista.join(', ')}.`
            : `${nova ? 'Atividade incluída' : 'Alteração salva'}. Reunião do Teams criada na sua agenda. Nenhum convite foi enviado: você é o organizador e era o único convidado.`);
        } catch (e) {
          toast(`${nova ? 'Atividade incluída' : 'Alteração salva'}, mas a reunião não foi ${editandoReuniao ? 'atualizada' : 'criada'}: ${(e as Error).message}.`);
        }
      } else {
        toast(nova ? (f.pai ? `Subatividade incluída dentro de ${f.pai}.` : 'Atividade incluída no cronograma.') : 'Alteração salva.');
      }
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  const excluir = () => { if (existente) setConfirmarExclusao({ cancelarReuniao: temReuniao, ocupado: false }); };
  const confirmarExcluir = async () => {
    if (!existente || !confirmarExclusao) return;
    setConfirmarExclusao({ ...confirmarExclusao, ocupado: true });
    try {
      await excluirAtividade(projeto.codigo, existente.codigo, { cancelarReunioes: confirmarExclusao.cancelarReuniao });
      toast(confirmarExclusao.cancelarReuniao ? 'Atividade excluída e reunião cancelada.' : 'Atividade excluída.');
      aoFechar();
    } catch (e) { setErro((e as Error).message); setConfirmarExclusao(null); }
  };

  return (
    <Drawer aberto salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar}
      titulo={nova ? 'Nova atividade' : `${existente.codigo} · ${existente.nome}`}
      subtitulo={nova ? `${projeto.codigo} · cronograma` : `${projeto.codigo} · ${existente.fase} · ${existente.equipe}${existente.duracao ? ` · ${existente.duracao} dias úteis` : ''}`}
      rotuloSalvar={nova ? 'Incluir atividade' : 'Salvar'}
      acoes={!nova && estrutura && <button type="button" className="btn perigo" disabled={salvando} onClick={excluir}>Excluir</button>}>
      {!estrutura && <div className="msg info">Perfil {papel}: você atualiza status, % concluído e observação. Datas e escopo da atividade são definidos pelo PMO.</div>}
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
        <label className="campo">Responsável
          <select className="ctl" value={f.responsavel} onChange={muda('responsavel')} disabled={!estrutura}>
            <option value="">— sem responsável —</option>
            {projeto.equipe.filter(m => m.email).map(m => <option key={m.email} value={m.email.toLowerCase()}>{m.nome} · {m.funcao}</option>)}
          </select>
        </label>
        {nova
          ? <label className="campo">Subatividade de
              <select className="ctl" value={f.pai} onChange={e => {
                const pai = e.target.value, principal = macros.find(m => m.codigo === pai);
                setF(s => ({ ...s, pai, codigo: pai ? proximoCodigoFilho(lista, pai) : proximoCodigo(lista), fase: principal ? principal.fase : s.fase,
                  inicio: s.inicio || principal?.inicio || '', termino: s.termino || principal?.termino || '' }));
              }}>
                <option value="">— atividade principal —</option>
                {macros.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} · {a.nome}</option>)}
              </select>
            </label>
          : <label className="campo">Status
              <select className="ctl" value={f.status} onChange={e => setF(s => ({ ...s, status: e.target.value as StatusAtividade }))}>{STATUS_ATIVIDADE.map(s => <option key={s}>{s}</option>)}</select>
            </label>}
        <label className="campo">Início previsto *<input className="ctl" type="date" min={nova || f.inicio !== existente?.inicio ? hoje : undefined} value={f.inicio} onChange={muda('inicio')} disabled={!estrutura} /></label>
        <label className="campo">Término previsto *<input className="ctl" type="date" min={nova || f.termino !== existente?.termino ? (f.inicio > hoje ? f.inicio : hoje) : undefined} value={f.termino} onChange={muda('termino')} disabled={!estrutura} /></label>
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
      {temReuniao && (
        <div className="reuniaoAgendada">
          <span>Reunião do Teams{existente!.reuniaoTipo ? ` · ${existente!.reuniaoTipo}` : ''}{existente!.reuniaoInicio ? ` em ${quando(existente!.reuniaoInicio)}` : ''}</span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {existente!.reuniaoUrl && <a className="btn pq" href={existente!.reuniaoUrl} target="_blank" rel="noopener noreferrer">Entrar no Teams ↗</a>}
            {estrutura && !editandoReuniao && <>
              <button type="button" className="btn pq" disabled={carregandoReuniao} onClick={abrirEdicaoReuniao}>{carregandoReuniao ? 'Abrindo…' : 'Editar reunião'}</button>
              <button type="button" className="btn pq perigo" onClick={() => setCancelar({ mensagem: '', ocupado: false, erro: '' })}>Cancelar reunião</button>
            </>}
          </span>
        </div>
      )}
      {estrutura && (!temReuniao || editandoReuniao) && (
        <ReuniaoTeams equipe={projeto.equipe} meuEmail={meuEmail} edicao={editandoReuniao} dataMinima={hoje}
          disponivel={editandoReuniao || (!!fonte.criarReuniaoTeams && reuniaoGravavel)}
          motivo={!fonte.criarReuniaoTeams ? 'Disponível no modo conectado ao SharePoint.'
            : !reuniaoGravavel ? 'Indisponível: a lista Portal Atividades ainda não tem as colunas da reunião. Rode o script provisionar-portal.ps1 (sem -Piloto) e recarregue o portal.' : ''}
          form={{ ...reuniao, titulo: reuniao.titulo || `${reuniao.tipo} · ${projeto.codigo} · ${f.codigo} ${f.nome}`.trim(), data: reuniao.data || f.inicio }}
          aoMudar={setReuniao} />
      )}
      {cancelar && (
        <Confirmacao titulo="Cancelar a reunião do Teams?" rotuloConfirmar="Cancelar reunião" ocupado={cancelar.ocupado} erro={cancelar.erro}
          aoCancelar={() => setCancelar(null)} aoConfirmar={confirmarCancelamento}>
          <p className="sub" style={{ fontSize: 14 }}>Os convidados recebem o cancelamento pelo Outlook e o link sai da atividade. A atividade continua no cronograma.</p>
          <label className="campo">Mensagem aos convidados (opcional)
            <textarea className="ctl" rows={3} value={cancelar.mensagem} onChange={e => setCancelar({ ...cancelar, mensagem: e.target.value })} placeholder="Ex.: reunião remarcada para a próxima semana." />
          </label>
        </Confirmacao>
      )}
      {confirmarExclusao && existente && (
        <Confirmacao titulo={`Excluir a atividade ${existente.codigo}?`} rotuloConfirmar="Excluir atividade" ocupado={confirmarExclusao.ocupado}
          aoCancelar={() => setConfirmarExclusao(null)} aoConfirmar={confirmarExcluir}>
          <p className="sub" style={{ fontSize: 14 }}>{existente.nome}{filhos.length ? ` e as ${filhos.length} subatividades` : ''} serão excluídas. Esta ação não pode ser desfeita.</p>
          {temReuniao && (
            <label className="checar">
              <input type="checkbox" checked={confirmarExclusao.cancelarReuniao} onChange={e => setConfirmarExclusao({ ...confirmarExclusao, cancelarReuniao: e.target.checked })} />
              <span>Cancelar também a reunião do Teams de {quando(existente.reuniaoInicio)}<br /><span className="sub">Os convidados recebem o cancelamento. Desmarcado, a reunião continua na agenda.</span></span>
            </label>
          )}
        </Confirmacao>
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
