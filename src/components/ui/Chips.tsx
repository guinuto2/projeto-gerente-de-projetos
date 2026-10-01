interface ChipsProps<T extends string> {
  opcoes: readonly T[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
  formatar?: (v: T) => string;
}

/** Grupo de filtros de seleção única. */
export function Chips<T extends string>({ opcoes, valor, aoMudar, rotulo, formatar }: ChipsProps<T>) {
  return (
    <div className="chips" role="group" aria-label={rotulo}>
      {opcoes.map(o => (
        <button key={o} type="button" className={`chip ${o === valor ? 'on' : ''}`} aria-pressed={o === valor} onClick={() => aoMudar(o)}>
          {formatar ? formatar(o) : o}
        </button>
      ))}
    </div>
  );
}
