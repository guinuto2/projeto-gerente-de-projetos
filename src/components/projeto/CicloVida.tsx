import { useEffect, useState } from 'react';
import type { EstadoFase, Fase, Gate, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { checklistGate } from '../../lib/validacoes';
import { usePapel } from '../../state/PapelContext';
import { useToast } from '../../state/ToastContext';
import { config } from '../../config/config';
import { estadoFase, progressoFase } from '../../lib/calculos';
import { FASES, GATE_CAIXA } from '../../lib/constantes';
import { dma } from '../../lib/datas';
import { Losango } from '../ui/Losango';
import { TEMA } from '../../lib/tema';

function cores(selecionada: boolean, e: EstadoFase): [string, string, string] {
  if (selecionada) return ['var(--fase-sel-bg)', 'var(--fase-sel-txt)', 'var(--fase-sel-bg)'];
  if (e === 'Concluída') return ['var(--fase-ok-bg)', 'var(--fase-ok-txt)', 'var(--fase-ok-bd)'];   // verde: fase concluída
  if (e === 'Em andamento') return [TEMA.vinhoClaro, TEMA.vinho, TEMA.vinhoBorda];
  return ['var(--fase-no-bg)', 'var(--fase-no-txt)', TEMA.borda];
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

/** Gate ligado à fase. Monitoramento usa o gate do Encerramento (G4): as duas fecham juntas. */
export const gateDaFase = (p: Projeto, f: Fase): Gate | undefined =>
  p.fases.find(x => x.gate && x.fase === (f === 'Monitoramento' ? 'Encerramento' : f));

/**
 * Iniciação ─G1─ Planejamento ─G2─ Execução ─G3─ [ Monitoramento ∥ Encerramento ] ─G4
 * A fase avança quando o gate é aprovado.
 */
export function CicloVida({ projeto: p, faseSel, aoSelecionar, aoDecidir }: Props) {
  const { dados, solicitarGate, avisarPmoGate } = usePortal();
  const { pode } = usePapel();
  const toast = useToast();
  // o gate só abre quando a pessoa clica no losango (clicar na fase apenas filtra o cronograma)
  const [gateAberto, setGateAberto] = useState<string | null>(null);
  useEffect(() => { setGateAberto(null); }, [p.codigo]);   // ao trocar de projeto, o painel do gate fecha
  const gate = gateAberto ? p.fases.find(g => g.gate === gateAberto) : undefined;
  const bloqueio = gate ? gateBloqueante(p, gate) : undefined;
  // G1 (cadastro) é aprovado pelo PMO; G2 a G4 pelo patrocinador
  const podeAprovar = !!gate && (gate.gate === 'G1' ? pode('aprovarCadastro') : pode('aprovarGate'));
  // G3/G4: o que falta para pedir (e aprovar) o gate; o TRD é procurado na pasta do projeto
  const { fonte } = usePortal();
  const [temTrd, setTemTrd] = useState<boolean | null>(null);
  useEffect(() => {
    if (gate?.gate !== 'G4' || gate.situacao === 'Aprovado' || fonte.modo === 'piloto') return;
    fonte.documentos(p.codigo).then(l => setTemTrd(l.some(x => x.arquivos.some(a => /\btrd\b|termo\s*de\s*aceite/i.test(a.nome))))).catch(() => setTemTrd(false));
  }, [gate?.gate, gate?.situacao, p.codigo, fonte]);
  const checklist = gate ? checklistGate(gate.gate, p, dados, gate.gate === 'G4' && fonte.modo !== 'piloto' ? temTrd ?? false : null) : [];

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
        <button type="button" className="gbtn" title={`${g.nome} · ${g.situacao}`} aria-label={`${g.nome}: ${g.situacao}`} aria-pressed={gateAberto === g.gate}
          onClick={() => setGateAberto(atual => (atual === g.gate ? null : g.gate))}>
          <Losango texto={g.gate} situacao={g.situacao} />
        </button>
      </div>
    );
  };

  return (
    <section className="card ciclo">
      <div className="linha" style={{ alignItems: 'baseline' }}>
        <h2 className="h3" style={{ fontSize: 18 }}>Ciclo de vida do projeto</h2>
      </div>
      <div className="trilhaF">
        <div className="fcol">{botaoFase('Iniciação')}{losango('Iniciação')}</div>
        <div className="fcol">{botaoFase('Planejamento')}{losango('Planejamento')}</div>
        <div className="fcol">{botaoFase('Execução')}{losango('Execução')}</div>
        <div className="fcol bloco">
          <div className="blocoIn">
            <div className="rotBloco">Monitoramento e encerramento · em paralelo</div>
            <div className="blocoFases">{botaoFase('Monitoramento')}{botaoFase('Encerramento')}</div>
          </div>
          {losango('Encerramento')}
        </div>
      </div>
      {gate && (
        <div className="gateBox" style={{ background: GATE_CAIXA[gate.situacao] || '#F3F3F4' }}>
          <Losango texto={gate.gate} situacao={gate.situacao} grande />
          <button type="button" className="fechar" aria-label="Fechar gate" style={{ order: 9 }} onClick={() => setGateAberto(null)}>×</button>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 600 }}>{gate.nome} · {gate.situacao}{gate.data ? ` · previsto para ${dma(gate.data)}` : ''}</div>
            {gate.info && <div className="sub" style={{ fontSize: 13, marginTop: 2 }}>{gate.info}</div>}
            {gate.situacao === 'Aprovado' && (gate.aprovadoPor || gate.dataAprovacao) && (
              <div className="sub" style={{ fontSize: 13, marginTop: 4, color: TEMA.vinho }}>
                Aprovado{gate.aprovadoPor ? ` por ${gate.aprovadoPor}` : ''}{gate.dataAprovacao ? ` em ${dma(gate.dataAprovacao)}` : ''}{gate.parecer ? ` · ${gate.parecer}` : ''}
              </div>
            )}
            {gate.situacao === 'Pendente' && gate.parecer && <div className="sub" style={{ fontSize: 13, marginTop: 4, color: 'var(--txt-erro)' }}>Devolvido: {gate.parecer}</div>}
            {bloqueio && gate.situacao !== 'Aprovado' && <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>Só pode ser aprovado depois do {bloqueio.gate}.</div>}
            {checklist.length > 0 && gate.situacao !== 'Aprovado' && (
              <ul className="checkGate">
                {checklist.map(i => <li key={i.texto} className={i.ok === false ? 'nao' : i.ok ? 'sim' : 'talvez'}><span aria-hidden="true">{i.ok === false ? '✗' : i.ok ? '✓' : '–'}</span>{i.texto}</li>)}
              </ul>
            )}
            {!bloqueio && gate.situacao === 'Aguardando aprovação' && !podeAprovar && <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>Aguardando a decisão do patrocinador.</div>}
          </div>
          {gate.situacao !== 'Aprovado' && !bloqueio && (
            <div className="gateAcoes">
              {gate.situacao === 'Pendente' && pode('solicitarGate') && !podeAprovar && <button type="button" className="btn pq" disabled={checklist.some(i => i.ok === false)} onClick={() => solicitar(gate)}>Solicitar aprovação</button>}
              {podeAprovar && <button type="button" className="btn pq ok" onClick={() => aoDecidir(gate)}>{gate.situacao === 'Aguardando aprovação' ? 'Analisar pedido do PMO' : `Aprovar ${gate.gate}`}</button>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
