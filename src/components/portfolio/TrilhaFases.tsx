import type { Fase } from '../../types/models';
import { ABREV_FASE, FASES } from '../../lib/constantes';
import { TEMA } from '../../lib/tema';

/** Barra de fases do card: concluídas em verde, atual em azul. */
export function TrilhaFases({ atual }: { atual: Fase }) {
  const i = FASES.indexOf(atual);
  return (
    <div className="trilha" aria-label={`Fase atual: ${atual}`}>
      {FASES.map((f, k) => {
        // Monitoramento (3) acompanha o Encerramento (4)
        const emCurso = k === i || (i === 4 && k === 3);
        const cor = emCurso ? TEMA.vinho : k < i ? TEMA.cinzaMarca : TEMA.futuro;
        return (
          <div key={f}>
            <i style={{ background: cor }} />
            <small style={{ color: emCurso ? TEMA.vinho : TEMA.suave, fontWeight: emCurso ? 700 : 400 }}>{ABREV_FASE[k]}</small>
          </div>
        );
      })}
    </div>
  );
}
