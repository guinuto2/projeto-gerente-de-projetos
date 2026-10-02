import { useState } from 'react';
import type { Gate, Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { config } from '../../../config/config';
import { progressoFase } from '../../../lib/calculos';
import { PROXIMA_FASE, SELO_STATUS } from '../../../lib/constantes';
import { dm } from '../../../lib/datas';
import { Drawer } from '../../ui/Drawer';
import { Selo } from '../../ui/Selo';

/** Painel do PMO para aprovar o gate (avança a fase) ou devolver ao GP com parecer. */
export function DecidirGate({ projeto: p, gate, aoFechar }: { projeto: Projeto; gate: Gate; aoFechar: () => void }) {
  const { dados, decidirGate, aprovarCadastro, avisarAprovacao } = usePortal();
  const toast = useToast();
  // o G3 fecha Execução e Monitoramento juntas
  const fases = gate.fase === 'Execução' ? (['Execução', 'Monitoramento'] as const) : [gate.fase];
  const partes = fases.map(f => progressoFase(dados, p.codigo, f));
  const prog = { feitas: partes.reduce((s, x) => s + x.feitas, 0), total: partes.reduce((s, x) => s + x.total, 0), abertas: partes.flatMap(x => x.abertas) };
  const [parecer, setParecer] = useState('');
  const [congelar, setCongelar] = useState(gate.gate === 'G2');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const destino = gate.gate === 'G4' ? 'encerra o projeto' : `leva o projeto para ${PROXIMA_FASE[gate.fase] || 'a próxima fase'}`;

  const decidir = async (aprovar: boolean) => {
    if (!aprovar && !parecer.trim()) { setErro('Escreva no parecer o que precisa ser ajustado antes de devolver.'); return; }
    setSalvando(true); setErro('');
    try {
      if (aprovar && gate.gate === 'G1' && p.situacaoCadastro !== 'Ativo') await aprovarCadastro(p.codigo, parecer.trim());
      else await decidirGate(p.codigo, gate.gate, { aprovar, parecer: parecer.trim(), congelarBaseline: aprovar && gate.gate === 'G2' && congelar });
      toast(aprovar ? `${gate.gate} aprovado. ${gate.gate === 'G4' ? 'Projeto encerrado.' : `Projeto em ${PROXIMA_FASE[gate.fase]}.`}` : `${gate.gate} devolvido ao PMO.`);
      aoFechar();
      if (aprovar && config.emailAoAprovar) {
        avisarAprovacao(p.codigo, gate.gate, parecer.trim())
          .then(para => toast(`${gate.gate} aprovado. Aviso enviado para ${para}.`))
          .catch(e => toast(`${gate.gate} aprovado, mas o e-mail não saiu: ${(e as Error).message}.`));
      }
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  };

  return (
    <Drawer aberto titulo={gate.nome} subtitulo={`${p.codigo} · ${gate.fase === 'Execução' ? 'Gate de Execução e Monitoramento' : `Gate da fase ${gate.fase}`}`} salvando={salvando} erro={erro}
      aoFechar={aoFechar} aoSalvar={() => decidir(true)} rotuloSalvar={`Aprovar ${gate.gate}`}
      acoes={gate.situacao === 'Aguardando aprovação' && <button type="button" className="btn perigo" disabled={salvando} onClick={() => decidir(false)}>Devolver ao PMO</button>}>
      <p style={{ fontSize: 14, color: 'var(--medio)', lineHeight: 1.5 }}>
        {gate.situacao === 'Aguardando aprovação' ? 'O PMO pediu a aprovação deste gate. ' : 'Você está aprovando este gate diretamente. '}
        Confirmar registra a decisão e {destino}.
      </p>
      {gate.info && <div><div className="sub">Critério</div><div style={{ fontSize: 14, marginTop: 2 }}>{gate.info}</div></div>}
      <div>
        <div className="sub">Atividades {gate.fase === 'Execução' ? 'de Execução e Monitoramento' : `da fase ${gate.fase}`}</div>
        <div style={{ fontSize: 14, marginTop: 2, fontWeight: 600 }}>{prog.feitas} de {prog.total} concluídas</div>
        {prog.abertas.length > 0 && (
          <>
            <ul className="checklist">
              {prog.abertas.slice(0, 8).map(a => (
                <li key={a.codigo}><span>{a.codigo} · {a.nome}</span><span><Selo valor={a.status} cores={SELO_STATUS} /> <span className="sub">até {dm(a.termino)}</span></span></li>
              ))}
            </ul>
            <div className="msg info" style={{ marginTop: 8 }}>Ainda há atividades abertas nesta fase. Você pode aprovar mesmo assim; registre no parecer o motivo.</div>
          </>
        )}
      </div>
      {gate.gate === 'G2' && (
        <label className="checar">
          <input type="checkbox" checked={congelar} onChange={e => setCongelar(e.target.checked)} />
          <span>Congelar a linha de base com as datas atuais do cronograma<br /><span className="sub">As barras cinzas do Gantt passam a ser as datas de hoje. Desvios futuros são medidos a partir delas.</span></span>
        </label>
      )}
      <label className="campo">Parecer do patrocinador
        <textarea className="ctl" value={parecer} onChange={e => setParecer(e.target.value)} placeholder="Condições da aprovação ou o que precisa ser ajustado." />
      </label>
    </Drawer>
  );
}
