import type { FormProjeto } from './formulario';

type Campo = 'escopoIncluido' | 'escopoExcluido' | 'premissas' | 'dependencias' | 'restricoes';

export function PassoEscopo({ form, mudar }: { form: FormProjeto; mudar: (c: Campo, v: string) => void }) {
  const area = (c: Campo, rotulo: string) => (
    <label className="campo">{rotulo}<span className="dica">Um item por linha</span>
      <textarea className="ctl" rows={5} value={form[c]} onChange={e => mudar(c, e.target.value)} />
    </label>
  );
  return (
    <>
      <div className="fg2">
        {area('escopoIncluido', 'No escopo')}
        {area('escopoExcluido', 'Fora do escopo')}
        {area('premissas', 'Premissas')}
        {area('dependencias', 'Dependências')}
      </div>
      {area('restricoes', 'Restrições')}
    </>
  );
}
