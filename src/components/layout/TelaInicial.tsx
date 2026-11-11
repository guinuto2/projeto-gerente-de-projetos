interface TelaInicialProps {
  aoEntrar: () => void;
  piloto: boolean;
}

/** Tela pública de boas-vindas. Não monta os providers de dados antes de solicitar o acesso. */
export function TelaInicial({ aoEntrar, piloto }: TelaInicialProps) {
  return (
    <main className="entrada" aria-labelledby="entradaTitulo">
      <div className="entradaDetalhe" aria-hidden="true" />
      <section className="entradaCentro">
        <div className="entradaSelo"><span aria-hidden="true" /> Gestão de projetos · Unificação de processos</div>
        <img
          className="entradaLogo"
          src={`${import.meta.env.BASE_URL}Systech20anos.png`}
          alt="Systech — 20 anos"
          width="806"
          height="180"
        />
        <h1 id="entradaTitulo">Bem-vindo à Central Systech</h1>
        <button type="button" className="entradaBotao" onClick={aoEntrar}>
          <span className="entradaMicrosoft" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>{piloto ? 'Acessar demonstração' : 'Entrar com Microsoft'}</span>
          <span className="entradaSeta" aria-hidden="true">→</span>
        </button>
      </section>

      <footer className="entradaRodape">© {new Date().getFullYear()} Systech · Central Systech</footer>
    </main>
  );
}
