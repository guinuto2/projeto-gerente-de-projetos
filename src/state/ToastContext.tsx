import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Mostrar = (texto: string) => void;
const ToastContext = createContext<Mostrar>(() => { /* sem provedor */ });

/** Aviso curto no rodapé da tela (some sozinho). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<{ id: number; texto: string }[]>([]);
  const mostrar = useCallback<Mostrar>(texto => {
    const id = Date.now() + Math.random();
    setAvisos(a => [...a, { id, texto }]);
    setTimeout(() => setAvisos(a => a.filter(x => x.id !== id)), 3800);
  }, []);
  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      {avisos.slice(-1).map(a => <div key={a.id} className="toast" role="status">{a.texto}</div>)}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
