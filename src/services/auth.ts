import { PublicClientApplication, type AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import type { PortalConfig } from '../config/config';

/** Escopos delegados: o portal age em nome de quem está logado. */
export const ESCOPOS = ['User.Read', 'Sites.ReadWrite.All'];

export interface Autenticador {
  entrar(): Promise<string>;
  token(): Promise<string>;
  /** token com escopos adicionais; pede consentimento numa janela pop-up se precisar */
  tokenPara(escopos: string[]): Promise<string>;
  /** e-mail (UPN) de quem entrou */
  email(): string;
  sair(): Promise<void>;
}

/** Login Microsoft 365 com MSAL (fluxo de código com PKCE, app do tipo SPA no Entra ID). */
export class AutenticadorMsal implements Autenticador {
  private pca: PublicClientApplication;
  private conta: AccountInfo | null = null;

  constructor(cfg: PortalConfig) {
    this.pca = new PublicClientApplication({
      auth: {
        clientId: cfg.clientId,
        authority: 'https://login.microsoftonline.com/' + (cfg.tenantId || 'organizations'),
        redirectUri: window.location.origin + window.location.pathname
      },
      cache: { cacheLocation: 'sessionStorage' }
    });
  }

  private sessao?: Promise<string>;

  /** Idempotente: chamadas repetidas (ex.: StrictMode em desenvolvimento) reaproveitam o mesmo login. */
  entrar(): Promise<string> {
    if (!this.sessao) this.sessao = this.iniciar();
    return this.sessao;
  }

  private async iniciar(): Promise<string> {
    await this.pca.initialize();
    let resposta;
    try {
      resposta = await this.pca.handleRedirectPromise();
    } catch (e) {
      throw new Error(explicarErroLogin(e as Error));
    }
    this.conta = resposta?.account || this.pca.getAllAccounts()[0] || null;
    if (!this.conta) {
      try {
        await this.pca.loginRedirect({ scopes: ESCOPOS });
      } catch (e) {
        throw new Error(explicarErroLogin(e as Error));
      }
      return new Promise<string>(() => { /* a página será redirecionada */ });
    }
    this.pca.setActiveAccount(this.conta);
    return this.conta.name || this.conta.username;
  }

  async token(): Promise<string> {
    if (!this.conta) throw new Error('Sessão não iniciada.');
    try {
      return (await this.pca.acquireTokenSilent({ scopes: ESCOPOS, account: this.conta })).accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        await this.pca.acquireTokenRedirect({ scopes: ESCOPOS, account: this.conta });
        return new Promise<string>(() => { /* redirecionando */ });
      }
      throw e;
    }
  }

  email() { return this.conta?.username || ''; }

  async tokenPara(escopos: string[]): Promise<string> {
    if (!this.conta) throw new Error('Sessão não iniciada.');
    try {
      return (await this.pca.acquireTokenSilent({ scopes: escopos, account: this.conta })).accessToken;
    } catch (e) {
      if (!(e instanceof InteractionRequiredAuthError)) throw e;
      try {
        return (await this.pca.acquireTokenPopup({ scopes: escopos, account: this.conta })).accessToken;
      } catch (p) {
        throw new Error(`Não foi possível obter a permissão ${escopos.join(', ')}. Adicione-a ao app Portal PMO no Entra ID e conceda o consentimento, ou libere pop-ups para este site. (${(p as Error).message})`);
      }
    }
  }

  async sair(): Promise<void> {
    await this.pca.logoutRedirect({ account: this.conta || undefined });
  }
}

/** Usado apenas em testes automatizados (VITE_AUTH_TESTE=1); não entra no build normal. */
export class AutenticadorTeste implements Autenticador {
  async entrar() { return 'Usuário de teste'; }
  async token() { return 'token-de-teste'; }
  async tokenPara() { return 'token-de-teste'; }
  email() { return 'teste@gruposystech.onmicrosoft.com'; }
  async sair() { /* nada */ }
}

/** Traduz os erros mais comuns do Entra ID para a ação que resolve. */
export function explicarErroLogin(e: Error): string {
  const m = e.message || String(e);
  const redirect = window.location.origin + window.location.pathname;
  if (/AADSTS50011/.test(m)) return `O endereço ${redirect} não está cadastrado no app Portal PMO. No Entra ID, em Autenticação › Aplicativo de página única, adicione exatamente esse endereço. (${m})`;
  if (/AADSTS9002326/.test(m)) return `O endereço foi cadastrado como "Web". No Entra ID, remova-o e cadastre em "Aplicativo de página única (SPA)". (${m})`;
  if (/AADSTS700016/.test(m)) return `O clientId do config.js não existe neste tenant. Confira o "ID do aplicativo (cliente)" do app Portal PMO. (${m})`;
  if (/AADSTS65001|consent/i.test(m)) return `Falta o consentimento do administrador nas permissões do app Portal PMO (User.Read e Sites.ReadWrite.All). (${m})`;
  if (/AADSTS90002|tenant/i.test(m)) return `O tenantId do config.js não foi encontrado. Use o "ID do diretório (locatário)" ou gruposystech.onmicrosoft.com. (${m})`;
  if (/interaction_in_progress/.test(m)) return 'Um login anterior ficou pela metade. Feche esta aba, abra uma nova e acesse o portal de novo.';
  return 'Falha no login Microsoft: ' + m;
}
