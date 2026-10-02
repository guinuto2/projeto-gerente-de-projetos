/** Configuração lida de public/config.js em tempo de execução. */
export interface PortalConfig {
  tenantId: string;
  clientId: string;
  sharepointHost: string;
  sitePath: string;
  biblioteca: string;
  /** intervalo da releitura automática do SharePoint */
  sincronizarSegundos: number;
  /** envia e-mail quando o PMO cria um projeto */
  emailAoCriarProjeto: boolean;
  /** TESTE: se preenchido, todos os e-mails vão só para este endereço (em vez de GP/PMO) */
  emailSomentePara: string;
  /** avisa GP e PMO quando um gate ou projeto é aprovado */
  emailAoAprovar: boolean;
  /** endereço do portal usado nos links dos e-mails; vazio = o endereço aberto no navegador */
  urlPortal: string;
  /** caixa compartilhada que envia os e-mails (ex.: pmo@empresa.com.br); vazio = a conta logada */
  emailRemetente: string;
  /** patrocinador: recebe os pedidos de aprovação e as confirmações (um ou mais, separados por vírgula) */
  emailPatrocinador: string;
  /** nome antigo de emailPatrocinador (mantido para config.js antigos) */
  emailPmo: string;
  /** avisa o PMO quando o GP pede aprovação de projeto ou gate */
  emailAoSolicitarAprovacao: boolean;
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
  emailSomentePara: '',
  emailAoAprovar: true,
  urlPortal: '',
  emailRemetente: '',
  emailPatrocinador: '',
  emailPmo: '',
  emailAoSolicitarAprovacao: true,
  ...(window.PORTAL_CONFIG || {})
};

/** Sem clientId o portal roda no modo piloto, com os dados do TRF1 embutidos. */
export const modoPiloto = !config.clientId;
