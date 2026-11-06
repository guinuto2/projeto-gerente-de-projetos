import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { PAPEIS, papelSalvo, pode as podeNoPapel, salvarPapel, type Acao, type Papel } from '../lib/permissoes';

interface PapelValor {
  papel: Papel;
  /** troca entre os perfis que a pessoa tem (mais de uma função no Entra ID, ou o piloto) */
  trocar: (p: Papel) => void;
  pode: (a: Acao) => boolean;
  /** perfis disponíveis para esta pessoa (o seletor só aparece com mais de um) */
  disponiveis: Papel[];
  /** true quando a pessoa entrou mas não tem nenhuma função do portal no Entra ID */
  semPerfil: boolean;
  /** definido pelo portal depois do login: perfis vindos do Entra ID (ou todos, no piloto) */
  definirDisponiveis: (lista: Papel[]) => void;
}
const PapelContext = createContext<PapelValor>({ papel: 'PMO', trocar: () => { /* */ }, pode: () => true, disponiveis: [], semPerfil: false, definirDisponiveis: () => { /* */ } });

/**
 * Perfil de quem está usando. No modo conectado, só os perfis das funções do Entra ID; a escolha entre eles
 * (quando houver mais de um) fica guardada no navegador.
 */
export function PapelProvider({ children }: { children: ReactNode }) {
  const [disponiveis, setDisponiveis] = useState<Papel[] | null>(null);
  const [escolhido, setEscolhido] = useState<Papel>(papelSalvo);
  const lista = disponiveis ?? PAPEIS;
  const papel: Papel = lista.includes(escolhido) ? escolhido : (lista[0] ?? 'Cliente');
  const trocar = useCallback((p: Papel) => { if (lista.includes(p)) { setEscolhido(p); salvarPapel(p); } }, [lista]);
  const pode = useCallback((a: Acao) => (disponiveis !== null && !disponiveis.length ? false : podeNoPapel(papel, a)), [papel, disponiveis]);
  const valor = useMemo<PapelValor>(() => ({
    papel, trocar, pode, disponiveis: lista, semPerfil: disponiveis !== null && !disponiveis.length,
    definirDisponiveis: (l: Papel[]) => setDisponiveis(PAPEIS.filter(p => l.includes(p)))
  }), [papel, trocar, pode, lista, disponiveis]);
  return <PapelContext.Provider value={valor}>{children}</PapelContext.Provider>;
}

export const usePapel = () => useContext(PapelContext);
