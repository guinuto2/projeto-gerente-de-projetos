import type { Projeto } from '../../../types/models';

const Lista = ({ itens }: { itens: string[] }) => <ul className="ul">{itens.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export function AbaEscopo({ projeto: p }: { projeto: Projeto }) {
  const n = p.numeros;
  const numeros: [string, string][] = n ? [
    [String(n.localidades), 'localidades'], [String(n.hosts), 'hosts ESX'], [String(n.hostsMover), 'hosts a movimentar'], [`~${n.vmsImpactadas}`, 'VMs impactadas'],
    [String(n.clusters), 'clusters'], [n.janelas, 'janelas de manutenção'], [`${n.diasSystech} d`, 'esforço Systech'], [`${n.diasTRF1} d`, 'esforço do cliente']
  ] : [];
  return (
    <>
      {n && <div className="nums" style={{ marginBottom: 20 }}>{numeros.map(([v, t]) => <div key={t}><b>{v}</b><span>{t}</span></div>)}</div>}
      <div className="dois">
        <div className="card pad"><h3 className="h3">No escopo</h3><Lista itens={p.escopoIncluido} /></div>
        <div className="card pad"><h3 className="h3">Fora do escopo</h3><Lista itens={p.escopoExcluido} /></div>
      </div>
      <div style={{ marginTop: 16 }}>
        <details open><summary>Premissas ({p.premissas.length})</summary><Lista itens={p.premissas} /></details>
        <details><summary>Dependências ({p.dependencias.length})</summary><Lista itens={p.dependencias} /></details>
        <details><summary>Restrições ({p.restricoes.length})</summary><Lista itens={p.restricoes} /></details>
        <details>
          <summary>Equipe ({p.equipe.length})</summary>
          <ul className="ul">
            {p.equipe.map((e, i) => (
              <li key={i}><b>{e.nome}</b> · {e.funcao} · {e.empresa}{e.email && <> · <a href={`mailto:${e.email}`}>{e.email}</a></>}</li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );
}
