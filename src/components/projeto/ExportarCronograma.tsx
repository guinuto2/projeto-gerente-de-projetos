import type { Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { planilhaCronograma } from '../../lib/planilhaCronograma';
import { baixarArquivo } from '../../lib/xlsx';

/** Baixa o cronograma (atividades e datas previstas) em planilha do Excel formatada. */
export function ExportarCronograma({ projeto }: { projeto: Projeto }) {
  const { dados, hoje } = usePortal();
  const toast = useToast();
  const exportar = () => {
    baixarArquivo(`${projeto.codigo}_cronograma_${hoje}.xlsx`, planilhaCronograma(dados, projeto, hoje));
    toast('Planilha do cronograma baixada.');
  };
  return <button type="button" className="btn pq" onClick={exportar} title="Baixar o cronograma em Excel">⤓ Exportar cronograma</button>;
}
