import { useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TelaInicial } from './components/layout/TelaInicial';
import { entradaSolicitada, solicitarEntrada } from './lib/acessoInicial';
import { modoPiloto } from './config/config';
import { ToastProvider } from './state/ToastContext';
import { PortalProvider } from './state/PortalContext';
import { PapelProvider } from './state/PapelContext';
import { Cabecalho } from './components/layout/Cabecalho';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProjetoPage } from './pages/ProjetoPage';
import { NovoProjetoPage } from './pages/NovoProjetoPage';
import { EditarProjetoPage } from './pages/EditarProjetoPage';
import { AtualizacaoPage } from './pages/AtualizacaoPage';
import { CronogramasPage } from './pages/CronogramasPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { WikiPage } from './pages/WikiPage';

/**
 * HashRouter (#/projeto/...) para funcionar em qualquer hospedagem estática
 * sem regra de reescrita no servidor.
 */
export default function App() {
  const [acesso, setAcesso] = useState(entradaSolicitada);

  if (!acesso) return (
    <TelaInicial piloto={modoPiloto} aoEntrar={() => { solicitarEntrada(); setAcesso(true); }} />
  );

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
            <Route path="/atualizar" element={<AtualizacaoPage />} />
            <Route path="/cronogramas" element={<CronogramasPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </PortalProvider>
      </PapelProvider>
    </ToastProvider>
  );
}
