/* Configuração do Portal do Escritório de Projetos.
   Lida pelo navegador ao abrir o portal: alterar este arquivo não exige novo build. */
window.PORTAL_CONFIG = {
  tenantId: 'gruposystech.onmicrosoft.com',               // ou o "ID do diretório (locatário)" do Entra ID
  clientId: '4ca0be83-a18e-42c7-b2f9-c0bb4355f3b3',       // "ID do aplicativo (cliente)" do app Portal PMO
  sharepointHost: 'gruposystech.sharepoint.com',
  sitePath: '/sites/TesteProjetos',
  biblioteca: 'Documentos de Projetos',
  sincronizarSegundos: 60,                                // releitura automática do SharePoint

  // ----- e-mails (permissão Mail.Send no app Portal PMO) -----
  emailRemetente: '',                                     // caixa compartilhada que envia, ex.: 'pmo@systechtecnologia.com.br' (vazio = conta logada)
  urlPortal: '',                                          // endereço do portal nos links (vazio = o endereço aberto agora)
  emailPatrocinador: 'guilherme.santos@systechtecnologia.com.br', // patrocinador: um ou mais, separados por vírgula

  emailAoSolicitarAprovacao: true,   // PMO pede aprovação de projeto ou gate        → patrocinador
  emailAoAprovar: true,              // patrocinador aprova gate ou projeto          → gerente do projeto + patrocinador
  emailAoAlterarReuniao: true,       // reunião do Teams alterada                    → convidados (resumo antes → agora)
  emailAoExcluirProjeto: true,       // projeto excluído                             → equipe + gerente + patrocinador
  emailAoReprogramar: true,          // atualização semanal passa da baseline        → gerente do projeto
  emailAoCriarProjeto: true,         // patrocinador cria projeto (já aprovado)      → gerente do projeto + patrocinador

  emailSomentePara: 'guilherme.santos@systechtecnologia.com.br',  // TESTE: e-mails do portal vão só para este endereço (vazio = destinatários reais)
  reuniaoSomentePara: 'felipe.cunha@systechtecnologia.com.br'     // TESTE: convites de reunião do Teams vão só para este endereço (vazio = participantes marcados)
};
