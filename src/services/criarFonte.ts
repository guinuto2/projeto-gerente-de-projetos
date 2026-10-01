import { config, modoPiloto } from '../config/config';
import type { FonteDados } from './FonteDados';

let instancia: Promise<FonteDados> | null = null;

/**
 * Escolhe a fonte conforme config.js: sem clientId → piloto; com clientId → SharePoint.
 * Instância única por página: em desenvolvimento o React StrictMode executa os efeitos duas vezes,
 * e duas sessões MSAL simultâneas disputariam a resposta do login.
 * Import dinâmico: o modo SharePoint não baixa os dados do piloto e vice-versa.
 */
export function criarFonte(): Promise<FonteDados> {
  if (!instancia) instancia = montar();
  return instancia;
}

async function montar(): Promise<FonteDados> {
  if (modoPiloto) {
    const { FontePiloto } = await import('./FontePiloto');
    return new FontePiloto();
  }
  const [{ FonteSharePoint }, auth] = await Promise.all([import('./FonteSharePoint'), import('./auth')]);
  const autenticador = import.meta.env.VITE_AUTH_TESTE === '1' ? new auth.AutenticadorTeste() : new auth.AutenticadorMsal(config);
  return new FonteSharePoint(config, autenticador);
}
