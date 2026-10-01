/** Configuração lida de public/config.js em tempo de execução. */
export interface PortalConfig {
  tenantId: string;
  clientId: string;
  sharepointHost: string;
  sitePath: string;
  biblioteca: string;
  /** intervalo da releitura automática do SharePoint */
  sincronizarSegundos: number;
  /** teste: envia e-mail ao criar projeto */
  emailAoCriarProjeto: boolean;
  /** destinatário do e-mail de teste; vazio = a própria conta logada */
  emailTeste: string;
  /** endereço do portal usado nos links dos e-mails; vazio = o endereço aberto no navegador */
  urlPortal: string;
  /** caixa compartilhada que envia os e-mails (ex.: pmo@empresa.com.br); vazio = a conta logada */
  emailRemetente: string;
}

declare global {
  interface Window { PORTAL_CONFIG?: Partial<PortalConfig> }
}

export const config: PortalConfig = {
  tenantId: '',
  clientId: '',
  sharepointHost: '',
  sitePath: '/sites/TesteProjetos',
  biblioteca: 'Documentos de Projetos',
  sincronizarSegundos: 60,
  emailAoCriarProjeto: true,
  emailTeste: '',
  urlPortal: '',
  emailRemetente: '',
  ...(window.PORTAL_CONFIG || {})
};

/** Sem clientId o portal roda no modo piloto, com os dados do TRF1 embutidos. */
export const modoPiloto = !config.clientId;
