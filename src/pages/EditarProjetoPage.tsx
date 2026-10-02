import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Projeto } from '../types/models';
import { usePortal, useBloqueioSincronizacao } from '../state/PortalContext';
import { useToast } from '../state/ToastContext';
import { usePapel } from '../state/PapelContext';
import { linhas } from '../lib/datas';
import { Mensagem } from '../components/ui/Mensagem';
import { Vazio } from '../components/ui/Vazio';
import { PassoDadosGerais } from '../components/novo/PassoDadosGerais';
import { PassoEscopo } from '../components/novo/PassoEscopo';
import { montarEquipe, type FormProjeto } from '../components/novo/formulario';
import { EditorEquipe } from '../components/novo/EditorEquipe';

const paraForm = (p: Projeto): FormProjeto => ({
  codigo: p.codigo, nome: p.nome, cliente: p.cliente, tipo: p.tipo, gerente: p.gerente, arquiteto: p.arquiteto,
  patrocinador: p.patrocinador, contrato: p.contrato, inicio: p.inicio, termino: p.terminoPrevisto || p.terminoBaseline,
  objetivo: p.objetivo, escopoIncluido: p.escopoIncluido.join('\n'), escopoExcluido: p.escopoExcluido.join('\n'),
  premissas: p.premissas.join('\n'), dependencias: p.dependencias.join('\n'), restricoes: p.restricoes.join('\n'),
  atividades: [], riscos: [], equipe: p.equipe.map(m => ({ ...m }))
});

/** Edição dos dados gerais e do escopo. Fase e situação mudam só pelos gates. */
export function EditarProjetoPage() {
  const { codigo = '' } = useParams();
  const { dados, editarProjeto } = usePortal();
  const toast = useToast();
  const navegar = useNavigate();
  const p = dados.projetos.find(x => x.codigo === codigo);
  const [form, setForm] = useState<FormProjeto | null>(p ? paraForm(p) : null);
  const [farol, setFarol] = useState<Projeto['farol']>(p?.farol || 'Verde');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  useBloqueioSincronizacao('editar-projeto', true);
  const { pode, papel } = usePapel();
  if (!pode('editarProjeto')) return <main className="main"><Mensagem tipo="info">O perfil <b>{papel}</b> não edita projetos. Troque o perfil de teste no cabeçalho.</Mensagem></main>;

  if (!p || !form) return <main className="main"><Vazio>Projeto "{codigo}" não encontrado. <Link to="/">Voltar ao portfólio</Link></Vazio></main>;
  const voltar = `/projeto/${encodeURIComponent(p.codigo)}`;
  const mudar = (c: keyof FormProjeto, v: string) => setForm(f => (f ? { ...f, [c]: v } : f));

  const salvar = async () => {
    const faltas = [!form.nome.trim() && 'nome', !form.cliente.trim() && 'cliente', !form.gerente.trim() && 'GP', !form.inicio && 'início', !form.termino && 'término'].filter(Boolean);
    if (faltas.length) { setErro('Preencha: ' + faltas.join(', ') + '.'); return; }
    if (form.termino < form.inicio) { setErro('O término previsto é antes do início.'); return; }
    setSalvando(true); setErro('');
    try {
      await editarProjeto(p.codigo, {
        nome: form.nome.trim(), cliente: form.cliente.trim(), tipo: form.tipo, contrato: form.contrato.trim(),
        gerente: form.gerente.trim(), arquiteto: form.arquiteto.trim(),
        inicio: form.inicio, terminoPrevisto: form.termino, objetivo: form.objetivo.trim(), farol,
        escopoIncluido: linhas(form.escopoIncluido), escopoExcluido: linhas(form.escopoExcluido),
        premissas: linhas(form.premissas), dependencias: linhas(form.dependencias), restricoes: linhas(form.restricoes),
        equipe: montarEquipe(form)
      });
      toast('Projeto atualizado.');
      navegar(voltar);
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <main className="main" style={{ maxWidth: 1200 }}>
      <div>
        <div className="migalha"><Link to="/">Escritório de Projetos</Link> › <Link to={voltar}>{p.codigo}</Link> › Editar</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Editar {p.codigo}</h1>
        <p className="pdesc" style={{ marginTop: 6 }}>
          A fase atual ({p.fase}) muda só pela aprovação dos gates, no ciclo de vida. A baseline de término ({p.terminoBaseline ? p.terminoBaseline.split('-').reverse().join('/') : '—'}) é atualizada quando o G2 congela a linha de base.
        </p>
      </div>
      <section className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 className="h3">Dados gerais</h2>
        <PassoDadosGerais form={form} mudar={mudar} edicao />
        <label className="campo" style={{ maxWidth: 320 }}>Farol
          <select className="ctl" value={farol} onChange={e => setFarol(e.target.value as Projeto['farol'])}>
            <option>Verde</option><option>Amarelo</option><option>Vermelho</option>
          </select>
        </label>
      </section>
      <section className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 className="h3">Equipe</h2>
        <EditorEquipe equipe={form.equipe} aoMudar={e => setForm(f => (f ? { ...f, equipe: e } : f))} />
      </section>
      <section className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 className="h3">Escopo, premissas e restrições</h2>
        <PassoEscopo form={form} mudar={mudar} />
      </section>
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      <div className="linha">
        <Link className="btn" to={voltar}>Cancelar</Link>
        <button type="button" className="btn pri" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </main>
  );
}
