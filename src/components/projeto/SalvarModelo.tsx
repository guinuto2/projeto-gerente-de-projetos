import { useEffect, useState } from 'react';
import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { TIPOS_PROJETO } from '../../lib/constantes';
import { idDoModelo, itensDoProjeto, type ModeloProjeto } from '../../lib/modelos';
import { Mensagem } from '../ui/Mensagem';

/** "Salvar como modelo": guarda o cronograma do projeto (atividades e tarefas, com datas relativas) para usar em novos projetos. */
export function SalvarModelo({ projeto: p, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { dados, fonte } = usePortal();
  const toast = useToast();
  const itens = itensDoProjeto(dados.atividades[p.codigo] || [], p.inicio);
  const [nome, setNome] = useState(`Modelo ${p.tipo} — ${p.nome}`.slice(0, 120));
  const [tipo, setTipo] = useState(p.tipo);
  const [descricao, setDescricao] = useState(`Criado a partir do projeto ${p.codigo} (${p.cliente}).`);
  const [existentes, setExistentes] = useState<ModeloProjeto[]>([]);
  const [salvando, setSalvando] = useState(false); const [erro, setErro] = useState('');
  useEffect(() => { fonte.modelos?.().then(l => setExistentes(l || [])).catch(() => undefined); }, [fonte]);
  const repetido = existentes.find(m => m.id === idDoModelo(nome));
  const salvar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do modelo.'); return; }
    if (!itens.length) { setErro('O projeto não tem atividades para virar modelo.'); return; }
    if (repetido && !window.confirm(`Já existe o modelo “${repetido.nome}”. Substituir pelo cronograma deste projeto?`)) return;
    setSalvando(true); setErro('');
    try {
      await fonte.salvarModelo!({ id: idDoModelo(nome), nome: nome.trim(), tipo, descricao: descricao.trim(), itens });
      toast(`Modelo “${nome.trim()}” salvo. Ele aparece no cadastro de novos projetos.`);
      aoFechar();
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };
  return (
    <>
      <div className="fundoDr" onClick={() => !salvando && aoFechar()} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Salvar como modelo" style={{ width: 'min(560px, 94vw)' }}>
        <h2 className="h3">Salvar como modelo</h2>
        <p className="sub" style={{ margin: '4px 0 12px' }}>
          Guarda o cronograma deste projeto — {itens.filter(i => !i.pai).length} atividade(s) e {itens.filter(i => i.pai).length} tarefa(s), com durações,
          marcos, horas planejadas e pré-requisitos — para usar no cadastro de novos projetos. As datas ficam relativas ao início do projeto.
        </p>
        <label className="campo">Nome do modelo *<input className="ctl" value={nome} onChange={e => setNome(e.target.value)} disabled={salvando} /></label>
        {repetido && <span className="dica" style={{ color: '#8A5A00' }}>Já existe um modelo com esse nome: ele será substituído.</span>}
        <label className="campo" style={{ marginTop: 10 }}>Tipo de projeto
          <select className="ctl" value={tipo} onChange={e => setTipo(e.target.value)} disabled={salvando}>
            {TIPOS_PROJETO.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="dica">No cadastro, os modelos do mesmo tipo aparecem primeiro.</span>
        </label>
        <label className="campo" style={{ marginTop: 10 }}>Descrição<textarea className="ctl" rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} disabled={salvando} /></label>
        {!fonte.salvarModelo && <Mensagem tipo="info">Salvar modelos não está disponível neste modo.</Mensagem>}
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" className="btn" disabled={salvando} onClick={aoFechar}>Cancelar</button>
          <button type="button" className="btn pri" disabled={salvando || !fonte.salvarModelo} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar modelo'}</button>
        </div>
      </div>
    </>
  );
}
