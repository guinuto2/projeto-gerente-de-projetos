/** Gráfico de barras verticais simples (HTML/CSS), com o valor em cima de cada barra. */
export interface Barra { rotulo: string; valor: number; cor: string }

export function GraficoBarras({ titulo, dados, unidade = '', vazio = 'Sem dados.', legenda }: { titulo: string; dados: Barra[]; unidade?: string; vazio?: string; legenda?: { rotulo: string; cor: string }[] }) {
  // legenda: as cores de cada barra (ou uma legenda própria, ex.: uma cor só para todas as barras)
  const itensLegenda = legenda || dados.map(d => ({ rotulo: d.rotulo, cor: d.cor }));
  const max = Math.max(1, ...dados.map(d => d.valor));
  const fmt = (v: number) => `${Number.isInteger(v) ? v : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unidade}`;
  return (
    <section className="card pad grafico" aria-label={titulo}>
      <h3 className="h3" style={{ fontSize: 15 }}>{titulo}</h3>
      {itensLegenda.length > 0 && (
        <div className="graficoLegenda">
          {itensLegenda.map(l => <span key={l.rotulo}><i style={{ background: l.cor }} />{l.rotulo}</span>)}
        </div>
      )}
      {dados.every(d => !d.valor) ? <p className="sub" style={{ marginTop: 12 }}>{vazio}</p> : (
        <div className="barras" role="img" aria-label={`${titulo}: ${dados.map(d => `${d.rotulo} ${fmt(d.valor)}`).join(', ')}`}>
          {dados.map(d => (
            <div key={d.rotulo} className="barraCol" title={`${d.rotulo}: ${fmt(d.valor)}`}>
              <span className="barraValor">{fmt(d.valor)}</span>
              <div className="barraTrilho"><div className="barraCheia" style={{ height: `${(d.valor / max) * 100}%`, background: d.cor }} /></div>
              <span className="barraRotulo">{d.rotulo}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
