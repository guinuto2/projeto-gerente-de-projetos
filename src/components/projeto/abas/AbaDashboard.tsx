import { useEffect, useMemo, useState } from 'react';
import type { Atividade, Projeto, RegistroHistorico } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { avanco, planejado } from '../../../lib/calculos';
import { Kpi } from '../../ui/Kpi';
import { GraficoBarras } from '../../ui/GraficoBarras';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = (aaaamm: string) => `${MESES[Number(aaaamm.slice(5, 7)) - 1]}/${aaaamm.slice(2, 4)}`;
const horas = (v: unknown) => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);

/**
 * Horas lançadas por mês: cada atualização registra as horas antes e depois (acompanhamento); a diferença vai para o
 * mês da atualização. O que não tiver registro (horas antigas) entra no mês da última atualização da atividade.
 */
function horasPorMes(itens: Atividade[], historico: RegistroHistorico[], hoje: string): Record<string, number> {
  const meses: Record<string, number> = {};
  const lancadoPorItem: Record<string, number> = {};
  for (const r of historico) {
    if (!r.item || !r.antes && !r.depois) continue;
    try {
      const antes = r.antes ? horas(JSON.parse(r.antes).horasRealizadas) : 0;
      const depois = r.depois ? horas(JSON.parse(r.depois).horasRealizadas) : 0;
      const delta = depois - antes;
      if (delta <= 0) continue;
      const mes = new Date(r.quando).toISOString().slice(0, 7);
      meses[mes] = (meses[mes] || 0) + delta;
      lancadoPorItem[r.item] = (lancadoPorItem[r.item] || 0) + delta;
    } catch { /* registro sem retrato válido */ }
  }
  for (const a of itens) {
    const resto = horas(a.horasRealizadas) - (lancadoPorItem[a.codigo] || 0);
    if (resto <= 0) continue;
    const mes = (a.dataUltimaAtualizacao || a.dataReal || a.termino || hoje).slice(0, 7);
    meses[mes] = (meses[mes] || 0) + resto;
  }
  return meses;
}

/** Dashboard do projeto: números principais e gráficos de status, progresso e horas por mês. */
export function AbaDashboard({ projeto: p }: { projeto: Projeto }) {
  const { dados, hoje, fonte } = usePortal();
  const itens = (dados.atividades[p.codigo] || []).filter(a => a.status !== 'Cancelado');
  const principais = itens.filter(a => !a.pai), tarefas = itens.filter(a => a.pai);
  const totalHoras = itens.reduce((s, a) => s + horas(a.horasRealizadas), 0);
  const totalPlanejadas = itens.reduce((s, a) => s + horas(a.horasPlanejadas), 0);
  const hf = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const [historico, setHistorico] = useState<RegistroHistorico[] | null>(null);
  useEffect(() => { fonte.historico(p.codigo).then(setHistorico).catch(() => setHistorico([])); }, [fonte, p.codigo]);

  const porStatus = [
    { rotulo: 'Concluído', valor: itens.filter(a => a.status === 'Concluído').length, cor: 'var(--g-concluido)' },
    { rotulo: 'Em andamento', valor: itens.filter(a => a.status === 'Em andamento').length, cor: 'var(--g-emcurso)' },
    { rotulo: 'Planejada', valor: itens.filter(a => a.status === 'Planejado').length, cor: 'var(--cinzaMarca)' },
    { rotulo: 'Pendente', valor: itens.filter(a => a.status === 'Bloqueado').length, cor: 'var(--g-atrasado)' },
    { rotulo: 'A confirmar', valor: itens.filter(a => a.status === 'A confirmar').length, cor: '#2B4C7E' }
  ];
  const pct = (a: Atividade) => (a.status === 'Concluído' ? 100 : a.percentual || 0);
  const porProgresso = [
    { rotulo: '0%', valor: itens.filter(a => pct(a) === 0).length, cor: 'var(--g-barra)' },
    { rotulo: '1–49%', valor: itens.filter(a => pct(a) >= 1 && pct(a) <= 49).length, cor: 'var(--vinhoBorda)' },
    { rotulo: '50–99%', valor: itens.filter(a => pct(a) >= 50 && pct(a) <= 99).length, cor: 'var(--vinho)' },
    { rotulo: '100%', valor: itens.filter(a => pct(a) === 100).length, cor: 'var(--g-concluido)' }
  ];
  const porMes = useMemo(() => {
    if (!historico) return [];
    const m = horasPorMes(itens, historico, hoje);
    return Object.keys(m).sort().slice(-12).map(k => ({ rotulo: rotuloMes(k), valor: Math.round(m[k] * 10) / 10, cor: 'var(--vinho)' }));
  }, [historico, dados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="kpis kpis4">
        <Kpi rotulo="Atividades" valor={principais.length} nota={`${tarefas.length} tarefa(s) · ${itens.filter(a => a.status === 'Concluído').length} concluída(s) no total`} />
        <Kpi rotulo="Progresso" valor={`${avanco(dados, p.codigo)}%`} nota={`planejado para hoje: ${planejado(dados, p.codigo, hoje)}%`} />
        <Kpi rotulo="Horas realizadas/planejadas" valor={`${hf(totalHoras)}/${totalPlanejadas ? hf(totalPlanejadas) : '—'} h`} nota="soma das atividades e tarefas" />
        <Kpi rotulo="Itens críticos" valor="—" nota="critério a definir" />
      </div>
      <div className="graficos">
        <GraficoBarras titulo="Atividades por status" dados={porStatus} />
        <GraficoBarras titulo="Faixas de progresso" dados={porProgresso} />
        <GraficoBarras titulo="Horas lançadas por mês" dados={historico ? porMes : []} unidade=" h" legenda={[{ rotulo: 'Horas lançadas no mês', cor: 'var(--vinho)' }]}
          vazio={historico ? 'Nenhuma hora lançada ainda.' : 'Buscando…'} />
      </div>
      <p className="sub" style={{ fontSize: 12 }}>Os gráficos consideram atividades e tarefas (subatividades), sem as canceladas. "Pendente" = status Bloqueado.</p>
    </div>
  );
}
