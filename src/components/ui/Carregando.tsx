/** Animação de carregamento (roda girando) com uma frase. */
export function Carregando({ texto = 'Carregando…', telaCheia = false }: { texto?: string; telaCheia?: boolean }) {
  return (
    <div className={`carregando ${telaCheia ? 'cheia' : ''}`} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
