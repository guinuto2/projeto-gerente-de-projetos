import { useState } from 'react';
import { avisoFimDeSemana, avisoHorasPlanejadas, avisoSobrecarga, tarefasNoPeriodo } from '../../lib/validacoes';
import type { Atividade, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { usePapel } from '../../state/PapelContext';
import { useToast } from '../../state/ToastContext';
import { codigoSubatividade } from '../../lib/constantes';
import { diasUteis } from '../../lib/datas';
import { Mensagem } from '../ui/Mensagem';

interface Props {
  /** projetos em que a subatividade pode ser criada (um só, quando a atividade principal já é conhecida) */
  projetos: Projeto[];
  /** atividade principal já escolhida; sem ela, a pessoa escolhe o projeto e a atividade */
  pai?: Atividade;
  meuEmail: string;
  aoCriada: (codigo: string, projeto: string) => void;
  aoCancelar: () => void;
  /** como chamar a subatividade na tela ("tarefa" para o técnico) */
  termo?: string;
}

/** Inclusão rápida de subatividade (atualização semanal). */
export function NovaSubatividade({ projetos, pai: paiFixo, meuEmail, aoCriada, aoCancelar, termo = 'subatividade' }: Props) {
  const Termo = termo[0].toUpperCase() + termo.slice(1);
  const { dados, hoje, criarAtividade } = usePortal();
  const { papel } = usePapel();
  const toast = useToast();
  const [cod, setCod] = useState(projetos[0]?.codigo || '');
  const projeto = projetos.find(p => p.codigo === cod) || projetos[0];
  const lista = projeto ? dados.atividades[projeto.codigo] || [] : [];
  // atividades principais abertas do projeto escolhido
  const principais = lista.filter(a => !a.pai && a.status !== 'Concluído' && a.status !== 'Cancelado');
  const [codPai, setCodPai] = useState(paiFixo?.codigo || '');
  const pai = paiFixo || principais.find(a => a.codigo === codPai);
  const codigo = pai ? codigoSubatividade(lista.map(a => a.codigo), pai.codigo) : '';
  const pessoas = (projeto?.equipe || []).filter(m => m.email);
  // o técnico inclui para si mesmo; o PMO escolhe o técnico
  const [f, setF] = useState({ nome: '', inicio: '', termino: '', responsavel: papel === 'Técnico' ? meuEmail.toLowerCase() : '', lancar: false, horas: '' });
  const inicio = f.inicio || (pai ? (hoje > pai.inicio ? hoje : pai.inicio) : hoje);
  const termino = f.termino || (pai && pai.termino >= inicio ? pai.termino : inicio);
  const sobrecarga = avisoSobrecarga(tarefasNoPeriodo(dados, f.responsavel, inicio, termino));
  const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false);
  const br = (s: string) => s.split('-').reverse().join('/');
  const incluir = async () => {
    if (!projeto || !pai) { setErro('Escolha o projeto e a atividade principal.'); return; }
    if (!f.nome.trim()) { setErro(`Informe o nome da ${termo}.`); return; }
    if (inicio < hoje) { setErro(`O início não pode ser antes de hoje (${br(hoje)}).`); return; }
    if (termino < inicio) { setErro('O término não pode ser antes do início.'); return; }
    if (!f.responsavel) { setErro('Escolha o técnico responsável.'); return; }
    setSalvando(true); setErro('');
    try {
      await criarAtividade(projeto.codigo, {
        codigo, nome: f.nome.trim(), fase: pai.fase, equipe: pai.equipe, duracao: diasUteis(inicio, termino),
        inicio, termino, baselineInicio: inicio, baselineTermino: termino,
        status: 'Planejado', percentual: 0, marco: false, pai: pai.codigo, descricao: '', observacao: '', responsavel: f.responsavel,
        // a tarefa do próprio técnico já nasce lançada; a do PMO fica em preparação, a menos que ele marque para lançar
        lancada: papel === 'Técnico' ? true : f.lancar,
        horasPlanejadas: f.horas === '' ? undefined : Math.max(0, Number(f.horas) || 0)
      } as Atividade);
      toast(termo === 'tarefa' ? `Tarefa “${f.nome.trim()}” incluída.` : `${Termo} ${codigo} incluída dentro de ${pai.codigo}.`);
      aoCriada(codigo, projeto.codigo);
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  return (
    <div className="novaSub">
      <div className="h3" style={{ fontSize: 14 }}>{termo === 'tarefa' ? 'Nova tarefa' : <>Nova subatividade{codigo && <> <span className="mono sub">{codigo}</span></>}{pai ? ` dentro de ${pai.codigo}` : ''}</>}</div>
      {!paiFixo && (
        <>
          {projetos.length > 1 && (
            <label className="campo">Projeto *
              <select className="ctl" value={cod} onChange={e => { setCod(e.target.value); setCodPai(''); }}>
                {projetos.map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} · {p.nome}</option>)}
              </select>
            </label>
          )}
          <label className="campo">Atividade principal *
            <select className="ctl" value={codPai} onChange={e => setCodPai(e.target.value)}>
              <option value="">— escolha —</option>
              {principais.map(a => <option key={a.codigo} value={a.codigo}>{a.codigo} · {a.nome}</option>)}
            </select>
          </label>
        </>
      )}
      <label className="campo">Nome *<input className="ctl" autoFocus={!!paiFixo} value={f.nome} onChange={e => setF(s => ({ ...s, nome: e.target.value }))} placeholder="O que será feito" /></label>
      <div className="fg3">
        <label className="campo">Horas planejadas<input className="ctl" type="number" min={0} step={0.5} placeholder="0" value={f.horas} onChange={e => setF(s => ({ ...s, horas: e.target.value }))} />
          {avisoHorasPlanejadas(Number(f.horas), diasUteis(inicio, termino)) && <span className="dica fds">Atenção: {avisoHorasPlanejadas(Number(f.horas), diasUteis(inicio, termino))}.</span>}</label>
        <label className="campo">Início *<input className="ctl" type="date" min={hoje} value={inicio} onChange={e => setF(s => ({ ...s, inicio: e.target.value }))} />{avisoFimDeSemana(inicio) && <span className="dica fds">Atenção: {avisoFimDeSemana(inicio)}.</span>}</label>
        <label className="campo">Término *<input className="ctl" type="date" min={inicio} value={termino} onChange={e => setF(s => ({ ...s, termino: e.target.value }))} />{avisoFimDeSemana(termino) && <span className="dica fds">Atenção: {avisoFimDeSemana(termino)}.</span>}</label>
      </div>
      <label className="campo">Técnico responsável *
        <select className="ctl" value={f.responsavel} disabled={papel === 'Técnico'} onChange={e => setF(s => ({ ...s, responsavel: e.target.value }))}>
          <option value="">— escolha —</option>
          {pessoas.map(m => <option key={m.email} value={m.email.toLowerCase()}>{m.nome}</option>)}
          {f.responsavel && !pessoas.some(m => m.email.toLowerCase() === f.responsavel) && <option value={f.responsavel}>{f.responsavel}</option>}
        </select>
        {sobrecarga && <span className="dica fds">Atenção: {papel === 'Técnico' ? 'você' : pessoas.find(m => m.email.toLowerCase() === f.responsavel)?.nome || 'esse técnico'} {sobrecarga}.</span>}
      </label>
      {papel !== 'Técnico' && (
        <label className="chk"><input type="checkbox" checked={f.lancar} onChange={e => setF(s => ({ ...s, lancar: e.target.checked }))} /> Lançar para o técnico agora</label>
      )}
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      <div className="linha" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn pq" disabled={salvando} onClick={aoCancelar}>Cancelar</button>
        <button type="button" className="btn pq pri" disabled={salvando} onClick={incluir}>{salvando ? 'Incluindo…' : `Incluir ${termo}`}</button>
      </div>
    </div>
  );
}
