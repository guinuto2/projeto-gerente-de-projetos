import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './state/ToastContext';
import { PortalProvider } from './state/PortalContext';
import { PapelProvider } from './state/PapelContext';
import { Cabecalho } from './components/layout/Cabecalho';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProjetoPage } from './pages/ProjetoPage';
import { NovoProjetoPage } from './pages/NovoProjetoPage';
import { EditarProjetoPage } from './pages/EditarProjetoPage';

/**
 * HashRouter (#/projeto/...) para funcionar em qualquer hospedagem estática
 * sem regra de reescrita no servidor.
 */
export default function App() {
  return (
    <ToastProvider>
      <PapelProvider>
      <PortalProvider>
        <HashRouter>
          <Cabecalho />
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/projeto/:codigo" element={<ProjetoPage />} />
            <Route path="/projeto/:codigo/:aba" element={<ProjetoPage />} />
            <Route path="/novo" element={<NovoProjetoPage />} />
            <Route path="/editar/:codigo" element={<EditarProjetoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </PortalProvider>
      </PapelProvider>
    </ToastProvider>
  );
}
