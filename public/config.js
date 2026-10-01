/* Configuração do Portal do Escritório de Projetos.
   Lida pelo navegador ao abrir o portal: alterar este arquivo não exige novo build. */
window.PORTAL_CONFIG = {
  tenantId: 'gruposystech.onmicrosoft.com',               // ou o "ID do diretório (locatário)" do Entra ID
  clientId: '4ca0be83-a18e-42c7-b2f9-c0bb4355f3b3',       // "ID do aplicativo (cliente)" do app Portal PMO
  sharepointHost: 'gruposystech.sharepoint.com',
  sitePath: '/sites/TesteProjetos',
  biblioteca: 'Documentos de Projetos',
  sincronizarSegundos: 60,                                // releitura automática do SharePoint

  // e-mail de teste ao cadastrar projeto (precisa da permissão Mail.Send no app Portal PMO)
  emailAoCriarProjeto: true,
  emailTeste: 'guilherme.santos@systechtecnologia.com.br', // destinatário; vazio = a conta logada
  urlPortal: '',                                          // endereço do portal nos links (vazio = o endereço aberto agora)
  emailRemetente: ''                                      // caixa compartilhada que envia, ex.: 'pmo@systechtecnologia.com.br' (vazio = conta logada)
};
