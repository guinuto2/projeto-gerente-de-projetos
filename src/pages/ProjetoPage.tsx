import { useEffect, useState } from 'react';
import { useToast } from '../state/ToastContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Fase, Gate } from '../types/models';
import { usePortal } from '../state/PortalContext';
import { usePapel } from '../state/PapelContext';
import { useProjetosVisiveis } from '../state/useProjetosVisiveis';
import { macro, pendenciasAbertas, riscosAbertos } from '../lib/calculos';
import { Abas, type Aba } from '../components/ui/Abas';
import { Mensagem } from '../components/ui/Mensagem';
import { Vazio } from '../components/ui/Vazio';
import { CabecalhoProjeto } from '../components/projeto/CabecalhoProjeto';
import { IndicadoresProjeto } from '../components/projeto/IndicadoresProjeto';
import { CicloVida } from '../components/projeto/CicloVida';
import { AbaCronograma } from '../components/projeto/abas/AbaCronograma';
import { AbaRiscos } from '../components/projeto/abas/AbaRiscos';
import { AbaPendencias } from '../components/projeto/abas/AbaPendencias';
import { AbaEscopo } from '../components/projeto/abas/AbaEscopo';
import { AbaDocumentos } from '../components/projeto/abas/AbaDocumentos';
import { AbaDecisoes } from '../components/projeto/abas/AbaDecisoes';
import { DecidirGate } from '../components/projeto/editores/DecidirGate';

export function ProjetoPage() {
  const { codigo = '', aba = 'cronograma' } = useParams();
  const navegar = useNavigate();
  const { dados, fonte, removerGatesRepetidos } = usePortal();
  const toast = useToast();
  const [limpando, setLimpando] = useState(false);
  const { pode, papel } = usePapel();
  const { podeVer } = useProjetosVisiveis();
  const [faseSel, setFaseSel] = useState<Fase | null>(null);
  const [gateAberto, setGateAberto] = useState<string | null>(null);
  useEffect(() => { setFaseSel(null); window.scrollTo(0, 0); }, [codigo]);

  const p = dados.projetos.find(x => x.codigo === codigo);
  if (!p || !podeVer(p)) return <main className="main"><Vazio>{p ? 'Você não faz parte da equipe deste projeto.' : `Projeto "${codigo}" não encontrado.`} <Link to="/">Voltar ao portfólio</Link></Vazio></main>;

  const abas: Aba[] = [
    { id: 'cronograma', rotulo: 'Cronograma', contagem: macro(dados, p.codigo).length },
    { id: 'riscos', rotulo: 'Riscos', contagem: riscosAbertos(dados, p.codigo).length },
    { id: 'pendencias', rotulo: 'Pendências', contagem: pendenciasAbertas(dados, p.codigo).length },
    { id: 'escopo', rotulo: 'Escopo e premissas' },
    { id: 'documentos', rotulo: 'Documentos' },
    { id: 'decisoes', rotulo: 'Decisões', contagem: (dados.decisoes[p.codigo] || []).length }
  ];
  const irAba = (id: string) => navegar(`/projeto/${encodeURIComponent(p.codigo)}/${id}`);
  const selecionarFase = (f: Fase | null) => { setFaseSel(f); if (aba !== 'cronograma') irAba('cronograma'); };
  const g1 = p.fases.find(g => g.gate === 'G1');
  const decidir = (g: Gate) => setGateAberto(g.gate);
  const gateEmDecisao = gateAberto ? p.fases.find(g => g.gate === gateAberto) : undefined;

  return (
    <main className="main" style={{ gap: 20 }}>
      <div className="linha">
        <div className="migalha"><Link to="/">Escritório de Projetos</Link> › <Link to="/">Projetos</Link> › {p.codigo}</div>
        {fonte.modo === 'piloto' && <span className="selo">Piloto · datas fictícias</span>}
      </div>
      {(p.gatesRepetidos?.length || 0) > 0 && pode('editarProjeto') && (
        <Mensagem tipo="info" className="linha">
          <span>A lista Portal Gates tem {p.gatesRepetidos!.length} gate(s) repetido(s) deste projeto. O portal já usa só um de cada; remova os repetidos para deixar a lista limpa.</span>
          <button type="button" className="btn pq" disabled={limpando} onClick={async () => {
            if (!confirm(`Remover ${p.gatesRepetidos!.length} item(ns) repetido(s) da lista Portal Gates? Fica um gate de cada (o mais avançado).`)) return;
            setLimpando(true);
            try { const n = await removerGatesRepetidos(p.codigo); toast(`${n} gate(s) repetido(s) removido(s) da lista.`); }
            catch (e) { toast((e as Error).message); }
            finally { setLimpando(false); }
          }}>{limpando ? 'Removendo…' : 'Remover repetidos'}</button>
        </Mensagem>
      )}
      {p.situacaoCadastro === 'Em aprovação' && (
        <Mensagem tipo="info" className="linha">
          <span>Cadastro enviado pelo GP e aguardando aprovação do PMO. A aprovação registra o gate G1 e coloca o projeto no portfólio.</span>
          {g1 && pode('aprovarGate') && <button type="button" className="btn ok pq" onClick={() => { setFaseSel('Iniciação'); decidir(g1); }}>Analisar cadastro (G1)</button>}
        </Mensagem>
      )}
      <CabecalhoProjeto projeto={p} />
      {papel !== 'PMO' && <IndicadoresProjeto projeto={p} />}
      <CicloVida projeto={p} faseSel={faseSel} aoSelecionar={selecionarFase} aoDecidir={decidir} />
      <section className="card">
        <Abas abas={abas} ativa={aba} aoMudar={irAba} />
        <div className="painelAba">
          {aba === 'cronograma' && <AbaCronograma projeto={p} faseSel={faseSel} limparFase={() => setFaseSel(null)} />}
          {aba === 'riscos' && <AbaRiscos projeto={p} />}
          {aba === 'pendencias' && <AbaPendencias projeto={p} />}
          {aba === 'escopo' && <AbaEscopo projeto={p} />}
          {aba === 'documentos' && <AbaDocumentos projeto={p} />}
          {aba === 'decisoes' && <AbaDecisoes projeto={p} />}
        </div>
      </section>
      {gateEmDecisao && <DecidirGate projeto={p} gate={gateEmDecisao} aoFechar={() => setGateAberto(null)} />}
    </main>
  );
}
