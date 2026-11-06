import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Atividade, Fase, NovaReuniao, Projeto, StatusAtividade } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { usePapel } from '../../../state/PapelContext';
import { macro } from '../../../lib/calculos';
import { codigoDaFase, codigoSubatividade, FASES, STATUS_ATIVIDADE } from '../../../lib/constantes';
import { dma } from '../../../lib/datas';
import { Drawer } from '../../ui/Drawer';
import { convidados, formReuniaoInicial, ReuniaoTeams, type FormReuniao } from './ReuniaoTeams';
import { Confirmacao } from '../../ui/Confirmacao';
import { VisaoAtividade } from './VisaoAtividade';
import { Mensagem } from '../../ui/Mensagem';
import { diasUteis } from '../../../lib/datas';
import { avisoFimDeSemana, avisoHorasPlanejadas, avisoSobrecarga, tarefasNoPeriodo } from '../../../lib/validacoes';
import { candidatas } from '../../../lib/dependencias';
import { percentualPrincipal } from '../../../lib/calculos';
import { AcompanhamentoAtividade } from '../AcompanhamentoAtividade';

interface Props {
  projeto: Projeto;
  /** sem código = nova atividade */
  codigo?: string;
  /** fase sugerida para a nova atividade (a selecionada no ciclo de vida) */
  faseInicial?: Fase | null;
  aoFechar: () => void;
  /** chamado ao incluir uma subatividade, com o código da atividade principal */
  aoCriarSubatividade?: (pai: string) => void;
  /** nova subatividade já ligada a esta atividade principal */
  paiInicial?: string;
  /** botão "+ Subatividade" no painel de uma atividade principal */
  aoNovaSubatividade?: (pai: string) => void;
}

const proximoCodigoFilho = (lista: Atividade[], pai: string) => codigoSubatividade(lista.map(a => a.codigo), pai);

/** Próximo código de atividade na fase (Iniciação 1.0, 1.1…; Planejamento 2.0…; Execução 3.0…). */
const proximoCodigo = (lista: Atividade[], fase: Fase) => codigoDaFase(lista.map(a => a.codigo), fase);

/** Cria, edita ou exclui uma atividade do cronograma. */
export function EditarAtividade({ projeto, codigo, faseInicial, aoFechar, aoCriarSubatividade, paiInicial, aoNovaSubatividade }: Props) {
  const { hoje, dados, salvarAtividade, criarAtividade, excluirAtividade, agendarReuniao, atualizarReuniao, cancelarReuniao, lerReuniao, reuniaoGravavel, fonte, email: meuEmail, lancarTarefas, tarefasGravaveis } = usePortal();
  const toast = useToast();
  const { pode, papel } = usePapel();
  const navegar = useNavigate();
  const encerrado = projeto.situacaoCadastro === 'Encerrado';   // projeto encerrado: só consulta
  const estrutura = pode('gerenciarAtividades') && !encerrado;   // nome, fase, equipe, datas, marco, descrição
  const lista = dados.atividades[projeto.codigo] || [];
  const existente = codigo ? lista.find(x => x.codigo === codigo) : undefined;
  const nova = !existente;
  const filhos = existente ? lista.filter(x => x.pai === existente.codigo) : [];
  const macros = macro(dados, projeto.codigo);

  const principalInicial = !existente && paiInicial ? macros.find(m => m.codigo === paiInicial) : undefined;
  const [f, setF] = useState({
    codigo: existente?.codigo || (principalInicial ? proximoCodigoFilho(lista, principalInicial.codigo) : proximoCodigo(lista, faseInicial || 'Iniciação')),
    nome: existente?.nome || '',
    fase: (existente?.fase || principalInicial?.fase || faseInicial || 'Iniciação') as Fase,
    equipe: existente?.equipe || 'Systech',
    status: (existente?.status || 'Planejado') as StatusAtividade,
    percentual: String(existente?.percentual ?? 0),
    inicio: existente?.inicio || principalInicial?.inicio || '',
    termino: existente?.termino || principalInicial?.termino || '',
    marco: existente?.marco || false,
    pai: existente?.pai || principalInicial?.codigo || '',
    descricao: existente?.descricao || '',
    observacao: existente?.observacao || '',
    responsavel: existente?.responsavel || '',
    predecessoras: existente?.predecessoras || ([] as string[]),
    horasPlanejadas: existente?.horasPlanejadas === undefined ? '' : String(existente.horasPlanejadas),
    /** nova subatividade: já lançar para o técnico? (padrão: não — o PMO lança depois) */
    lancar: false
  });
  // outras tarefas abertas do mesmo técnico no período (todos os projetos)
  const sobrecarga = avisoSobrecarga(tarefasNoPeriodo(dados, f.responsavel, f.inicio, f.termino, existente ? { projeto: projeto.codigo, codigo: existente.codigo } : undefined));
  const [salvando, setSalvando] = useState(false);
  /** atividade existente abre só para visualização; quem pode editar clica em "Liberar edição" */
  const [liberada, setLiberada] = useState(!codigo);
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
        marcados, extras: r.participantes.filter(e => !daEquipe.has(e)) });
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

  /** mudar a fase de uma atividade existente pede confirmação */
  const [confirmarFase, setConfirmarFase] = useState(false);
  const faseConfirmada = useRef(false);
  const salvar = async () => {
    if (existente && f.fase !== existente.fase && !faseConfirmada.current) { setConfirmarFase(true); return; }
    faseConfirmada.current = false;
    if (!f.nome.trim()) { setErro('Informe o nome da atividade.'); return; }
    if (nova && f.pai && !f.codigo.startsWith(f.pai + '.')) { setErro(`O código da subatividade deve seguir o da principal (${f.pai}.1, ${f.pai}.2…).`); return; }
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
      responsavel: f.responsavel, predecessoras: f.predecessoras,
      horasPlanejadas: f.horasPlanejadas === '' ? undefined : Math.max(0, Number(f.horasPlanejadas) || 0)
    };
    if (nova && f.pai && f.lancar && !f.responsavel) { setErro('Escolha o técnico responsável para lançar a tarefa.'); setSalvando(false); return; }
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
          ...(f.pai ? { lancada: f.lancar } : {}),
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

  const lancar = async (codigos: string[]) => {
    try { await lancarTarefas(projeto.codigo, codigos); toast(codigos.length === 1 ? 'Tarefa lançada para o técnico.' : `${codigos.length} tarefas lançadas para os técnicos.`); }
    catch (e) { toast((e as Error).message); }
  };
  if (existente && !liberada) {
    const podeEditar = pode('atualizarAtividade') && !encerrado;
    return (
      <Drawer aberto somenteLeitura salvando={false} aoFechar={aoFechar} aoSalvar={() => undefined}
        titulo={`${existente.codigo} · ${existente.nome}`}
        subtitulo={`${projeto.codigo} · ${existente.fase} · ${existente.equipe}`}
        acoes={<>
          {!encerrado && pode('gerenciarAtividades') && existente.pai && existente.lancada === false &&
            <button type="button" className="btn" onClick={() => lancar([existente.codigo])}>Lançar para o técnico</button>}
          {!encerrado && pode('gerenciarAtividades') && !existente.pai && filhos.some(x => x.lancada === false) &&
            <button type="button" className="btn" onClick={() => lancar(filhos.filter(x => x.lancada === false).map(x => x.codigo))}>Lançar {filhos.filter(x => x.lancada === false).length} tarefa(s)</button>}
          {!encerrado && pode('gerenciarAtividades') && !existente.pai && aoNovaSubatividade &&
            <button type="button" className="btn" onClick={() => aoNovaSubatividade(existente.codigo)}>+ Subatividade</button>}
          {papel === 'Técnico'
            ? (!encerrado && existente.pai && existente.status !== 'Concluído' && existente.status !== 'Cancelado' &&
                <button type="button" className="btn pri" onClick={() => navegar(`/atualizar?item=${encodeURIComponent(`${projeto.codigo}|${existente.codigo}`)}`)}>Atualizar status</button>)
            : podeEditar && <button type="button" className="btn pri" onClick={() => setLiberada(true)}>✎ Liberar edição</button>}
        </>}>
        <VisaoAtividade projeto={projeto} a={existente} filhos={filhos} lista={lista} mostrarLancamento={papel === 'PMO' || papel === 'Patrocinador'} />
        {existente.reuniaoUrl && (
          <div className="reuniaoAgendada">
            <span>Reunião do Teams{existente.reuniaoTipo ? ` · ${existente.reuniaoTipo}` : ''}{existente.reuniaoInicio ? ` em ${quando(existente.reuniaoInicio)}` : ''}</span>
            <a className="btn pq" href={existente.reuniaoUrl} target="_blank" rel="noopener noreferrer">Entrar no Teams ↗</a>
          </div>
        )}
        {papel !== 'Cliente' && <AcompanhamentoAtividade projeto={projeto} a={existente} compacto />}
        {encerrado ? <Mensagem tipo="info">Projeto encerrado: somente consulta.</Mensagem> : !podeEditar && <p className="sub">Visualização apenas.</p>}
      </Drawer>
    );
  }

  return (
    <Drawer aberto salvando={salvando} erro={erro} aoFechar={aoFechar} aoSalvar={salvar}
      titulo={nova ? 'Nova atividade' : `${existente.codigo} · ${existente.nome}`}
      subtitulo={nova ? `${projeto.codigo} · cronograma` : `${projeto.codigo} · ${existente.fase} · ${existente.equipe}${existente.duracao ? ` · ${existente.duracao} dias úteis` : ''}`}
      rotuloSalvar={nova ? 'Incluir atividade' : 'Salvar'}
      acoes={!nova && estrutura && <button type="button" className="btn perigo" disabled={salvando} onClick={excluir}>Excluir</button>}>
      {!estrutura && <div className="msg info">Perfil {papel}: você atualiza status, % concluído e observação. Datas e escopo da atividade são definidos pelo PMO.</div>}
      <div className="fg2">
        <label className="campo">Código
          <input className="ctl mono" value={f.codigo} disabled
            title={!nova ? 'O código identifica a atividade e não pode ser alterado' : 'Gerado automaticamente'} />
        </label>
        <label className="campo">Fase
          <select className="ctl" disabled={!estrutura || (nova && !!f.pai)} value={f.fase} onChange={e => {
            const fase = e.target.value as Fase;
            setF(s => ({ ...s, fase, codigo: nova && !s.pai ? proximoCodigo(lista, fase) : s.codigo }));
          }}>{FASES.map(x => <option key={x}>{x}</option>)}</select>
        </label>
      </div>
      <label className="campo">Atividade *<input className="ctl" value={f.nome} onChange={muda('nome')} disabled={!estrutura} placeholder="O que será feito" /></label>
      <div className="fg2">
        <label className="campo">Equipe<input className="ctl" value={f.equipe} onChange={muda('equipe')} disabled={!estrutura} placeholder="Systech, cliente ou ambos" /></label>
        <label className="campo">{f.pai ? 'Técnico responsável' : 'Responsável'}
          <select className="ctl" value={f.responsavel} onChange={muda('responsavel')} disabled={!estrutura}>
            <option value="">{f.pai ? '— escolha o técnico —' : '— sem responsável —'}</option>
            {projeto.equipe.filter(m => m.email).map(m => <option key={m.email} value={m.email.toLowerCase()}>{m.nome} · {m.funcao}</option>)}
          </select>
          {estrutura && f.pai && sobrecarga && <span className="dica fds">Atenção: {projeto.equipe.find(m => m.email.toLowerCase() === f.responsavel)?.nome || 'esse técnico'} {sobrecarga}.</span>}
        </label>
        {estrutura && !tarefasGravaveis && <Mensagem tipo="info">Para lançar tarefas e usar pré-requisitos, rode o script provisionar-portal.ps1 (sem -Piloto) e recarregue o portal.</Mensagem>}
        {nova && f.pai && estrutura && (
          <label className="chk"><input type="checkbox" checked={f.lancar} onChange={e => setF(s => ({ ...s, lancar: e.target.checked }))} />
            Lançar para o técnico agora <span className="sub">(sem marcar, a tarefa fica em preparação e o técnico não a vê)</span></label>
        )}
        {estrutura && (
          <label className="campo">Horas planejadas
            <input className="ctl" type="number" min={0} step={0.5} placeholder="0" value={f.horasPlanejadas} onChange={e => setF(s => ({ ...s, horasPlanejadas: e.target.value }))} />
            {avisoHorasPlanejadas(Number(f.horasPlanejadas), diasUteis(f.inicio, f.termino)) && <span className="dica fds">Atenção: {avisoHorasPlanejadas(Number(f.horasPlanejadas), diasUteis(f.inicio, f.termino))}.</span>}
          </label>
        )}
        {estrutura && (
          <label className="campo">Pré-requisito
            <select className="ctl" value={f.predecessoras[0] || ''} onChange={e => setF(s => ({ ...s, predecessoras: e.target.value ? [e.target.value] : [] }))}>
              <option value="">— nenhum —</option>
              {candidatas(nova ? [...lista, { codigo: f.codigo, pai: f.pai, nome: f.nome } as unknown as Atividade] : lista, f.codigo).map(c => (
                <option key={c.codigo} value={c.codigo}>{c.pai ? '   ↳ ' : ''}{c.codigo} · {c.nome}{c.status === 'Concluído' ? ' (concluída)' : ''}</option>
              ))}
            </select>
            <span className="dica">Só pode começar quando o pré-requisito estiver concluído.</span>
          </label>
        )}
        {nova
          ? <label className="campo">Subatividade de
              <select className="ctl" value={f.pai} onChange={e => {
                const pai = e.target.value, principal = macros.find(m => m.codigo === pai);
                setF(s => ({ ...s, pai, codigo: pai ? proximoCodigoFilho(lista, pai) : proximoCodigo(lista, s.fase), fase: principal ? principal.fase : s.fase,
                  inicio: s.inicio || principal?.inicio || '', termino: s.termino || principal?.termino || '' }));
              }}>
                <option value="">— atividade principal —</option>
                {macros.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} · {a.nome}</option>)}
              </select>
            </label>
          : <label className="campo">Status
              <select className="ctl" value={f.status} onChange={e => setF(s => ({ ...s, status: e.target.value as StatusAtividade }))}>{STATUS_ATIVIDADE.map(s => <option key={s}>{s}</option>)}</select>
            </label>}
        <label className="campo">Início previsto *<input className="ctl" type="date" min={nova || f.inicio !== existente?.inicio ? hoje : undefined} value={f.inicio} onChange={muda('inicio')} disabled={!estrutura} />{estrutura && avisoFimDeSemana(f.inicio) && <span className="dica fds">Atenção: {avisoFimDeSemana(f.inicio)}.</span>}</label>
        <label className="campo">Término previsto *<input className="ctl" type="date" min={nova || f.termino !== existente?.termino ? (f.inicio > hoje ? f.inicio : hoje) : undefined} value={f.termino} onChange={muda('termino')} disabled={!estrutura} />{estrutura && avisoFimDeSemana(f.termino) && <span className="dica fds">Atenção: {avisoFimDeSemana(f.termino)}.</span>}</label>
        {!nova && (existente?.pai
          ? <label className="campo">% concluído<input className="ctl" type="number" min={0} max={100} value={f.percentual} onChange={muda('percentual')} /></label>
          : <label className="campo">% concluído
              <input className="ctl" type="number" disabled value={percentualPrincipal(existente!, filhos, f.status)} />
              <span className="dica">{filhos.filter(x => x.status !== 'Cancelado').length
                ? `Calculado: ${filhos.filter(x => x.status === 'Concluído').length} de ${filhos.filter(x => x.status !== 'Cancelado').length} subatividades concluídas`
                : 'Sem subatividades: 0% até concluir a atividade'}</span>
            </label>)}
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
      {confirmarFase && existente && (
        <Confirmacao titulo={`Mudar ${existente.codigo} de fase?`} rotuloConfirmar="Mudar de fase"
          aoCancelar={() => setConfirmarFase(false)}
          aoConfirmar={() => { setConfirmarFase(false); faseConfirmada.current = true; salvar(); }}>
          <p className="sub" style={{ fontSize: 14 }}>
            A atividade <b>{existente.nome}</b> passa de <b>{existente.fase}</b> para <b>{f.fase}</b>.
            {filhos.length > 0 && <> As {filhos.length} subatividades acompanham a nova fase e mantêm progresso, datas, status e responsáveis.</>}
          </p>
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
