import type { MembroEquipe } from '../../types/models';

interface Props { equipe: MembroEquipe[]; aoMudar: (e: MembroEquipe[]) => void }

const vazio = (): MembroEquipe => ({ nome: '', funcao: 'Técnico', empresa: 'Systech', email: '' });

/** Pessoas do projeto. Quem está aqui (por nome ou e-mail) enxerga o projeto no perfil Técnico. */
export function EditorEquipe({ equipe, aoMudar }: Props) {
  const mudar = (i: number, c: keyof MembroEquipe, v: string) => aoMudar(equipe.map((m, k) => (k === i ? { ...m, [c]: v } : m)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="sub">Inclua o e-mail Microsoft 365 de cada pessoa: é por ele que o portal reconhece quem pode ver o projeto.</p>
      <div className="twrap">
        <table className="tbl ftbl">
          <thead><tr><th>Nome</th><th>Função</th><th>Empresa</th><th>E-mail</th><th /></tr></thead>
          <tbody>
            {equipe.map((m, i) => (
              <tr key={i}>
                <td style={{ minWidth: 180 }}><input className="ctl" aria-label="Nome" value={m.nome} onChange={e => mudar(i, 'nome', e.target.value)} /></td>
                <td style={{ minWidth: 150 }}>
                  <input className="ctl" aria-label="Função" list="funcoes-equipe" value={m.funcao} onChange={e => mudar(i, 'funcao', e.target.value)} />
                </td>
                <td style={{ minWidth: 120 }}><input className="ctl" aria-label="Empresa" value={m.empresa} onChange={e => mudar(i, 'empresa', e.target.value)} /></td>
                <td style={{ minWidth: 220 }}><input className="ctl" type="email" aria-label="E-mail" value={m.email} onChange={e => mudar(i, 'email', e.target.value)} /></td>
                <td><button type="button" className="rm" aria-label="Remover pessoa" onClick={() => aoMudar(equipe.filter((_, k) => k !== i))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="funcoes-equipe">{['Gerente de projeto', 'Arquiteto', 'Técnico', 'Responsável do cliente', 'Patrocinador'].map(f => <option key={f} value={f} />)}</datalist>
      <div><button type="button" className="btn pq" onClick={() => aoMudar([...equipe, vazio()])}>+ Adicionar pessoa</button></div>
    </div>
  );
}
