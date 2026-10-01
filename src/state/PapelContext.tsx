import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { papelSalvo, pode as podeNoPapel, salvarPapel, type Acao, type Papel } from '../lib/permissoes';

interface PapelValor {
  papel: Papel;
  trocar: (p: Papel) => void;
  pode: (a: Acao) => boolean;
}
const PapelContext = createContext<PapelValor>({ papel: 'PMO', trocar: () => { /* */ }, pode: () => true });

/** Perfil de teste escolhido no cabeçalho (fica guardado no navegador). */
export function PapelProvider({ children }: { children: ReactNode }) {
  const [papel, setPapel] = useState<Papel>(papelSalvo);
  const trocar = useCallback((p: Papel) => { setPapel(p); salvarPapel(p); }, []);
  const pode = useCallback((a: Acao) => podeNoPapel(papel, a), [papel]);
  return <PapelContext.Provider value={{ papel, trocar, pode }}>{children}</PapelContext.Provider>;
}

export const usePapel = () => useContext(PapelContext);
