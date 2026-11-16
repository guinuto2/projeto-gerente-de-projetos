# Central Systech — Patrocinador Geral e Patrocinador VMware

## O que foi alterado no portal

- O perfil único `Patrocinador` foi substituído por dois perfis **explícitos**:
  - **Patrocinador Geral**: consulta projetos de qualquer Tipo, exceto rascunhos, e aprova gates G2–G4.
  - **Patrocinador VMware**: consulta/aprova somente projetos cujo campo **Tipo** seja exatamente `VMware` ou `Omnissa` (ignorando maiúsculas/minúsculas).
- O portfólio, as páginas abertas por URL, os cronogramas, os indicadores, o histórico, a visualização dos dados e o sino respeitam o perfil selecionado.
- O envio de comunicados internos, status reports, pedidos de aprovação e notificações de novos projetos identifica patrocinadores conforme o Tipo do projeto.
- Os perfis PMO, Técnico e Cliente não são alterados.
- **A antiga role `Patrocinador` não é mais aceita.** É intencional: convertê-la automaticamente em `Patrocinador Geral` seria conceder acesso amplo sem validação.

## 1 — Configurar as App Roles no Microsoft Entra ID

1. Abra https://entra.microsoft.com.
2. Entre em **Entra ID > App registrations > (registro da Central Systech / Portal PMO) > App roles**.
3. Clique em **Create app role** para cada perfil:

| Campo | Patrocinador Geral | Patrocinador VMware |
|---|---|---|
| Display name | Patrocinador Geral | Patrocinador VMware |
| Allowed member types | Users/Groups | Users/Groups |
| Value (EXATO, sem espaços) | `PatrocinadorGeral` | `PatrocinadorVMware` |
| Description | Visualiza e aprova todos os projetos | Visualiza e aprova apenas VMware e Omnissa |
| Enable this app role | Sim | Sim |

**Atenção:** não altere Client ID, Tenant ID, escopos MSAL ou Redirect URIs. Essas duas roles são declaradas no registro de aplicativo que já faz o login dos usuários; não são contas ou aplicativos novos.

## 2 — Atribuir os patrocinadores

1. Entre em **Entra ID > Enterprise applications > (aplicativo empresarial correspondente ao mesmo registro) > Users and groups**.
2. Clique em **Add user/group**.
3. Selecione a pessoa e a App Role desejada.
4. Salve a atribuição e repita para cada patrocinador.
5. Para pessoas que já tinham a função antiga `Patrocinador`, **atribua a nova role antes de retirar a antiga**. Depois de confirmar o funcionamento, retire a atribuição antiga e desabilite a role legada se não tiver mais uso.
6. Saia e entre novamente no portal para o Microsoft Entra emitir um ID Token com o novo `roles` claim.

Se a conta possuir **PMO** além de Patrocinador VMware, ela poderá trocar para o perfil PMO e visualizar todos os projetos. Para restringir a pessoa a VMware/Omnissa, **não atribua também PMO ou Patrocinador Geral**.

## 3 — Para receber os e-mails e notificações: Portal Tecnicos

**Essa etapa é indispensável para os destinatários automáticos.** As App Roles servem para identificar o usuário conectado. O portal **não enumera pelo Entra ID** todos os usuários atribuídos a uma App Role para decidir quem recebe os e-mails. Para essa finalidade, ele utiliza a lista existente **Portal Tecnicos** do SharePoint.

Confirme um registro **ativo** para cada patrocinador com o e-mail e uma coluna **Funcao** como:

- `Patrocinador VMware`
- `Patrocinador Geral`
- Se uma pessoa possuir ambos: `Patrocinador Geral;Patrocinador VMware`

Não utilize apenas `Patrocinador` na coluna Funcao: ela não tem escopo conhecido e não será considerada para os envios automáticos. A equipe do projeto por si só também **não concede permissão para receber** notificações fora do escopo.

O e-mail genérico `emailPatrocinador` do arquivo `config.js` deixa de ser usado como fallback no envio de avisos ao patrocinador; não é possível saber se o endereço tem permissão Geral ou VMware. A configuração `emailPmo` continua disponível ao PMO.


### Se as novas funções ainda não aparecem no SharePoint

**A criação das App Roles no Entra ID não modifica as opções da coluna SharePoint.**
No site `TesteProjetos`, abra **Portal Tecnicos** → seta do cabeçalho **Função** → **Configurações da coluna** → **Editar**. Na lista de escolhas, **acrescente** `Patrocinador Geral` e `Patrocinador VMware` (uma por linha) e salve. Não exclua as opções existentes. Em seguida, edite o registro de cada pessoa, escolha a função adequada e confirme **Ativo = Sim**.

O script `provisionamento/provisionar-portal.ps1` também declara essas opções para provisionamentos futuros; **atualizar o ZIP ou as App Roles não executa o script no SharePoint**. Não execute todo o script apenas para mudar as escolhas de uma coluna, pois ele trata várias outras listas. Se alguém acumulou funções, a coluna permite preenchimento livre, por exemplo `PMO;Patrocinador Geral`.

O valor antigo `Patrocinador` foi mantido como opção legada para não invalidar registros já existentes, mas **não é interpretado como Geral nem VMware** para envios. Atualize esses registros explicitamente.

## 4 — Verificações recomendadas

- Entre com uma conta que tenha **somente** `PatrocinadorVMware`:
  - VMware e Omnissa aparecem no portfólio e em Cronogramas.
  - Servidores, Rede, Storage, Client e Backup não aparecem, nem quando o endereço é digitado diretamente.
  - Aprovações são oferecidas somente nos projetos VMware/Omnissa.
  - Avisos de projetos de outras categorias não aparecem no sino.
- Entre com uma conta que tenha **somente** `PatrocinadorGeral`: todos os projetos elegíveis aparecem.
- Como PMO, crie dois projetos de categorias diferentes e verifique os destinatários dos avisos e pedidos de gates.

## 5 — Limitação de segurança importante (SharePoint)

Essas alterações **não constituem autorização no lado do servidor**. A Central Systech é um aplicativo React que, no modo conectado, continua lendo o Microsoft Graph com as permissões **delegadas** da identidade conectada. O portal restringe o conteúdo exposto na interface e nas operações do seu estado, mas isso **não revoga** eventuais permissões diretas da conta sobre as listas `Portal Projetos`, `Portal Atividades` e outras no SharePoint.

Se o Patrocinador VMware tiver `Sites.ReadWrite.All` com acesso a todas essas listas no site, ele ainda poderá acessar dados por outras ferramentas ou diretamente pelo Graph. Para garantir **isolamento de dados**, será necessário reduzir essas permissões no SharePoint, separar recursos com ACLs apropriadas, ou utilizar uma API/backend que valide a App Role e o tipo do projeto antes de retornar dados. Não modifiquei a autenticação nem a configuração de consentimento da API nesta entrega.

Referência Microsoft: https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps

**Ambiente de produção:** mantenha `emailSomentePara` vazio em `public/config.js` para não redirecionar indiscriminadamente e-mails de projetos diferentes a uma única pessoa (esse campo existe apenas para testes de envio).
