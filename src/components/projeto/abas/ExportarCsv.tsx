import type { Projeto } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { useToast } from '../../../state/ToastContext';
import { baixarCsv, csvCronograma, csvPendencias, csvRiscos } from '../../../lib/csv';
import { hojeIso } from '../../../lib/datas';

const GERADORES = { cronograma: csvCronograma, riscos: csvRiscos, pendencias: csvPendencias };
const NOMES = { cronograma: 'cronograma', riscos: 'riscos', pendencias: 'pendencias' };

/** Botão "Exportar CSV" (abre direto no Excel). */
export function ExportarCsv({ projeto, tipo }: { projeto: Projeto; tipo: keyof typeof GERADORES }) {
  const { dados } = usePortal();
  const toast = useToast();
  const exportar = () => {
    baixarCsv(`${projeto.codigo}_${NOMES[tipo]}_${hojeIso()}.csv`, GERADORES[tipo](dados, projeto));
    toast('Arquivo CSV baixado. Ele abre direto no Excel.');
  };
  return <button type="button" className="btn pq" onClick={exportar} title="Baixar em CSV (Excel)">Exportar CSV</button>;
}
