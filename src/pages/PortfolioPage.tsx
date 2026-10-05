import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../state/PortalContext';
import { useProjetosVisiveis } from '../state/useProjetosVisiveis';
import { usePapel } from '../state/PapelContext';
import { faseAtual } from '../lib/calculos';
import { FASES } from '../lib/constantes';
import { IndicadoresPortfolio } from '../components/portfolio/IndicadoresPortfolio';
import { CardProjeto } from '../components/portfolio/CardProjeto';
import { ProximosMarcos } from '../components/portfolio/ProximosMarcos';
import { EmAndamento } from '../components/portfolio/EmAndamento';
import { ProjetosEncerrados } from '../components/portfolio/ProjetosEncerrados';
import { Rascunhos } from '../components/portfolio/Rascunhos';
import { PastasSemProjeto } from '../components/portfolio/PastasSemProjeto';
import { Chips } from '../components/ui/Chips';
import { Vazio } from '../components/ui/Vazio';

const FILTROS = ['Todas', ...FASES.filter(f => f !== 'Monitoramento'), 'Aguardando aprovação'] as const;
type Filtro = typeof FILTROS[number];

export function PortfolioPage() {
  const { dados, fonte } = usePortal();
  const { projetos, encerrados, rascunhos, identidade } = useProjetosVisiveis();
  const { papel, pode } = usePapel();
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const visiveis = projetos.filter(p =>
    (filtro === 'Todas' || faseAtual(dados, p) === filtro || (filtro === 'Aguardando aprovação' && p.situacaoCadastro === 'Em aprovação')) &&
    (!termo || [p.codigo, p.nome, p.cliente, p.gerente].join(' ').toLowerCase().includes(termo)));

  return (
    <>
      <main className="main">
        {pode('excluirProjeto') && <PastasSemProjeto />}
        <IndicadoresPortfolio />
        <div className="cols">
          <section className="colMain">
            <div className="linha">
              <h2 className="h2" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>Projetos{fonte.modo === 'piloto' && <span className="selo">Piloto · datas fictícias</span>}</h2>
              <Chips rotulo="Filtrar por fase" opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} />
            </div>
            <input className="ctl" type="search" data-busca="" placeholder="Buscar por código, nome, cliente ou GP" aria-label="Buscar projeto"
              value={busca} onChange={e => setBusca(e.target.value)} />
            <div className="grid2">{visiveis.map(p => <CardProjeto key={p.codigo} projeto={p} />)}</div>
            {!visiveis.length && (
              <Vazio>
                {papel === 'Técnico' && !projetos.length
                  ? <>Você ({identidade.nome || 'conta sem nome'}) ainda não está na equipe de nenhum projeto. Peça ao PMO para incluir seu nome ou e-mail na equipe.</>
                  : <>{dados.projetos.length ? 'Nenhum projeto com esse filtro.' : 'Nenhum projeto cadastrado ainda.'}
                    {papel !== 'Técnico' && <><br /><br /><Link className="btn pri" to="/novo">Cadastrar projeto</Link></>}</>}
              </Vazio>
            )}
          </section>
          <aside className="aside">
            <ProximosMarcos />
            <EmAndamento />
          </aside>
        </div>
        <Rascunhos projetos={rascunhos} />
        <ProjetosEncerrados projetos={encerrados} />
      </main>
    </>
  );
}
