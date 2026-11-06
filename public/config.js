/* Configuração do Portal do Escritório de Projetos.
   Lida pelo navegador ao abrir o portal: alterar este arquivo não exige novo build. */
window.PORTAL_CONFIG = {
  tenantId: 'gruposystech.onmicrosoft.com',               // ou o "ID do diretório (locatário)" do Entra ID
  clientId: '4ca0be83-a18e-42c7-b2f9-c0bb4355f3b3',       // "ID do aplicativo (cliente)" do app Portal PMO
  sharepointHost: 'gruposystech.sharepoint.com',
  sitePath: '/sites/TesteProjetos',
  biblioteca: 'Documentos de Projetos',
  sincronizarSegundos: 120,                               // releitura automática do SharePoint (mínimo 30)
  dataSimulada: '',                                       // TESTE: finge que hoje é esta data, ex.: '2026-10-12' (vazio = data real)

  // ----- e-mails (permissão Mail.Send no app Portal PMO) -----
  emailRemetente: '',                                     // caixa compartilhada que envia, ex.: 'pmo@systechtecnologia.com.br' (vazio = conta logada)
  urlPortal: '',                                          // endereço do portal nos links (vazio = o endereço aberto agora)
  emailPatrocinador: 'guilherme.santos@systechtecnologia.com.br', // ÚLTIMO RECURSO: usado só se o projeto e a lista Portal Tecnicos não tiverem patrocinador com e-mail

  emailAoSolicitarAprovacao: true,   // PMO pede aprovação de projeto ou gate        → patrocinador
  emailAoAprovar: true,              // patrocinador aprova gate ou projeto          → gerente do projeto + patrocinador
  emailAoAlterarReuniao: true,       // reunião do Teams alterada                    → convidados (resumo antes → agora)
  emailAoExcluirProjeto: true,       // projeto excluído                             → equipe + gerente + patrocinador
  emailAoReprogramar: true,          // atualização semanal passa da baseline        → gerente do projeto
  emailAoMudarStatusSubatividade: true, // status de subatividade mudou              → PMO (gerente do projeto)
  emailAoAtrasar: true,              // atividade/subatividade ficou atrasada        → PMO (uma vez por atraso)
  emailAoLancarTarefa: true,         // PMO lançou tarefas                           → técnico responsável
  emailAoCriarProjeto: true,         // patrocinador cria projeto (já aprovado)      → gerente do projeto + patrocinador

  emailSomentePara: '',    // TESTE: preencha para mandar TODOS os e-mails do portal para um endereço só (vazio = cada e-mail vai para o papel certo)
  reuniaoSomentePara: ''   // TESTE: preencha para mandar os convites do Teams para um endereço só (vazio = participantes marcados)
};
