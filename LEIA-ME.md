# Portal do Escritório de Projetos — v3.35 (React)

**v3.35 — página "Cronogramas"**
- Novo item de menu **Cronogramas** (ao lado de Novo projeto): o cronograma de todos os projetos em andamento, um bloco por
  projeto no mesmo molde do cronograma do projeto (fases, barras, baseline, marcos, hoje, janela de datas na barra).
- Todos os blocos usam a mesma escala de datas (semanas alinhadas). Filtros: projeto (todos ou um) e fase, com a contagem
  de atividades de cada fase no projeto filtrado. Clicar numa atividade abre o projeto.
- Cabeçalho compactado: fica numa linha só de 1280 px para cima.


**v3.34**
- Ciclo de vida: Iniciação ─G1─ Planejamento ─G2─ Execução ─G3─ [ Monitoramento ∥ Encerramento ] ─G4.
  O G3 fecha só a Execução; o G4 fecha Monitoramento e Encerramento. No modelo Systech, o monitoramento acompanha o encerramento.
- **Patrocinador** só aprova (gates e cadastros) e visualiza: não cria, não edita, não exclui, não atualiza atividades.
  A exclusão de projetos passou para o **PMO**.
- **Rascunhos** visíveis só para o PMO.
- **Reunião remarcada no Outlook** (o organizador aceitou outro horário): o portal lê o horário atual ao abrir e a cada
  releitura e grava a nova data no cronograma; atividade de um dia só, no dia da reunião, acompanha a nova data.


**v3.33 — atualização semanal (como no protótipo)**
- Menu **Atualizar status** (todos os perfis): à esquerda, as atividades abertas da semana e as atrasadas dos projetos em
  que a pessoa está, com o filtro "Só as minhas" / "Toda a equipe"; à direita, o formulário: status, % concluído, nova data
  prevista, data real, depende de RDM e nº, impedimento, causa do atraso, horas realizadas e próximo passo.
- Atividade ganhou **Responsável** (escolhido na equipe do projeto) — é ele que define "minhas atividades".
- Nova data prevista depois da baseline exige a causa do atraso e avisa o gerente do projeto por e-mail
  (`emailAoReprogramar`). A baseline não é editável na atualização.
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar as colunas novas em Portal Atividades.


**v3.32**
- Subatividades: ao incluir, a atividade principal abre sozinha no cronograma (antes ficava fechada e parecia que não
  tinha entrado); o código é sugerido na sequência (3.2 → 3.2.1) e a fase vem da principal.
- Técnico: vê **todos os projetos encerrados** (consulta), além dos projetos em andamento em que está na equipe;
  não vê os quadros de indicadores nem as abas Escopo e premissas, Riscos e Pendências.
- Indicadores do projeto aparecem só para o PMO.
- Modal de exclusão sem a frase sobre o e-mail (o aviso continua sendo enviado).


**v3.31:** a janela com as datas abre só ao passar o mouse sobre a barra de duração (ou o losango do marco) no cronograma;
as cinco fases do ciclo de vida ficam alinhadas e com a mesma altura.


**v3.30**
- Cronograma: ao passar o mouse sobre uma atividade, uma janela mostra início e término (com o dia da semana),
  duração em dias úteis, baseline (se mudou) e situação.
- Ciclo de vida sem a frase de instrução.
- Patrocinador devolve o cadastro (G1) → o projeto sai de "Em aprovação", o aviso "Analisar cadastro" some e ele volta
  para **Rascunhos** do PMO, mostrando o motivo da devolução.


**v3.29:** a planilha do cronograma não cita mais o Portal PMO (linha 2: cliente · gerente · data).

**v3.28 — exportação do cronograma**
- Botão **"⤓ Exportar cronograma"** à direita da linha das abas do projeto (sai das abas de riscos e pendências).
- Exporta **planilha do Excel (.xlsx) formatada**: só código, atividade, início previsto e término previsto; título com
  projeto, cliente e gerente; cabeçalho vinho com filtro e fixo ao rolar; atividades agrupadas por fase e em ordem de
  data; linhas zebradas; datas reais (dd/mm/aaaa). Gerada pelo próprio portal, sem biblioteca extra.
  (CSV não guarda formatação, por isso o formato passou a ser .xlsx.)


**v3.27**
- **"+ Novo risco"** e **"+ Nova pendência"** nas abas do projeto (PMO e patrocinador), com código sugerido na sequência
  (R-14, DA-A17…). Os painéis de risco e pendência também ganharam **Excluir**.
- **Exportar CSV** nas abas Cronograma (planejamento completo: datas previstas e de baseline, desvio, status, %, marcos,
  reuniões), Riscos e Pendências. Formato do Excel em português (";" e acentos corretos).
- **Pastas sem projeto:** o patrocinador vê no portfólio as pastas da biblioteca de projetos que já foram excluídos e pode
  mandá-las para a lixeira. Ao excluir um projeto, "excluir também a pasta" agora vem marcado.


**v3.26**
- **Rascunhos:** "Salvar rascunho" pede só código e nome. Rascunhos ficam na seção "Rascunhos" do portfólio (fora da lista
  e dos indicadores). No rascunho: Editar dados, Enviar para aprovação (PMO) ou Ativar projeto (patrocinador) e Excluir
  rascunho, com a lista do que ainda falta preencher.
- Cronograma e marcos: atividade nova, ou data alterada, não pode ser antes de hoje (datas antigas que não mudam
  continuam valendo, para atualizar status de atividades passadas). Reunião do Teams também não pode ser no passado.
- Equipe do projeto: um só botão "+ Adicionar pessoa" (a linha começa como Técnico; troque a função se for outra pessoa).
- Realce ao passar o mouse em todos os botões e itens clicáveis.
- "Hoje" é a data do computador no modo conectado (muda sozinha todo dia); no piloto é fixa em 30/09/2026.


**v3.25**
- Função da equipe só com opções fixas: Técnico, Gerente de projeto, Arquiteto, Responsável do cliente,
  Responsável do fornecedor e Patrocinador.
- Projetos novos não aceitam início nem atividades antes de hoje (campos de data com mínimo e aviso).
- Gates: clicar na fase só filtra o cronograma; a aprovação aparece ao clicar no losango ou quando o PMO pede
  (aviso no topo do projeto com "Analisar pedido").
- E-mail de projeto excluído para a equipe (técnicos, gerente, arquiteto, cliente) e o patrocinador
  (`emailAoExcluirProjeto` no config.js).


**v3.24 — tabela de técnicos da Systech**
- Nova lista **Portal Tecnicos** (Nome, E-mail, Função, Ativo), criada e populada pelo script com Guilherme Santos,
  Felipe Cunha, Mario Junior e Leonardo Costa. Para incluir, alterar ou desativar técnicos, edite a lista no SharePoint.
- Na equipe do projeto, quem tem a função **Técnico** é escolhido nessa tabela (nome, e-mail e empresa preenchidos
  sozinhos; o mesmo técnico não aparece duas vezes). Botões "+ Adicionar técnico Systech" e "+ Adicionar outra pessoa".
- O campo **Arquiteto** e o **Gerente de projeto** também usam a tabela para trazer o e-mail.


**v3.23 — tipos de reunião e aviso de alteração**
- Tipos: **Implementação** (2 h), **Alinhamento** (1 h), **Interna** (30 min, só a equipe Systech marcada) e **Execução** (1 h).
  O tipo entra no título, fica gravado na atividade (coluna ReuniaoTipo) e aparece no selo do cronograma.
- Ao alterar a reunião, os convidados recebem um e-mail do portal com o resumo "antes → agora" (tipo, data, horário,
  duração, quem entrou e quem saiu) e o botão para entrar no Teams. Desliga com `emailAoAlterarReuniao: false`.
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar a coluna ReuniaoTipo.


**v3.22 — gerenciar a reunião pelo portal**
- No painel da atividade com reunião: **Entrar no Teams**, **Editar reunião** (título, data, horário, duração, pauta e
  participantes; o Outlook manda a atualização) e **Cancelar reunião** (com mensagem opcional aos convidados).
- Ao excluir uma atividade com reunião, a confirmação oferece cancelar a reunião junto.
- O portal confere se a lista Portal Atividades tem as colunas da reunião; sem elas, o agendamento fica bloqueado com
  a instrução de rodar o script (antes, a reunião era criada mas o link não ficava gravado).
- Só o organizador (quem criou) consegue editar ou cancelar pelo portal.


**v3.21:** `reuniaoSomentePara` no config.js: em teste, os convites de reunião do Teams vão só para esse endereço (os e-mails do portal seguem `emailSomentePara`).

**v3.20:** o organizador da reunião nunca entra como convidado (o Outlook não manda convite para ele). O painel e o aviso final dizem claramente quem recebeu convite; em modo de teste com o próprio e-mail, avisa que nenhum convite será enviado e que a reunião vai direto para a agenda.

**v3.19 — reunião do Teams nas atividades**
- Ao incluir ou editar uma atividade (PMO e Patrocinador), opção "Agendar reunião no Teams": título, data, início,
  duração, pauta, participantes da equipe já marcados (desmarque quem não quer chamar) e outros convidados.
- O evento é criado no calendário de quem está logado (organizador) com link do Teams, e o Outlook envia os convites.
- O link fica gravado na atividade e aparece no cronograma ("Teams 06/10 14:30"), abrindo direto a reunião.
- Modo de teste: com `emailSomentePara` preenchido, o convite vai só para esse endereço.

Configuração (uma vez): Entra ID → Portal PMO → Permissões de API → Microsoft Graph → Delegadas →
**Calendars.ReadWrite** → Conceder consentimento do administrador. Depois rode `provisionar-portal.ps1`
(sem `-Piloto`) para criar as colunas ReuniaoTeams, ReuniaoInicio e ReuniaoId em Portal Atividades.


**v3.18 — perfis:** o perfil GP foi unido ao PMO, e o antigo PMO (aprovador) passou a se chamar Patrocinador.
- **Patrocinador** (sigla PAT): aprova ou devolve gates e projetos, cria projetos já aprovados, exclui projetos.
- **PMO**: cadastra e edita projetos, cronograma e riscos; envia projetos e solicita gates para o patrocinador.
- **Técnico** (sigla TO): sem mudança.
- config.js: `emailPmo` virou `emailPatrocinador` (o nome antigo ainda funciona).


**v3.17**
- Botão dos e-mails "à prova de Outlook": VML no Outlook do Windows e link estilizado nos demais (web, novo Outlook, celular).
- Ciclo de vida: fases concluídas em tom verde.
- E-mail para **GP e PMO** quando o PMO aprova um gate ou um projeto (G1), e quando o PMO cria um projeto (já aprovado).
  O e-mail do GP vem da equipe do projeto (pessoa com função "Gerente de projeto" ou com o mesmo nome do GP).
- config.js: `emailAoAprovar`; `emailTeste` foi substituído por `emailSomentePara` (teste: manda tudo para um endereço só).


**v3.16**
- Seção **Projetos encerrados** no portfólio (projetos com G4 aprovado). Eles saem da lista principal, dos indicadores,
  dos próximos marcos e de "em andamento".
- **E-mail ao PMO** quando o GP envia um projeto para aprovação ou solicita a aprovação de um gate
  (`emailPmo` e `emailAoSolicitarAprovacao` no config.js; aceita vários endereços separados por vírgula).
- E-mails no padrão do Outlook: texto e tabelas simples, sem largura fixa (bom no celular), com botão para o portal.


**v3.15:** painel lateral com Cancelar à esquerda e as ações (Devolver ao GP, Aprovar) juntas à direita, sem vazar do painel; tipo de projeto "Outros" removido.

**v3.14**
- IDs das tabelas (pendências, decisões, riscos) não quebram mais e aparecem em ordem numérica.
- Tipos de projeto: **VMware**, **Omnissa**, **Client**, Storage, Servidores, Backup, Rede, Outros ("VMware / EUC" vira "VMware").
- Patrocinador removido das telas.
- Arquiteto escolhido numa lista de técnicos cadastrados (`src/lib/pessoas.ts`; por enquanto só "Arquiteto Teste").
- Modelo **padrão Systech** no cadastro (cronograma em 5 fases com EAP 1.x–5.x e 8 riscos padrão) no lugar do TRF1.
- PMO cria projetos e aprova gates direto, com janela de confirmação: projeto criado pelo PMO entra ativo, com G1
  aprovado e na fase de Planejamento. O GP continua enviando para aprovação.
- Script: atualiza as opções da coluna Tipo e troca "VMware / EUC" por "VMware" nos projetos gravados.


**v3.13:** atividades concluídas em verde no cronograma; indicadores do projeto (avanço, SPI, desvio, riscos, próximo marco) ocultos no perfil PMO e mantidos para GP e Técnico; removida a legenda do ciclo de vida.

**v3.12:** e-mails podem sair de uma **caixa compartilhada** (ex.: pmo@systechtecnologia.com.br) em vez da conta logada.

### Enviar de uma caixa compartilhada
1. Exchange admin center (admin.exchange.microsoft.com) → Destinatários → Caixas de correio → **Adicionar uma caixa de
   correio compartilhada** → nome "PMO Systech", e-mail pmo@systechtecnologia.com.br. (Caixa compartilhada não usa licença.)
2. Abra a caixa → **Delegação** → **Enviar como** → Editar → adicione quem usa o portal (ou um grupo de segurança habilitado para e-mail).
   Pode levar até 1 hora para valer.
3. Entra ID → Registros de aplicativo → Portal PMO → Permissões de API → Microsoft Graph → Delegadas →
   **Mail.Send.Shared** → Conceder consentimento do administrador.
4. `config.js`: `emailRemetente: 'pmo@systechtecnologia.com.br'`.
Com `emailRemetente: ''` o envio volta a sair pela conta logada.


**v3.11:** e-mail de cadastro reformatado (título, cliente, GP, período, equipe completa e botão de acesso), destinatário fixo em `config.js` (`emailTeste`) e endereço do portal nos links (`urlPortal`).

**v3.10:** a sigla do cabeçalho acompanha o perfil: PMO, GP (gerente) ou TO (técnico); o título da aba do navegador também.

**v3.9:** botão **Excluir projeto** (perfil PMO) com confirmação forte: mostra o que será apagado e exige digitar o
código do projeto. Apaga, nesta ordem, os gates, atividades, riscos, pendências e decisões vinculados e depois o
projeto; opcionalmente a pasta de documentos (vai para a lixeira do site). Cada projeto cadastrado nasce com os 4 gates
(G1–G4) vinculados pela coluna Projeto.

### Recriar a lista Portal Gates do zero
1. No SharePoint, exclua a lista **Portal Gates** (Conteúdo do site → ⋯ → Excluir).
2. Rode `provisionamento\provisionar-portal.ps1` (sem `-Piloto`): ele recria a lista, as colunas e a visão
   "Por projeto" e cria **4 gates para cada projeto existente**, com a situação coerente com a fase de cada um.
3. Enquanto a lista não existir, o portal mostra "A lista Portal Gates não existe no site".

**v3.8:** gates repetidos podem ser removidos pelo próprio portal (aviso + botão "Remover repetidos" na página do
projeto, perfis PMO e GP). Novo script `provisionamento/limpar-gates-duplicados.ps1`: mostra uma tabela com todos os
gates (ID, projeto, gate, fase, situação) e, com `-Remover`, apaga os repetidos. Agrupamento corrigido: código do gate
vazio passa a ser deduzido pela fase.

**v3.7:** gates nunca são criados em dobro (fila única por sessão, inclusive no `npm run dev`); se a lista já tiver
gates repetidos, o portal usa um só (o mais avançado). O script aponta os repetidos, remove com
`-LimparGatesDuplicados` e cria a visão **"Por projeto"** em Portal Gates.

**v3.6:** todo projeto passa a ter os gates G1–G4 na lista Portal Gates — o portal cria os que faltarem ao carregar
(inclusive para projetos cadastrados direto no SharePoint) e o script `provisionar-portal.ps1` também cria os faltantes.
A situação inicial segue a fase atual do projeto (fases anteriores = Aprovado). Removida a faixa de título do portfólio.

**v3.5:** o cabeçalho mostra só o perfil (PMO, GP, Técnico); o Técnico é sempre a conta logada.

**Da v3.4**
- Identidade visual da Systech (systechtecnologia.com.br): preto/grafite, vinho #7E181C e fonte Montserrat.
  Cores da marca centralizadas em `src/lib/tema.ts` e nas variáveis do topo de `styles/global.css`.
- Perfil **Técnico vê só os projetos em que está na equipe** (comparando nome ou e-mail da conta logada com a equipe).
- Equipe do projeto editável no cadastro (etapa 1) e em "Editar projeto" (nome, função, empresa, e-mail).
- Ciclo de vida sem o retângulo tracejado entre Execução e Monitoramento.

**Da v3.3**
- Ciclo de vida: Execução e Monitoramento formam um bloco em paralelo; o **G3** fica depois do bloco e libera o
  Encerramento; o **G4** encerra o projeto. O painel do G3 considera as atividades das duas fases.
- **Perfis de teste** (PMO, GP, Técnico) no cabeçalho — ver tabela abaixo.
- **E-mail de teste** ao cadastrar um projeto, enviado pela própria conta (Microsoft Graph, Mail.Send).

### Perfis de teste

| Ação | PMO | GP | Técnico |
|---|---|---|---|
| Cadastrar e editar projeto | ✔ | ✔ | — |
| Incluir, excluir e replanejar atividades | ✔ | ✔ | — |
| Atualizar status, % e observação | ✔ | ✔ | ✔ |
| Editar riscos e responder pendências | ✔ | ✔ | — |
| Enviar documentos | ✔ | ✔ | ✔ |
| Solicitar aprovação de gate | ✔ | ✔ | — |
| Aprovar ou devolver gate | ✔ | — | — |

Os perfis valem só para a tela (teste). A segurança real continua sendo a permissão de cada pessoa no site do SharePoint.

### E-mail de teste — liberar a permissão Mail.Send (uma vez)

Entra ID → Registros de aplicativo → **Portal PMO** → Permissões de API → Adicionar uma permissão → Microsoft Graph →
Permissões delegadas → **Mail.Send** → Adicionar → **Conceder consentimento do administrador**.
Sem isso, o portal tenta pedir o consentimento numa janela pop-up; se ela for bloqueada, o projeto é salvo e aparece um aviso.
Em `config.js`: `emailAoCriarProjeto: false` desliga o envio; `emailTeste: 'alguem@empresa.com'` muda o destinatário.


**Da v3.2**
- Losangos dos gates voltam a aparecer (o código G1–G4 é deduzido pela fase quando a lista não tem a coluna).
- Gates com fluxo de aprovação: o GP solicita, o PMO aprova ou devolve com parecer. Aprovar avança a fase do projeto;
  o G2 pode congelar a linha de base; o G4 encerra o projeto. Gates são aprovados em ordem.
- Editar projeto (dados gerais, farol e escopo) pelo botão "Editar projeto".
- Incluir, editar e excluir atividades e subatividades pelo cronograma ("+ Nova atividade").
- Script de listas corrigido: rode de novo **sem** `-Piloto` para criar a coluna Gate, as colunas de aprovação
  (AprovadoPor, DataAprovacao, Parecer) e reparar os gates existentes. Nada é apagado.


Mesmo portal da v2, reescrito em **React 19 + TypeScript + Vite**, em arquitetura de componentes.
Sem Next.js e sem NestJS: é um aplicativo de página única (SPA) que roda direto no navegador.
O **SharePoint continua sendo o banco de dados** (listas) e o **repositório de documentos** (biblioteca),
acessados pelo Microsoft Graph com o login Microsoft 365 de cada pessoa (MSAL).

Nada muda no SharePoint nem no Entra ID: as mesmas listas, o mesmo app Portal PMO e o mesmo `config.js`.

## Usar sem instalar nada (versão pronta)

A pasta `dist/` já vem compilada:

```powershell
cd dist
python -m http.server 8080
```

Abra http://localhost:8080/. A configuração fica em `dist/config.js`.

## Desenvolver

Requisito: **Node.js 22 LTS** (https://nodejs.org).

```powershell
npm install        # uma vez
npm run dev        # http://localhost:8080 com recarga automática ao salvar arquivos
npm run build      # gera a pasta dist/ para publicar
```

A configuração de desenvolvimento fica em `public/config.js` (vai para `dist/config.js` no build).
Alterar `config.js` não exige novo build.

## Configuração (`config.js`)

```js
window.PORTAL_CONFIG = {
  tenantId: 'gruposystech.onmicrosoft.com',
  clientId: 'ID do app Portal PMO',          // vazio = modo piloto
  sharepointHost: 'gruposystech.sharepoint.com',
  sitePath: '/sites/TesteProjetos',
  biblioteca: 'Documentos de Projetos',
  sincronizarSegundos: 60                    // releitura automática do SharePoint
};
```

No Entra ID, o app **Portal PMO** precisa ter como URI de redirecionamento (plataforma SPA) o endereço exato
onde o portal abre: `http://localhost:8080/` para testes e a URL definitiva quando publicar.

## Publicar

Envie o conteúdo de `dist/` para qualquer hospedagem estática (Azure Static Web Apps, IIS, servidor interno).
O portal usa rotas com `#` (ex.: `#/projeto/TRF1-VCF`), então não precisa de regra de reescrita no servidor.

## Estrutura do código

```
src/
  main.tsx, App.tsx              ponto de entrada e rotas (Portfólio, Projeto, Novo projeto)
  config/config.ts               lê window.PORTAL_CONFIG; sem clientId = piloto
  types/models.ts                tipos: Projeto, Atividade, Risco, Pendencia, Gate, Decisao…
  lib/
    datas.ts                     datas ISO, dias úteis e feriados
    calculos.ts                  avanço, SPI, desvio, fase atual, próximos marcos
    constantes.ts                fases, pastas, cores dos selos
  services/
    FonteDados.ts                contrato único de leitura/gravação
    FonteSharePoint.ts           implementação via Microsoft Graph (listas + biblioteca)
    FontePiloto.ts               implementação local com os dados do TRF1
    auth.ts                      login MSAL (PKCE)
    graph.ts                     cliente HTTP do Graph (paginação, upload em blocos)
    criarFonte.ts                escolhe a fonte; MSAL só é baixado no modo SharePoint
  state/
    PortalContext.tsx            estado global, ações (salvar, aprovar, criar) e releitura automática
    ToastContext.tsx             avisos na tela
  components/
    layout/                      Cabecalho, Hero
    ui/                          Drawer, Abas, Chips, Selo, Kpi, Losango, Mensagem, Vazio, Carregando
    portfolio/                   CardProjeto, TrilhaFases, IndicadoresPortfolio, ProximosMarcos, EmAndamento
    projeto/                     CabecalhoProjeto, IndicadoresProjeto, CicloVida
      abas/                      Gantt, AbaCronograma, AbaRiscos, MatrizRiscos, AbaPendencias, AbaEscopo, AbaDocumentos, AbaDecisoes
      editores/                  EditarAtividade, EditarRisco, EditarPendencia
    novo/                        formulario.ts (validação e montagem), PassoDadosGerais, PassoEscopo, PassoCronograma, PassoRiscos
  pages/                         PortfolioPage, ProjetoPage, NovoProjetoPage
  styles/global.css              tokens de cor e tipografia
provisionamento/                 script que cria as listas no SharePoint (igual à v2)
```

Regra de dependência: componentes falam só com `usePortal()`; só `services/` conhece o Graph.
Para trocar o SharePoint por outra base no futuro, basta outra implementação de `FonteDados`.
