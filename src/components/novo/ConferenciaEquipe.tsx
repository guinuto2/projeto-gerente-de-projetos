import { useEffect, useState } from 'react';
import type { FormProjeto } from './formulario';
import { usePortal } from '../../state/PortalContext';
import { conferirEquipe } from '../../lib/conferencia';

let cacheUsuarios: Promise<Set<string> | null> | null = null;

/** Conferência das pessoas e e-mails do projeto (lista Portal Tecnicos e acesso ao site), sem nenhuma permissão extra. */
export function useConferencia(form: FormProjeto | null) {
  const { fonte, pessoasApp } = usePortal();
  const [usuarios, setUsuarios] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!fonte.usuariosDoSite) return;
    if (!cacheUsuarios) cacheUsuarios = fonte.usuariosDoSite().catch(() => null);
    cacheUsuarios.then(setUsuarios);
  }, [fonte]);
  return form ? conferirEquipe(form, pessoasApp, usuarios) : { erros: [], avisos: [] };
}

export function ConferenciaEquipe({ conf }: { conf: { erros: string[]; avisos: string[] } }) {
  if (!conf.erros.length && !conf.avisos.length) return <div className="avisoPessoas ok"><span><b>Conferência da equipe:</b> pessoas e e-mails conferidos com a lista Portal Tecnicos.</span></div>;
  return (
    <div className={`conferencia ${conf.erros.length ? 'erro' : ''}`}>
      <b>Conferência da equipe</b>
      {conf.erros.length > 0 && <ul className="ul">{conf.erros.map(e => <li key={e} className="confErro">{e}</li>)}</ul>}
      {conf.avisos.length > 0 && <ul className="ul">{conf.avisos.map(a => <li key={a}>{a}</li>)}</ul>}
      <span className="sub" style={{ fontSize: 12 }}>{conf.erros.length ? 'Corrija os e-mails inválidos para gravar.' : 'São avisos: dá para gravar assim mesmo, depois de conferir.'}</span>
    </div>
  );
}
