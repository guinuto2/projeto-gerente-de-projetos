import { useEffect, useState, type MouseEvent } from 'react';
import type { Atividade } from '../../types/models';
import { instanteReuniao, reuniaoPassou } from '../../lib/reunioes';

interface Props {
  atividade: Atividade;
  classe: string;
  texto: string;
  textoDisponivel?: string;
  textoExpirado?: string;
  titulo?: string;
}

/** O horário já ultrapassado continua visível, mas não abre mais o Teams. */
export function LinkReuniao({ atividade, classe, texto, textoDisponivel, textoExpirado, titulo }: Props) {
  const [passou, setPassou] = useState(() => reuniaoPassou(atividade.reuniaoInicio));
  useEffect(() => {
    setPassou(reuniaoPassou(atividade.reuniaoInicio));
    const inicio = instanteReuniao(atividade.reuniaoInicio);
    if (inicio === null || inicio <= Date.now()) return;
    let timer: number;
    const atualizar = () => {
      const restante = inicio - Date.now();
      if (restante <= 0) setPassou(true);
      else timer = window.setTimeout(atualizar, Math.min(restante, 2147483647));
    };
    atualizar();
    return () => window.clearTimeout(timer);
  }, [atividade.reuniaoInicio]);

  if (!atividade.reuniaoUrl) return <span className={`${classe} passada`} title="Reunião sem link disponível">{texto}</span>;
  if (passou) return <span className={`${classe} passada`} title="O horário desta reunião já passou" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>{textoExpirado || `${texto} · Horário encerrado`}</span>;

  const abrir = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    // Confere novamente no instante do clique, inclusive entre duas atualizações do relógio.
    if (reuniaoPassou(atividade.reuniaoInicio)) { e.preventDefault(); setPassou(true); }
  };
  return <a className={classe} href={atividade.reuniaoUrl} target="_blank" rel="noopener noreferrer"
    onClick={abrir} title={titulo || 'Entrar na reunião do Teams'}>{textoDisponivel || texto}</a>;
}
