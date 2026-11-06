import { usePortal } from '../../state/PortalContext';
import { useProjetosVisiveis } from '../../state/useProjetosVisiveis';
import { pendenciasAbertas, riscosAltos } from '../../lib/calculos';
import { COR_FAROL } from '../../lib/constantes';
import { Kpi } from '../ui/Kpi';
import { diasVencida } from '../../lib/validacoes';
import { usePapel } from '../../state/PapelContext';

export function IndicadoresPortfolio() {
  const { dados, hoje } = usePortal();
  const { projetos: P } = useProjetosVisiveis();
  const { papel } = usePapel();
  const ativos = P.filter(p => p.situacaoCadastro === 'Ativo');
  const aguardando = P.filter(p => p.situacaoCadastro === 'Em aprovação');
  const aprovacoes = P.reduce((s, p) => s + p.fases.filter(g => g.situacao === 'Aguardando aprovação').length, 0) + aguardando.length;
  const altos = P.reduce((s, p) => s + riscosAltos(dados, p.codigo).length, 0);
  const pend = P.reduce((s, p) => s + pendenciasAbertas(dados, p.codigo).length, 0);
  const vencidas = P.reduce((s, p) => s + pendenciasAbertas(dados, p.codigo).filter(x => diasVencida(x, hoje) > 0).length, 0);
  const conta = (f: string) => ativos.filter(p => p.farol === f).length;
  if (papel === 'Técnico' || papel === 'Cliente') return (
    <div className="kpis kpisTecnico"><Kpi rotulo="Projetos ativos" valor={ativos.length} nota={papel === 'Cliente' ? 'projetos do seu órgão' : 'projetos em que você está na equipe'} /></div>
  );
  return (
    <div className="kpis">
      <Kpi rotulo="Projetos ativos" valor={ativos.length} nota={`${aguardando.length} aguardando aprovação`} />
      <Kpi rotulo="Farol do portfólio">
        <div className="farol">
          {(['Verde', 'Amarelo', 'Vermelho'] as const).map(f => (
            <span key={f}><i className="pt" style={{ background: COR_FAROL[f] }} />{conta(f)} {f.toLowerCase()}</span>
          ))}
        </div>
      </Kpi>
      <Kpi rotulo="Aprovações pendentes" valor={aprovacoes} nota="gates e cadastros aguardando decisão" />
      <Kpi rotulo="Riscos altos abertos" valor={altos} alerta={altos > 0} nota="impacto alto, probabilidade média ou alta" />
      <Kpi rotulo="Pendências abertas" valor={pend} alerta={vencidas > 0} nota={vencidas ? `${vencidas} com prazo vencido` : 'aguardando definição do cliente'} />
    </div>
  );
}
