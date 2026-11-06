import type { MembroEquipe } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { ativos, pessoasComPapel, tecnicoPorNome, tecnicosParaCadastro } from '../../lib/pessoas';
import { FUNCOES_EQUIPE } from '../../lib/constantes';

interface Props { equipe: MembroEquipe[]; aoMudar: (e: MembroEquipe[]) => void }

const ehTecnico = (m: MembroEquipe) => /^t[eé]cnico$/i.test(m.funcao.trim());
const tecnicoVazio = (): MembroEquipe => ({ nome: '', funcao: 'Técnico', empresa: 'Systech', email: '' });
const pessoaVazia = (): MembroEquipe => ({ nome: '', funcao: 'Responsável do cliente', empresa: '', email: '' });

/**
 * Pessoas do projeto. Quem tem a função "Técnico" é escolhido na tabela de técnicos da Systech
 * (lista Portal Tecnicos): nome, e-mail e empresa vêm de lá.
 */
export function EditorEquipe({ equipe, aoMudar }: Props) {
  const { dados, pessoasApp } = usePortal();
  const tecnicos = tecnicosParaCadastro(ativos(dados.tecnicos || []), pessoasApp);
  // gerente e patrocinador: pessoas com essa função na lista Portal Tecnicos
  const opcoes = (funcao: string): { nome: string; email: string }[] =>
    funcao === 'Gerente de projeto' ? pessoasComPapel(pessoasApp, 'PMO') : funcao === 'Patrocinador' ? pessoasComPapel(pessoasApp, 'Patrocinador') : [];
  const mudar = (i: number, campos: Partial<MembroEquipe>) => aoMudar(equipe.map((m, k) => (k === i ? { ...m, ...campos } : m)));
  const escolherTecnico = (i: number, nome: string) => {
    const t = tecnicoPorNome(tecnicos, nome);
    mudar(i, t ? { nome: t.nome, email: t.email, empresa: 'Systech' } : { nome, email: '' });
  };
  const usados = new Set(equipe.map(m => m.nome.trim().toLowerCase()).filter(Boolean));
  const usadosEmail = new Set(equipe.map(m => (m.email || '').trim().toLowerCase()).filter(Boolean));
  const livre = (p: { nome: string; email: string }, atual: string) => p.nome === atual || (!usados.has(p.nome.trim().toLowerCase()) && !(p.email && usadosEmail.has(p.email.toLowerCase())));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="twrap">
        <table className="tbl ftbl">
          <thead><tr><th>Função</th><th>Nome</th><th>Empresa</th><th>E-mail</th><th>Telefone</th><th /></tr></thead>
          <tbody>
            {equipe.map((m, i) => {
              const tec = ehTecnico(m);
              const naTabela = !!tecnicoPorNome(tecnicos, m.nome);
              return (
                <tr key={i}>
                  <td style={{ minWidth: 150 }}>
                    <select className="ctl" aria-label="Função" value={m.funcao} onChange={e => mudar(i, ehTecnico({ ...m, funcao: e.target.value }) && !ehTecnico(m)
                      ? { funcao: e.target.value, nome: '', email: '', empresa: 'Systech' }   // virou técnico: escolhe na tabela
                      : { funcao: e.target.value })}>
                      {FUNCOES_EQUIPE.map(f => <option key={f}>{f}</option>)}
                      {/* projetos antigos com função fora da lista: mantém até alguém trocar */}
                      {m.funcao && !FUNCOES_EQUIPE.includes(m.funcao) && <option value={m.funcao}>{m.funcao} (fora da lista)</option>}
                    </select>
                  </td>
                  <td style={{ minWidth: 200 }}>
                    {!tec && opcoes(m.funcao).length > 0
                      ? <select className="ctl" aria-label={m.funcao} value={m.nome} onChange={e => {
                          const p = opcoes(m.funcao).find(x => x.nome === e.target.value);
                          mudar(i, p ? { nome: p.nome, email: p.email, empresa: 'Systech' } : { nome: e.target.value });
                        }}>
                          <option value="">— escolha —</option>
                          {opcoes(m.funcao).filter(p => livre(p, m.nome)).map(p => <option key={p.email || p.nome} value={p.nome}>{p.nome}</option>)}
                          {m.nome && !opcoes(m.funcao).some(x => x.nome === m.nome) && <option value={m.nome}>{m.nome} (fora da lista)</option>}
                        </select>
                      : tec
                      ? <select className="ctl" aria-label="Técnico" value={m.nome} onChange={e => escolherTecnico(i, e.target.value)}>
                          <option value="">— escolha o técnico —</option>
                          {tecnicos.filter(t => livre(t, m.nome)).map(t => <option key={t.email || t.nome} value={t.nome}>{t.nome}</option>)}
                          {m.nome && !naTabela && <option value={m.nome}>{m.nome} (fora da tabela)</option>}
                        </select>
                      : <input className="ctl" aria-label="Nome" value={m.nome} onChange={e => mudar(i, { nome: e.target.value })} />}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <input className="ctl" aria-label="Empresa" value={m.empresa} disabled={tec && naTabela} onChange={e => mudar(i, { empresa: e.target.value })} />
                  </td>
                  <td style={{ minWidth: 230 }}>
                    <input className="ctl" type="email" aria-label="E-mail" value={m.email} disabled={tec && naTabela}
                      title={tec && naTabela ? 'Vem da tabela de técnicos' : undefined} onChange={e => mudar(i, { email: e.target.value })} />
                  </td>
                  <td style={{ minWidth: 150 }}>
                    <input className={`ctl ${/^fiscal$/i.test(m.funcao.trim()) && !(m.telefone || '').trim() ? 'erro' : ''}`} type="tel" aria-label="Telefone"
                      placeholder={/^fiscal$/i.test(m.funcao.trim()) ? 'Obrigatório' : '(00) 00000-0000'} value={m.telefone || ''}
                      onChange={e => mudar(i, { telefone: e.target.value })} />
                  </td>
                  <td><button type="button" className="rm" aria-label="Remover pessoa" onClick={() => aoMudar(equipe.filter((_, k) => k !== i))}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <button type="button" className="btn pq" onClick={() => aoMudar([...equipe, tecnicos.length ? tecnicoVazio() : pessoaVazia()])}>+ Adicionar pessoa</button>
      </div>
      {!tecnicos.length && <p className="sub">Nenhum técnico cadastrado. Rode o script provisionar-portal.ps1 para criar e popular a lista Portal Tecnicos.</p>}
    </div>
  );
}
