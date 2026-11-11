/** Controla apenas a tela de boas-vindas. O login e as permissões continuam com o MSAL/Entra ID. */
const CHAVE = 'central-systech-entrada-solicitada';

export function entradaSolicitada(): boolean {
  try {
    if (sessionStorage.getItem(CHAVE) === '1') return true;
  } catch { /* armazenamento indisponível */ }

  // Não interromper o processamento do retorno de autenticação, mesmo se o navegador limpar a sessão.
  const query = new URLSearchParams(window.location.search);
  return query.has('state') && (query.has('code') || query.has('error'));
}

export function solicitarEntrada(): void {
  try { sessionStorage.setItem(CHAVE, '1'); } catch { /* armazenamento indisponível */ }
}

export function encerrarEntrada(): void {
  try { sessionStorage.removeItem(CHAVE); } catch { /* armazenamento indisponível */ }
}
