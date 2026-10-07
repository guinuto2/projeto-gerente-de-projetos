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
import { AvisoRascunho } from '../components/projeto/AvisoRascunho';
import { AbaHistorico } from '../components/projeto/abas/AbaHistorico';
import { ExportarCronograma } from '../components/projeto/ExportarCronograma';

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
  if (!p || !podeVer(p)) return <main className="main"><Vazio>{!p ? `Projeto "${codigo}" não encontrado.` : p.situacaoCadastro === 'Rascunho' ? 'Este projeto ainda é um rascunho do PMO.' : 'Você não faz parte da equipe deste projeto.'} <Link to="/">Voltar ao portfólio</Link></Vazio></main>;

  const abas: Aba[] = [
    { id: 'cronograma', rotulo: 'Cronograma', contagem: macro(dados, p.codigo).length },
    { id: 'riscos', rotulo: 'Riscos', contagem: riscosAbertos(dados, p.codigo).length },
    { id: 'pendencias', rotulo: 'Pendências', contagem: pendenciasAbertas(dados, p.codigo).length },
    { id: 'escopo', rotulo: 'Escopo e premissas' },
    { id: 'documentos', rotulo: 'Documentos' },
    { id: 'decisoes', rotulo: 'Decisões', contagem: (dados.decisoes[p.codigo] || []).length },
    { id: 'historico', rotulo: 'Histórico' }
  ];
  // o técnico não vê escopo, riscos, pendências nem o histórico
  const OCULTAS_TECNICO = ['riscos', 'pendencias', 'escopo', 'historico'];
  const abasVisiveis = papel === 'Técnico' ? abas.filter(a => !OCULTAS_TECNICO.includes(a.id)) : abas;
  const abaAtiva = abasVisiveis.some(a => a.id === aba) ? aba : 'cronograma';
  const irAba = (id: string) => navegar(`/projeto/${encodeURIComponent(p.codigo)}/${id}`);
  const selecionarFase = (f: Fase | null) => { setFaseSel(f); if (abaAtiva !== 'cronograma') irAba('cronograma'); };
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
      {p.situacaoCadastro === 'Rascunho' && pode('criarProjeto') && <AvisoRascunho projeto={p} />}
      {p.situacaoCadastro === 'Encerrado' && (
        <Mensagem tipo="ok">Projeto encerrado{p.fases.find(g => g.gate === 'G4')?.dataAprovacao ? ` em ${p.fases.find(g => g.gate === 'G4')!.dataAprovacao!.split('-').reverse().join('/')}` : ''}. Ele aparece em “Projetos encerrados” no portfólio.</Mensagem>
      )}
      {p.situacaoCadastro === 'Em aprovação' && (
        <Mensagem tipo="info" className="linha">
          <span>Cadastro enviado pelo PMO e aguardando aprovação do patrocinador. A aprovação registra o gate G1 e coloca o projeto no portfólio.</span>
          {g1 && pode('aprovarGate') && <button type="button" className="btn ok pq" onClick={() => decidir(g1)}>Analisar cadastro (G1)</button>}
        </Mensagem>
      )}
      {/* pedidos do PMO aguardando o patrocinador (o G1 de cadastro já tem o aviso acima) */}
      {p.fases.filter(g => g.situacao === 'Aguardando aprovação' && !(g.gate === 'G1' && p.situacaoCadastro === 'Em aprovação')).map(g => (
        <Mensagem key={g.gate} tipo="info" className="linha">
          <span>O PMO pediu a aprovação do <b>{g.nome}</b>{pode('aprovarGate') ? '.' : '. Aguardando a decisão do patrocinador.'}</span>
          {pode('aprovarGate') && <button type="button" className="btn ok pq" onClick={() => decidir(g)}>Analisar pedido</button>}
        </Mensagem>
      ))}
      <CabecalhoProjeto projeto={p} />
      {papel === 'PMO' && <IndicadoresProjeto projeto={p} />}
      <CicloVida projeto={p} faseSel={faseSel} aoSelecionar={selecionarFase} aoDecidir={decidir} />
      <section className="card">
        <Abas abas={abasVisiveis} ativa={abaAtiva} aoMudar={irAba} direita={<ExportarCronograma projeto={p} />} />
        <div className="painelAba">
          {abaAtiva === 'cronograma' && <AbaCronograma projeto={p} faseSel={faseSel} limparFase={() => setFaseSel(null)} />}
          {abaAtiva === 'riscos' && <AbaRiscos projeto={p} />}
          {abaAtiva === 'pendencias' && <AbaPendencias projeto={p} />}
          {abaAtiva === 'escopo' && <AbaEscopo projeto={p} />}
          {abaAtiva === 'documentos' && <AbaDocumentos projeto={p} />}
          {abaAtiva === 'decisoes' && <AbaDecisoes projeto={p} />}
          {abaAtiva === 'historico' && <AbaHistorico projeto={p} />}
        </div>
      </section>
      {gateEmDecisao && <DecidirGate projeto={p} gate={gateEmDecisao} aoFechar={() => setGateAberto(null)} />}
    </main>
  );
}
