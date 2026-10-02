import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SituacaoCadastro } from '../types/models';
import { usePortal, useBloqueioSincronizacao } from '../state/PortalContext';
import { useToast } from '../state/ToastContext';
import { usePapel } from '../state/PapelContext';
import { config } from '../config/config';
import { Mensagem } from '../components/ui/Mensagem';
import { Confirmacao } from '../components/ui/Confirmacao';
import { PassoDadosGerais } from '../components/novo/PassoDadosGerais';
import { PassoEscopo } from '../components/novo/PassoEscopo';
import { PassoCronograma } from '../components/novo/PassoCronograma';
import { PassoRiscos } from '../components/novo/PassoRiscos';
import { EditorEquipe } from '../components/novo/EditorEquipe';
import { cronogramaModelo, formVazio, montarEquipe, montarProjeto, riscosModelo, validar, type FormProjeto } from '../components/novo/formulario';

const PASSOS = ['Dados gerais e termo de abertura', 'Escopo, premissas e restrições', 'Cronograma e marcos', 'Riscos'];

export function NovoProjetoPage() {
  const { dados, criarProjeto, enviarEmailCriacao, avisarPmoProjeto, usuario, fonte } = usePortal();
  const [confirmar, setConfirmar] = useState(false);
  const { pode, papel } = usePapel();
  const toast = useToast();
  const navegar = useNavigate();
  const [form, setForm] = useState<FormProjeto>(formVazio);
  const [passo, setPasso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  useBloqueioSincronizacao('novo-projeto', true);

  const mudar = (c: keyof FormProjeto, v: string) => setForm(f => ({ ...f, [c]: v }));
  const pendencias = validar(form, dados);

  const usarCronogramaModelo = () => {
    const l = cronogramaModelo(form.inicio);
    if (!l.length) { toast('Modelo indisponível.'); return; }
    setForm(f => ({ ...f, atividades: l }));
    toast('Cronograma padrão Systech aplicado a partir do início informado. Ajuste o que for preciso.');
  };

  const ehPatrocinador = pode('aprovarGate');
  const enviar = async (situacao: SituacaoCadastro) => {
    if (pendencias.length) { setErro('Faltam dados: ' + pendencias.join('; ') + '.'); setConfirmar(false); return; }
    setEnviando(true); setErro('');
    try {
      // PMO cria já ativo: G1 aprovado por ele e projeto em Planejamento
      const novo = montarProjeto(form, situacao, situacao === 'Ativo' ? { por: fonte.modo === 'piloto' ? 'Patrocinador (piloto)' : usuario, em: fonte.hoje() } : undefined);
      await criarProjeto(novo);
      toast(situacao === 'Rascunho' ? 'Rascunho salvo.' : situacao === 'Ativo' ? 'Projeto criado e ativo no portfólio.' : 'Projeto enviado para aprovação do patrocinador.');
      navegar(`/projeto/${encodeURIComponent(novo.projeto.codigo)}`);
      // o projeto já está salvo; falha no e-mail só gera aviso
      if (situacao === 'Em aprovação' && config.emailAoSolicitarAprovacao) {
        avisarPmoProjeto(novo)
          .then(para => toast(`Patrocinador avisado por e-mail (${para}).`))
          .catch(e => toast(`Projeto enviado, mas o e-mail ao patrocinador não saiu: ${(e as Error).message}.`));
      } else if (situacao === 'Ativo' && config.emailAoCriarProjeto) {
        enviarEmailCriacao(novo)
          .then(para => toast(`Aviso de projeto aprovado enviado para ${para}.`))
          .catch(e => toast(`Projeto salvo, mas o e-mail de teste não foi enviado: ${(e as Error).message}.`));
      }
    } catch (e) { setErro((e as Error).message); setEnviando(false); }
  };

  if (!pode('criarProjeto')) {
    return <main className="main"><Mensagem tipo="info">O perfil <b>{papel}</b> não cadastra projetos. Troque o perfil de teste no cabeçalho para PMO ou Patrocinador.</Mensagem></main>;
  }

  return (
    <main className="main" style={{ maxWidth: 1200 }}>
      <div>
        <div className="migalha"><Link to="/">Escritório de Projetos</Link> › Novo projeto</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Cadastrar projeto</h1>
        <p className="pdesc" style={{ marginTop: 6 }}>{ehPatrocinador
          ? 'Como patrocinador, você cria o projeto direto: ele entra ativo no portfólio, com o G1 aprovado, na fase de Planejamento.'
          : 'O PMO preenche e envia. O projeto entra no portfólio depois que o patrocinador aprova o cadastro, que registra o gate G1.'}</p>
      </div>
      <div className="passos">
        {PASSOS.map((t, i) => (
          <button key={t} type="button" className={`passo ${i === passo ? 'on' : i < passo ? 'ok' : ''}`} aria-current={i === passo ? 'step' : undefined} onClick={() => { setPasso(i); setErro(''); }}>
            Etapa {i + 1}<b>{t}</b>
          </button>
        ))}
      </div>
      <section className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {passo === 0 && <>
          <PassoDadosGerais form={form} mudar={mudar} />
          <h3 className="h3" style={{ fontSize: 15 }}>Equipe do projeto</h3>
          <EditorEquipe equipe={form.equipe} aoMudar={e => setForm(f => ({ ...f, equipe: e }))} />
        </>}
        {passo === 1 && <PassoEscopo form={form} mudar={mudar} />}
        {passo === 2 && <PassoCronograma linhas={form.atividades} aoMudar={l => setForm(f => ({ ...f, atividades: l }))} aoUsarModelo={usarCronogramaModelo} />}
        {passo === 3 && <PassoRiscos linhas={form.riscos} aoMudar={l => setForm(f => ({ ...f, riscos: l }))} aoUsarModelo={() => setForm(f => ({ ...f, riscos: riscosModelo() }))} />}
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="linha" style={{ borderTop: '1px solid var(--borda2)', paddingTop: 16 }}>
          <button type="button" className="btn" disabled={passo === 0} onClick={() => setPasso(p => p - 1)}>Voltar</button>
          <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {passo < PASSOS.length - 1
              ? <button type="button" className="btn pri" onClick={() => setPasso(p => p + 1)}>Próxima etapa</button>
              : <>
                  <button type="button" className="btn" disabled={enviando} onClick={() => enviar('Rascunho')}>Salvar rascunho</button>
                  {ehPatrocinador
                    ? <button type="button" className="btn pri" disabled={enviando} onClick={() => { if (pendencias.length) { setErro('Faltam dados: ' + pendencias.join('; ') + '.'); return; } setConfirmar(true); }}>Criar projeto</button>
                    : <button type="button" className="btn pri" disabled={enviando} onClick={() => enviar('Em aprovação')}>{enviando ? 'Enviando…' : 'Enviar para aprovação do patrocinador'}</button>}
                </>}
          </span>
        </div>
        {passo === PASSOS.length - 1 && pendencias.length > 0 && <div className="aviso">Antes de enviar: {pendencias.join('; ')}.</div>}
      </section>
      {confirmar && (
        <Confirmacao titulo={`Criar o projeto ${form.codigo.trim().toUpperCase()}?`} rotuloConfirmar="Confirmar criação" ocupado={enviando} erro={erro}
          aoCancelar={() => setConfirmar(false)} aoConfirmar={() => enviar('Ativo')}>
          <ul className="ul" style={{ marginTop: 0 }}>
            <li><b>{form.nome}</b> · {form.cliente} · {form.tipo}</li>
            <li>GP: {form.gerente || '—'}{form.arquiteto ? ` · Arquiteto: ${form.arquiteto}` : ''}</li>
            <li>{form.atividades.filter(a => a.nome.trim()).length} atividades · {form.riscos.filter(r => r.descricao.trim()).length} riscos · {montarEquipe(form).length} pessoas na equipe</li>
          </ul>
          <div className="msg info">O projeto entra <b>ativo</b>, com o <b>G1 aprovado por você</b> e na fase de <b>Planejamento</b>. Os gates G2, G3 e G4 ficam pendentes.</div>
        </Confirmacao>
      )}
    </main>
  );
}
