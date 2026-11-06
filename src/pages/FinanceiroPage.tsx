import { Link } from 'react-router-dom';
import { usePapel } from '../state/PapelContext';
import { Mensagem } from '../components/ui/Mensagem';

/** Financeiro (PMO e patrocinador) — página reservada; o conteúdo vem nas próximas versões. */
export function FinanceiroPage() {
  const { papel } = usePapel();
  if (papel !== 'PMO' && papel !== 'Patrocinador') return <main className="main"><Mensagem tipo="info">O financeiro é visível só para o PMO e o patrocinador.</Mensagem></main>;
  return (
    <main className="main">
      <div>
        <div className="migalha"><Link to="/">Central Systech</Link> › Financeiro</div>
        <h1 className="ptit" style={{ marginTop: 8 }}>Financeiro</h1>
      </div>
      <section className="card vazioFin">
        <div className="vazioIcone" aria-hidden="true">R$</div>
        <h2 className="h3">Em construção</h2>
        <p className="sub">Esta área vai reunir os dados financeiros dos projetos.</p>
      </section>
    </main>
  );
}
