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
import { AtividadesCliente } from '../components/cliente/AtividadesCliente';
import { DashboardCliente } from '../components/cliente/DashboardCliente';
import { AbaDashboard } from '../components/projeto/abas/AbaDashboard';
import { ListaAtividadesTecnico } from '../components/projeto/ListaAtividadesTecnico';
import { AbaAcompanhamento } from '../components/projeto/abas/AbaAcompanhamento';
import { ExportarCronograma } from '../components/projeto/ExportarCronograma';

export function ProjetoPage() {
  const { codigo = '', aba = '' } = useParams();   // sem aba no endereço: cada perfil abre na sua aba inicial
  const navegar = useNavigate();
  const { dados, fonte, removerGatesRepetidos } = usePortal();
  const toast = useToast();
  const [limpando, setLimpando] = useState(false);
  const { pode, papel } = usePapel();
  const { usuario, email: meuEmail } = usePortal();
  const { podeVer } = useProjetosVisiveis();
  const [faseSel, setFaseSel] = useState<Fase | null>(null);
  const [gateAberto, setGateAberto] = useState<string | null>(null);
  useEffect(() => { setFaseSel(null); window.scrollTo(0, 0); }, [codigo]);

  const p = dados.projetos.find(x => x.codigo === codigo);
  if (!p || !podeVer(p)) return <main className="main"><Vazio>{!p ? `Projeto "${codigo}" não encontrado.` : p.situacaoCadastro === 'Rascunho' ? 'Este projeto ainda é um rascunho do PMO.' : papel === 'Cliente' ? 'Este projeto não é do seu órgão.' : 'Você não faz parte da equipe deste projeto.'} <Link to="/">Voltar ao portfólio</Link></Vazio></main>;

  const abas: Aba[] = [
    { id: 'cronograma', rotulo: papel === 'Técnico' ? 'Cronograma' : 'Ciclo de vida', contagem: macro(dados, p.codigo).length },
    ...(papel === 'Técnico' ? [{ id: 'tarefas', rotulo: 'Tarefas', contagem: (dados.atividades[p.codigo] || []).filter(a => a.pai && a.lancada !== false && a.status !== 'Concluído' && a.status !== 'Cancelado').length }] : []),
    { id: 'dashboard', rotulo: 'Dashboard' },
    { id: 'riscos', rotulo: 'Riscos', contagem: riscosAbertos(dados, p.codigo).length },
    { id: 'pendencias', rotulo: papel === 'Técnico' ? 'Decisões' : 'Pendências e decisões',
      contagem: papel === 'Técnico' ? (dados.decisoes[p.codigo] || []).length : pendenciasAbertas(dados, p.codigo).length },
    { id: 'escopo', rotulo: 'Escopo e premissas' },
    { id: 'documentos', rotulo: 'Documentos' },
    { id: 'acompanhamento', rotulo: 'Acompanhamento', contagem: (dados.atividades[p.codigo] || []).filter(a => a.pai && a.status !== 'Concluído' && a.status !== 'Cancelado').length },
    { id: 'historico', rotulo: 'Histórico' }
  ];
  // o técnico não vê escopo, riscos, pendências nem o histórico
  const OCULTAS_TECNICO = ['cronograma', 'dashboard', 'riscos', 'escopo', 'historico'];   // o técnico não vê o ciclo de vida, só as tarefas
  // cliente: só atividades, dashboard e cronograma (somente leitura)
  const ABAS_CLIENTE: Aba[] = [
    { id: 'atividades', rotulo: 'Atividades', contagem: (dados.atividades[p.codigo] || []).filter(a => !a.pai && a.status !== 'Cancelado').length },
    { id: 'painel', rotulo: 'Dashboard' },
    { id: 'cronograma', rotulo: 'Cronograma' }
  ];
  const abasVisiveis = papel === 'Cliente' ? ABAS_CLIENTE : papel === 'Técnico' ? abas.filter(a => !OCULTAS_TECNICO.includes(a.id)) : abas;
  const abaPedida = aba === 'decisoes' ? 'pendencias' : aba;   // links antigos da aba Decisões
  const abaAtiva = abasVisiveis.some(a => a.id === abaPedida) ? abaPedida : (papel === 'Técnico' ? 'tarefas' : papel === 'Cliente' ? 'atividades' : 'cronograma');
  const irAba = (id: string) => navegar(`/projeto/${encodeURIComponent(p.codigo)}/${id}`);
  const selecionarFase = (f: Fase | null) => { setFaseSel(f); if (abaAtiva !== 'cronograma') irAba('cronograma'); };
  const criadoPorMim = !!p?.criadoPor && [usuario, meuEmail].some(x => x && x.toLowerCase() === p.criadoPor!.toLowerCase());
  const g1 = p.fases.find(g => g.gate === 'G1');
  const decidir = (g: Gate) => setGateAberto(g.gate);
  const gateEmDecisao = gateAberto ? p.fases.find(g => g.gate === gateAberto) : undefined;

  return (
    <main className="main" style={{ gap: 20 }}>
      <div className="linha">
        <div className="migalha"><Link to="/">Central Systech</Link> › <Link to="/">Projetos</Link> › {p.codigo}</div>
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
          <span>Cadastro aguardando aprovação do PMO. A aprovação registra o gate G1 e coloca o projeto no portfólio.</span>
          {g1 && pode('aprovarCadastro') && <button type="button" className="btn ok pq" onClick={() => decidir(g1)}>{criadoPorMim ? 'Ativar projeto' : 'Analisar cadastro (G1)'}</button>}
        </Mensagem>
      )}
      {/* pedidos do PMO aguardando o patrocinador (o G1 de cadastro já tem o aviso acima) */}
      {papel !== 'Cliente' && p.fases.filter(g => g.situacao === 'Aguardando aprovação' && g.gate !== 'G1').map(g => (
        <Mensagem key={g.gate} tipo="info" className="linha">
          <span>O PMO pediu a aprovação do <b>{g.nome}</b>{pode('aprovarGate') ? '.' : '. Aguardando a decisão do patrocinador.'}</span>
          {pode('aprovarGate') && <button type="button" className="btn ok pq" onClick={() => decidir(g)}>Analisar pedido</button>}
        </Mensagem>
      ))}
      <CabecalhoProjeto projeto={p} />
      {papel === 'PMO' && <IndicadoresProjeto projeto={p} />}
      {papel !== 'Técnico' && papel !== 'Cliente' && <CicloVida projeto={p} faseSel={faseSel} aoSelecionar={selecionarFase} aoDecidir={decidir} />}
      <section className="card">
        <Abas abas={abasVisiveis} ativa={abaAtiva} aoMudar={irAba} direita={<ExportarCronograma projeto={p} />} />
        <div className="painelAba">
          {abaAtiva === 'cronograma' && <AbaCronograma projeto={p} faseSel={faseSel} limparFase={() => setFaseSel(null)} />}
          {abaAtiva === 'atividades' && <AtividadesCliente projeto={p} />}
          {abaAtiva === 'painel' && <DashboardCliente projeto={p} />}
          {abaAtiva === 'tarefas' && <ListaAtividadesTecnico projeto={p} />}
          {abaAtiva === 'dashboard' && <AbaDashboard projeto={p} />}
          {abaAtiva === 'riscos' && <AbaRiscos projeto={p} />}
          {abaAtiva === 'pendencias' && (
            <div className="secoesAba">
              {papel !== 'Técnico' && (
                <section>
                  <h2 className="h3 secaoTitulo">Pendências <span className="cnt">{pendenciasAbertas(dados, p.codigo).length} abertas</span></h2>
                  <AbaPendencias projeto={p} />
                </section>
              )}
              <section>
                <h2 className="h3 secaoTitulo">Decisões <span className="cnt">{(dados.decisoes[p.codigo] || []).length}</span></h2>
                <AbaDecisoes projeto={p} />
              </section>
            </div>
          )}
          {abaAtiva === 'escopo' && <AbaEscopo projeto={p} />}
          {abaAtiva === 'documentos' && <AbaDocumentos projeto={p} />}
          {abaAtiva === 'acompanhamento' && <AbaAcompanhamento projeto={p} />}
          {abaAtiva === 'historico' && <AbaHistorico projeto={p} />}
        </div>
      </section>
      {gateEmDecisao && <DecidirGate projeto={p} gate={gateEmDecisao} aoFechar={() => setGateAberto(null)} />}
    </main>
  );
}
