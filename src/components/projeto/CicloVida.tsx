import type { EstadoFase, Fase, Gate, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { usePapel } from '../../state/PapelContext';
import { useToast } from '../../state/ToastContext';
import { config } from '../../config/config';
import { estadoFase, progressoFase } from '../../lib/calculos';
import { FASES, GATE_CAIXA } from '../../lib/constantes';
import { dma } from '../../lib/datas';
import { Losango } from '../ui/Losango';
import { TEMA } from '../../lib/tema';

function cores(selecionada: boolean, e: EstadoFase): [string, string, string] {
  if (selecionada) return [TEMA.preto, '#fff', TEMA.preto];
  if (e === 'Concluída') return ['#E8F5EE', '#145C3C', '#A9D8C6'];   // verde: fase concluída
  if (e === 'Em andamento') return [TEMA.vinhoClaro, TEMA.vinho, TEMA.vinhoBorda];
  return ['#FAFAFB', '#8A8D92', TEMA.borda];
}

interface Props {
  projeto: Projeto;
  faseSel: Fase | null;
  aoSelecionar: (f: Fase | null) => void;
  aoDecidir: (gate: Gate) => void;
}

/** Gate anterior ainda não aprovado (os gates são aprovados em ordem). */
export function gateBloqueante(p: Projeto, g: Gate): Gate | undefined {
  const ordem = p.fases.filter(x => x.gate).sort((a, b) => a.gate.localeCompare(b.gate));
  return ordem.slice(0, ordem.findIndex(x => x.gate === g.gate)).find(x => x.situacao !== 'Aprovado');
}

/** Gate ligado à fase. Monitoramento usa o gate da Execução (G3): as duas fecham juntas. */
export const gateDaFase = (p: Projeto, f: Fase): Gate | undefined =>
  p.fases.find(x => x.gate && x.fase === (f === 'Monitoramento' ? 'Execução' : f));

/**
 * Iniciação ─G1─ Planejamento ─G2─ [ Execução ∥ Monitoramento ] ─G3─ Encerramento ─G4
 * A fase avança quando o gate é aprovado.
 */
export function CicloVida({ projeto: p, faseSel, aoSelecionar, aoDecidir }: Props) {
  const { dados, solicitarGate, avisarPmoGate } = usePortal();
  const { pode } = usePapel();
  const toast = useToast();
  const gate = faseSel ? gateDaFase(p, faseSel) : undefined;
  const bloqueio = gate ? gateBloqueante(p, gate) : undefined;

  const solicitar = async (g: Gate) => {
    try { await solicitarGate(p.codigo, g.gate); toast(`${g.gate} enviado para aprovação do patrocinador.`); }
    catch (e) { toast((e as Error).message); return; }
    if (config.emailAoSolicitarAprovacao) {
      avisarPmoGate(p.codigo, g.gate)
        .then(para => toast(`${g.gate} enviado. Patrocinador avisado por e-mail (${para}).`))
        .catch(e => toast(`${g.gate} enviado, mas o e-mail ao patrocinador não saiu: ${(e as Error).message}.`));
    }
  };

  const botaoFase = (f: Fase) => {
    const i = FASES.indexOf(f), e = estadoFase(dados, p, f), [bg, fg, borda] = cores(faseSel === f, e);
    const prog = progressoFase(dados, p.codigo, f);
    return (
      <button key={f} type="button" className="fbtn" aria-pressed={faseSel === f} onClick={() => aoSelecionar(faseSel === f ? null : f)}
        style={{ background: bg, color: fg, borderColor: borda }}>
        <span className="e">{i + 1} · {e}</span>
        <span className="n">{f}</span>
        {prog.total > 0 && <span className="fprog">{prog.feitas} de {prog.total} atividades concluídas</span>}
      </button>
    );
  };
  const losango = (f: Fase) => {
    const g = gateDaFase(p, f);
    if (!g) return null;
    return (
      <div className="gcol">
        <button type="button" className="gbtn" title={`${g.nome} · ${g.situacao}`} aria-label={`${g.nome}: ${g.situacao}`} onClick={() => aoSelecionar(f)}>
          <Losango texto={g.gate} situacao={g.situacao} />
        </button>
      </div>
    );
  };

  return (
    <section className="card ciclo">
      <div className="linha" style={{ alignItems: 'baseline' }}>
        <h2 className="h3" style={{ fontSize: 18 }}>Ciclo de vida do projeto</h2>
        <span className="sub">Clique numa fase ou num losango para ver o gate</span>
      </div>
      <div className="trilhaF">
        <div className="fcol">{botaoFase('Iniciação')}{losango('Iniciação')}</div>
        <div className="fcol">{botaoFase('Planejamento')}{losango('Planejamento')}</div>
        <div className="fcol bloco">
          <div className="blocoIn">
            <div className="rotBloco">Implementação · em paralelo</div>
            <div className="blocoFases">{botaoFase('Execução')}{botaoFase('Monitoramento')}</div>
          </div>
          {losango('Execução')}
        </div>
        <div className="fcol">{botaoFase('Encerramento')}{losango('Encerramento')}</div>
      </div>
      {gate && (
        <div className="gateBox" style={{ background: GATE_CAIXA[gate.situacao] || '#F3F3F4' }}>
          <Losango texto={gate.gate} situacao={gate.situacao} grande />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 600 }}>{gate.nome} · {gate.situacao}{gate.data ? ` · previsto para ${dma(gate.data)}` : ''}</div>
            {gate.info && <div className="sub" style={{ fontSize: 13, marginTop: 2 }}>{gate.info}</div>}
            {gate.situacao === 'Aprovado' && (gate.aprovadoPor || gate.dataAprovacao) && (
              <div className="sub" style={{ fontSize: 13, marginTop: 4, color: TEMA.vinho }}>
                Aprovado{gate.aprovadoPor ? ` por ${gate.aprovadoPor}` : ''}{gate.dataAprovacao ? ` em ${dma(gate.dataAprovacao)}` : ''}{gate.parecer ? ` · ${gate.parecer}` : ''}
              </div>
            )}
            {gate.situacao === 'Pendente' && gate.parecer && <div className="sub" style={{ fontSize: 13, marginTop: 4, color: '#9A2E12' }}>Devolvido: {gate.parecer}</div>}
            {bloqueio && gate.situacao !== 'Aprovado' && <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>Só pode ser aprovado depois do {bloqueio.gate}.</div>}
            {!bloqueio && gate.situacao === 'Aguardando aprovação' && !pode('aprovarGate') && <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>Aguardando a decisão do patrocinador.</div>}
          </div>
          {gate.situacao !== 'Aprovado' && !bloqueio && (
            <div className="gateAcoes">
              {gate.situacao === 'Pendente' && pode('solicitarGate') && <button type="button" className="btn pq" onClick={() => solicitar(gate)}>Solicitar aprovação</button>}
              {pode('aprovarGate') && <button type="button" className="btn pq ok" onClick={() => aoDecidir(gate)}>{gate.situacao === 'Aguardando aprovação' ? 'Analisar pedido do PMO' : `Aprovar ${gate.gate}`}</button>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
