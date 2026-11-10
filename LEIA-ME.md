# Central Systech — v4.7 (React)

**v4.7:** Wiki — wiki.ts da equipe: SPEC RATE 2017 nos servidores Dell, Lenovo, HPE e xFusion; Omnissa reorganizada (Portais Omnissa, Suporte e ferramentas, Certificações e treinamentos); Processadores sem links.

**v4.6:** Wiki — HPE ganha o grupo "SPEC RATE 2017" (DL325); Processadores ganha o grupo "SPEC CPU 2017" (SPECrate e SPECspeed 2017 Integer e busca de resultados).

**v4.5**
- Notificações: sino no cabeçalho com os avisos de cada pessoa (tarefa lançada, gate e cadastro para aprovar, atrasos,
  reprogramação, status de tarefa, gate aprovado, projeto criado). Lista "Portal Notificacoes".
- Modelos de projeto: "Salvar como modelo" no cronograma (atividades e tarefas com datas relativas, horas, marcos e
  pré-requisitos); no cadastro, "Modelo de cronograma" (os do mesmo tipo primeiro) + "Aplicar modelo"; as tarefas do modelo
  nascem em preparação. Lista "Portal Modelos"; o padrão Systech continua disponível.
- Status report: botão no cabeçalho do projeto (PMO e patrocinador) com prévia, versão interna × do cliente, imprimir/PDF e
  "Enviar agora"; envio automático semanal (config.js: statusReportAutomatico, statusReportDia). Coluna UltimoStatusReport.
- Dados por cliente: biblioteca "Portal Clientes" com uma pasta por órgão (domínio de e-mail) e permissão só para aquele órgão.
  O portal da equipe publica nela uma cópia só com o que o cliente pode ver; o cliente (e-mail de fora da Systech) lê só a pasta
  dele, sem acesso às listas. Liberar um órgão:
  .\provisionar-portal.ps1 -SiteUrl ... -ClientId ... -Cliente trf1.jus.br -UsuariosCliente "fiscal@trf1.jus.br,gestor@trf1.jus.br"
  e depois tirar as pessoas do cliente das permissões do site.
- Corrigido: criar uma tarefa já lançada para o técnico agora avisa o técnico (sino e e-mail).


**v4.4:** Wiki — a caixa de texto do documento já abre grande (quase a altura da tela, mínimo de 640 px; 60% da tela no celular).

**v4.3**
- Wiki: sai o item "Servidores"; "Comprovações para editais" ganha a aba "Arquivos" (documentos gerais, com pastas, editar e
  excluir) e aparece no "Onde guardar". No editor de documentos, a prévia sai da lateral: o texto ocupa a largura toda e o botão
  "Ver prévia" alterna entre editar e ver.
- Atrasos: o e-mail diário vai para o PMO (lista completa) e para cada técnico (só as tarefas dele); a mensagem na tela aparece
  só para o PMO; o painel "Atividades atrasadas" do portfólio some para o patrocinador e mostra ao técnico só as tarefas dele.


**v4.2:** Wiki — novos fabricantes HPE (Partner Portal, Certification and Learning, Support Center, SPP, QuickSpecs, ProLiant) e xFusion (site, servidores rack FusionServer, serviços, FusionServer Tools, suporte), com as abas Links e Comprovação para editais.

**v4.1:** Wiki — o "Excluir" da comprovação para editais fica dentro da janela "Editar" (documento ou pasta), e não mais nas linhas da tabela.

**v4.0:** Wiki — "Excluir" em cada documento e pasta da comprovação para editais (com confirmação; a pasta avisa quantos itens
vão junto; tudo vai para a lixeira do site no SharePoint). A área de comprovação passa a ter fundo neutro.


**v3.99:** Wiki — na aba "Comprovação para editais" do fabricante: pastas (criar com "+ Nova pasta", entrar e voltar pelo
caminho, até 4 níveis), "Editar" em cada linha para trocar o nome e a descrição do documento (a extensão é mantida) ou o nome
da pasta, envio direto para a pasta aberta e busca que acha os documentos dentro das pastas (abrindo na pasta certa).


**v3.98:** Wiki — cada fabricante tem as abas "Links" e "Comprovação para editais". Os documentos de comprovação são
adicionados pelo portal ("+ Adicionar documento" na aba, ou "+ Adicionar à Wiki" → Arquivo → Onde guardar) e ficam na
biblioteca Wiki Tecnicos, na pasta Comprovacoes/<fabricante> (criada na hora). A busca da Wiki encontra esses documentos pelo
nome, pela descrição e pelo fabricante, e abre o fabricante já na aba de comprovação.


**v3.97:** Wiki — Dell, VMware, Lenovo e Omnissa com os links informados pela equipe, agrupados em Portal do parceiro,
Certificações e treinamentos, Ferramentas e Suporte e documentação (links com código de login ou dados pessoais trocados pela
página de entrada). Cada fabricante ganha a seção "Comprovação para editais" (a preencher; campo comprovacoes em src/lib/wiki.ts).


**v3.96:** Wiki segmentada em Fabricantes, Documentos e Arquivos (abas na barra lateral, com contagem; durante a busca, a
contagem mostra quantos resultados há em cada seção). Cada seção tem uma página de abertura: cartões dos fabricantes, cartões
dos documentos e tabela dos arquivos com "Baixar". A busca continua procurando em tudo.


**v3.95:** painel da atividade com "Data real de conclusão" e "Horas realizadas" (antes só existiam no Atualizar status, e
concluir pelo painel era barrado pela validação). Ao escolher "Concluído", a data real vem preenchida (término previsto, se já
passou; senão hoje). O calendário do painel deixa de bloquear datas passadas.


**v3.94:** projetos anteriores a hoje — o cadastro aceita início, término e atividades no passado (dados gerais, cronograma e
rascunho), e o painel da atividade e a criação rápida de tarefas aceitam datas passadas. Continuam bloqueadas: reunião do Teams
no passado e reprogramar uma tarefa aberta para uma data que já passou (no Atualizar status).


**v3.93 — Wiki**
- Links reais (oficiais) para Dell, VMware by Broadcom, Lenovo, Omnissa, processadores (Intel/AMD) e servidores; novo item
  "Comprovações para editais" (TSAnet, FIRST, TCG, CVE, UEFI, DMTF, Windows Server Catalog, Red Hat, Ubuntu, NVIDIA).
- Botão "+ Adicionar à Wiki": o técnico escolhe Documento (texto, abre o editor) ou Arquivo (envia para a biblioteca
  "Wiki Tecnicos" do SharePoint, com descrição; mesmo nome pede confirmação para substituir; até 250 MB).
- Script: coluna Descricao na biblioteca Wiki Tecnicos.


**v3.92 — e-mails para o papel certo**
- Pedido de aprovação dos gates G2–G4: patrocinador da equipe do projeto (senão, os patrocinadores da lista Portal Tecnicos).
- Cadastro para aprovar: PMOs da lista Portal Tecnicos.
- Avisos ao PMO (atrasos, reprogramação, status de tarefa): gerente do projeto (senão, os PMOs da lista).
- Projeto criado/aprovado, gate aprovado e exclusão: gerente, patrocinador e equipe do projeto. Tarefa lançada: técnico responsável.
- emailPatrocinador/emailPmo do config.js viram último recurso. O config.js vem com emailSomentePara e reuniaoSomentePara vazios
  (modo de teste desligado: cada e-mail e convite vai para quem deve receber).


**v3.91 — projeto encerrado é somente consulta:** sem "Atualizar status", "Liberar edição", "+ Subatividade", "Lançar",
"+ Nova atividade", "+ Novo risco/pendência" e "Excluir" (o painel mostra "Projeto encerrado: somente consulta"); o Atualizar
status só lista tarefas de projetos ativos; e qualquer gravação em atividade, risco, pendência, reunião ou gate de projeto
encerrado é recusada. Documentos continuam podendo ser enviados.


**v3.90:** removida a exigência do "Responsável do fornecedor" na equipe para projetos com Parceiro (o campo Parceiro e o selo "Terceirizado" continuam).

**v3.89 — mais validações**
- Aviso de técnico sobrecarregado: ao criar, editar ou lançar uma tarefa, mostra as outras tarefas abertas do mesmo técnico no
  período (em todos os projetos).
- Aviso de horas: planejadas acima de 8 h por dia útil do período; realizadas mais de 20% acima das planejadas.
- Edital e Service Entitlement exigem número do contrato e data de assinatura (cadastro e edição).
- Projeto com Parceiro exige o "Responsável do fornecedor" na equipe.


**v3.88 — validações**
- Status coerente (Atualizar status e painel): "Concluído" exige 100%, data real e horas; 100% só com "Concluído"; "Bloqueado"
  exige impedimento = Sim e a observação; tarefa atrasada exige a causa; data real não pode ser futura nem antes do início;
  horas realizadas não diminuem.
- Datas: ao criar/editar, a atividade cabe no período do projeto e a tarefa no da atividade principal (bloqueia); ao reprogramar
  no Atualizar status, só avisa. Datas em fim de semana geram aviso.
- Gates: G3 só com as atividades da Execução concluídas/canceladas; G4 só com tudo concluído, riscos fechados/mitigados,
  pendências respondidas e o termo de aceite (arquivo com "TRD" ou "termo de aceite" no nome) na pasta do projeto. O checklist
  aparece no painel do gate e o botão só libera com tudo ✓.
- Edição ao mesmo tempo: se outra pessoa alterou a atividade depois que ela foi carregada, a gravação é recusada ("Fulano alterou
  esta atividade há N minutos") e os dados são recarregados.
- Cadastro: código no padrão CLIENTE-SIGLA (convertido ao digitar); cliente com sugestões e aviso de nome parecido.
- Risco alto exige plano de mitigação. Pendência ganha "Prazo"; aberta e vencida aparece em destaque (e no portfólio).
- Script: coluna Prazo em Portal Pendencias.


**v3.87 — celular:** cabeçalho em uma linha com menu ☰ (abre por baixo e fecha ao trocar de página); formulários com um campo
por linha; Atualizar status sem rolagem lateral (botões do painel quebram linha); Wiki com a barra lateral na largura da tela.
No computador nada muda.


**v3.86**
- Cadastro sem o aviso "Pessoas da lista/app" (e sem o PMO simulado do piloto).
- Atualizar status: técnico e PMO entram normalmente; sem projeto em andamento, "+ Nova tarefa" e "+ Nova subatividade" ficam
  bloqueados, com o aviso na página.
- Equipe sem pessoas repetidas: escolher como gerente/arquiteto alguém que já está na equipe só troca a função daquela linha;
  as listas escondem quem já está na equipe; a mesma pessoa (nome ou e-mail) em duas linhas impede a gravação.


**v3.85**
- Sem permissão extra no login: saem Application.Read.All e User.ReadBasic.All (podem ser removidas do app Portal PMO).
- Pessoas do cadastro vêm da lista **Portal Tecnicos**, pela coluna Função: Técnico/Arquiteto (arquiteto e equipe), PMO ou
  Gerente de projeto (gerente) e Patrocinador. A coluna aceita "PMO, Patrocinador" para quem acumula papéis (rode o script).
- Conferência da equipe ao criar/editar projeto: e-mail inválido impede a gravação; avisos para e-mail diferente do cadastrado,
  fora do domínio @systechtecnologia.com.br, repetido, sem e-mail, gerente que não é PMO, arquiteto que não é técnico, equipe sem
  técnico e pessoas sem acesso ao site no SharePoint (lido da lista de usuários do site, com a permissão que o portal já tem).
- Atualizar status fica bloqueado (menu e página) enquanto não houver projeto em andamento visível para a pessoa.


**v3.84:** as permissões para ler as pessoas do app Portal PMO (Application.Read.All e User.ReadBasic.All) passam a ser pedidas
no próprio login: ao abrir o site, se o token ainda não as tem, o portal redireciona uma vez (por sessão) e volta com acesso.
Técnicos, arquitetos, PMO e patrocinadores vêm do Entra ID automaticamente, sem botão. Sem o consentimento do administrador,
o portal segue normalmente com a lista Portal Tecnicos e mostra o motivo no cadastro.


**v3.83:** cadastro/edição de projeto — o Gerente de projeto vira uma lista com quem tem o perfil PMO no app Portal PMO (com
"Outra pessoa…" para digitar); ao escolher o gerente ou o arquiteto, a pessoa entra na equipe com a função e o e-mail. Um aviso
no topo mostra quantas pessoas vieram do Entra ID ou o motivo da falha, com o botão "Conectar ao Entra ID" para pedir a permissão.


**v3.82**
- Wiki: o técnico edita os documentos (botão "Editar", editor com prévia ao vivo, "+ Novo" e "Excluir"). As edições vão para a
  lista **Portal Wiki** (rode o script); os textos originais continuam como ponto de partida.
- Atualizar status do técnico sem o campo "Teve reunião no Teams?".
- Cadastro e edição de projeto: o portal lê quem está atribuído ao app **Portal PMO** no Entra ID — gerente de projeto sugere quem
  tem o perfil PMO (e entra na equipe ao ser escolhido), a função Patrocinador lista quem tem o perfil Patrocinador e os técnicos
  juntam os do app com a lista Portal Tecnicos. Requer as permissões delegadas do Microsoft Graph **Application.Read.All** e
  **User.ReadBasic.All** no registro do app, com consentimento do administrador; sem elas, o cadastro usa só a lista Portal Tecnicos.


**v3.81:** campo **Parceiro (terceirização)** no cadastro e na edição do projeto (opcional, com sugestões dos parceiros já
usados); aparece no cabeçalho com o selo "Terceirizado" para PMO, patrocinador e técnico — escondido do cliente. Coluna
Parceiro em Portal Projetos (rode o script). Conferido o progresso do dashboard do cliente (avanço ponderado, igual ao do PMO).


**v3.80:** portfólio do cliente sem a barra de busca.

**v3.79 — perfis pelo Entra ID**
- Conectado, o perfil vem só das **funções de aplicativo (App Roles)** atribuídas à pessoa no app "Portal PMO" do Entra ID
  (Aplicativos empresariais → Portal PMO → Usuários e grupos). Valores aceitos: `PMO`, `Patrocinador`, `Tecnico` e `Cliente`.
- O seletor de teste saiu. Quem tem uma função entra direto nela; quem tem mais de uma escolhe entre elas no menu das iniciais;
  quem não tem nenhuma vê "Você ainda não tem um perfil na Central Systech" (sem carregar dados nem rodar avisos automáticos).
- O token é renovado ao abrir o portal, então uma função atribuída agora já vale no próximo acesso.
- No modo piloto (sem login) o seletor continua, como "Perfil (piloto)", para demonstração.


**v3.78 — perfil Cliente (CLI)**
- Novo perfil **Cliente**, só de consulta. Vê os projetos ativos e encerrados do **seu órgão**: os projetos em que alguém da
  equipe do lado do cliente tem o mesmo domínio de e-mail (ex.: @trf1.jus.br). No piloto, ou testando com conta da Systech,
  simula o cliente do primeiro projeto ativo.
- Portfólio só com os cards dos projetos (sem indicadores internos nem lateral); menu só com o Portfólio.
- Dentro do projeto, três abas: **Atividades** (por fase, com as tarefas e filtro por situação), **Dashboard** (números, gráfico
  de pizza das atividades por situação e últimas concluídas) e **Cronograma** (somente leitura). Não vê ciclo de vida, riscos,
  pendências, documentos, histórico, acompanhamento interno, faturamento nem tarefas não lançadas.


**v3.77:** cronograma do projeto (PMO): clicar numa atividade volta a abrir o painel lateral (como antes). O filtro por projeto e o botão "Editar atividade" em Atualizar status continuam.

**v3.76**
- Portfólio do patrocinador: cards dos projetos no mesmo estilo dos do técnico ("Abrir projeto →").
- Atualizar status do PMO: filtro por projeto (como no técnico).
- Cronograma do projeto (PMO): clicar numa atividade abre a mesma atividade em Atualizar status, já selecionada — se ela não
  estiver entre as da semana, aparece fixada no topo ("aberta pelo cronograma"). O botão "Editar atividade" abre o painel
  completo (nome, fase, datas, pré-requisito, reunião, lançar tarefas). O patrocinador continua abrindo o painel de leitura.


**v3.75:** nomes dos arquivos da Wiki — no disco os arquivos ficam sem acento (`public/wiki/arquivos` e
`provisionamento/wiki-arquivos`, ex.: `instrucoes-trello.pdf`) e são exibidos e baixados com o nome certo ("Instruções TRELLO.pdf").
O script envia para a biblioteca Wiki Tecnicos com o nome certo e manda para a lixeira os arquivos enviados antes com o nome
quebrado; a Wiki também corrige na tela nomes quebrados vindos do SharePoint. O pacote passa a marcar os nomes como UTF-8.


**v3.74:** Wiki — o "Baixar para Word" grava os acentos como entidades HTML (&#231;…), então o Word mostra os acentos certos
qualquer que seja a codificação que ele escolher ao abrir o arquivo (antes podia aparecer "QualificaÃ§Ã£o").


**v3.73 — pasta de arquivos na Wiki do técnico**
- Novo grupo **Arquivos** na barra lateral da Wiki (abaixo de Fabricantes), com os 8 arquivos da equipe técnica (instruções
  do Trello e da resposta de e-mail de edital, Modelo-PaP, resumo de cotações, template de apresentação, template de e-mail e
  templates de sugestões). Cada um abre com descrição, tamanho e "Baixar"; o .txt mostra o conteúdo; a busca inclui os arquivos.
- O script cria a biblioteca **Wiki Tecnicos** no SharePoint e envia os arquivos da pasta `provisionamento/wiki-arquivos`.
  Conectado, o portal lista o que estiver na biblioteca (dá para incluir/trocar arquivos direto no SharePoint) e mostra
  "Abrir no SharePoint"; sem a biblioteca (ou no piloto), usa a cópia que vem junto com o portal (`public/wiki/arquivos`).


**v3.72:** Wiki — números dos passos sem o fundo vermelho; a busca procura dentro do texto dos documentos (sem diferenciar acentos
e maiúsculas), mostra os resultados com os trechos encontrados e marca o termo no documento aberto; a Wiki é exclusiva do
perfil Técnico (PMO e patrocinador não acessam nem pelo endereço).


**v3.71:** Wiki do técnico — novos documentos "Questionamento servidores" (Q6, peças remanufaturadas OEM), "Coleta de dados Via
Live Optics" (passo a passo, com o link a preencher em destaque) e "Disposicionar Dell" (Memory Tiering / VROC). Os documentos
mostram passos numerados, subtítulos, "Obs." (amarelo), "NOTA" (azul) e trechos a preencher (vermelho), também no Word.


**v3.70:** Wiki do técnico — o documento passa a se chamar "VMware - qualificações e questionamentos" e entra o documento
"Qualificações servidores Dell + HPE + Lenovo" (BIOS/segurança, gerenciamento, sistemas operacionais, certificações NVIDIA e
treinamento). As linhas "Obs.:" aparecem destacadas como observação interna (na tela e no Word).


**v3.69:** Wiki do técnico — os documentos modelo padrão saíram; no lugar, um único documento "Qualificação técnica — VMware"
(credenciamento, quadro de profissionais, gerente PMP, documentação, treinamento e os modelos de questionamentos: Qualificação
como Expert, Suporte técnico em português modelos 01 e 02, e Subcontratação). Conteúdo em `src/lib/wiki.ts`.


**v3.68:** o site passa a se chamar **Central Systech** (cabeçalho, aba do navegador, caminho das páginas, assunto e rodapé dos e-mails, documentos da Wiki e aviso de reunião cancelada). As mensagens de erro do Entra ID continuam citando o app "Portal PMO", que é o nome do aplicativo cadastrado.

**v3.67 — Wiki do técnico**
- Novo item **Wiki** no menu do técnico (ao lado de Atualizar status). Barra lateral com busca, **Documentos modelo**
  (ata de reunião, relatório de atividade, checklist de implantação, plano de rollback, relatório de evidências, termo de
  aceite/TRD e solicitação de mudança/RDM — com "Baixar para Word" e "Copiar texto") e **Fabricantes** (Dell, VMware,
  Lenovo, Omnissa, Processadores e Servidores — sites importantes e dicas).
- Os links dos fabricantes são fictícios (example.com). Conteúdo editável em `src/lib/wiki.ts`.


**v3.66:** card de projeto do técnico: o tipo do projeto ocupa o lugar do gerente no bloco em destaque; o gerente aparece discreto no rodapé ("GP: …").

**v3.65:** técnico sem a aba Dashboard no projeto; card de projeto do técnico no portfólio com novo visual (faixa vinho no topo, código e tipo em selos, cliente e gerente em destaque com ícone e iniciais, "Abrir tarefas do projeto").

**v3.64 — perfil Técnico**
- Portfólio: card só com nome, cliente, tipo e gerente (sem fases, farol e números); no topo só "Projetos ativos"; sem
  filtros de fase e sem "Próximos gates e marcos"; a lateral mostra só tarefas ("Tarefas em andamento agora" e "Tarefas atrasadas").
- Projeto: sem acesso ao ciclo de vida — a aba "Cronograma" saiu e o projeto abre direto em "Tarefas".
- Cronogramas: sem a bolinha à esquerda das tarefas.
- Tarefas em vermelho quando atrasadas e em amarelo quando vencem em até 3 dias úteis (aba Tarefas, Atualizar status e Cronogramas).


**v3.63**
- Projeto: Pendências e Decisões juntas numa aba ("Pendências e decisões"; o técnico vê só Decisões).
- Técnico: a aba "Cronograma" volta a mostrar o gráfico (sem as tarefas não lançadas); a lista de tarefas fica na aba "Tarefas".
- Dashboard: legenda de cores acima de cada gráfico; horas no formato realizadas/planejadas.
- **Horas planejadas** na atividade/subatividade (campo do PMO; coluna HorasPlanejadas — rode o script).
- Portfólio: cada card mostra atrasadas, aguardando pré-requisito, críticas (critério a definir) e horas realizadas/planejadas ("24/80 h").


**v3.62:** o cabeçalho do projeto mostra o campo "Modelo de faturamento" (abaixo de "Assinatura do contrato" e acima da "Regra").

**v3.61**
- Cronogramas do técnico: a tarefa dele é marcada com uma bolinha vermelha (no lugar do selo "minha").
- **Modelo de faturamento** (obrigatório no cadastro e na edição): Edital, Service Entitlement ou Sem receita. O cabeçalho
  do projeto mostra o modelo e, logo abaixo de "Assinatura do contrato", a **Regra** de cada modelo.
- **Dashboard** do projeto (nova aba): atividades, progresso, horas realizadas e itens críticos (critério a definir), e
  gráficos de barras de atividades por status, faixas de progresso e horas lançadas por mês (a partir do acompanhamento).
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar a coluna ModeloFaturamento.


**v3.60**
- Pré-requisito: um único campo de seleção no painel da atividade/subatividade ("— nenhum —" ou a atividade da qual depende).
- Lançar para o técnico mais à vista: faixa "N tarefas em preparação" no topo do cronograma do PMO, com a janela
  "Ver e lançar" para marcar e lançar; o painel da tarefa mostra se ela já foi lançada.
- Sem as colunas Lancada/Predecessoras no SharePoint, o portal avisa para rodar o script (antes, ignorava em silêncio).


**v3.59 — tarefas em preparação e pré-requisitos**
- O PMO cria tarefas/subatividades **em preparação** (o técnico não vê) e as lança depois: "Lançar para o técnico" no
  painel da tarefa ou "Lançar N tarefas" no painel da atividade principal (ou "Lançar para o técnico agora" ao criar).
  Ao lançar, o técnico responsável recebe um e-mail com as tarefas dele (`emailAoLancarTarefa`). Tarefas criadas pelo
  próprio técnico e as antigas já contam como lançadas.
- **Pré-requisitos:** no painel da atividade/subatividade, o PMO escolhe de quais outras ela depende (o portal não deixa
  criar ciclo). Enquanto algum pré-requisito não estiver concluído, ela não pode ser iniciada nem concluída — vale em
  qualquer tela. Listas e cronograma mostram "aguarda pré-req."; o painel mostra cada pré-requisito com ✓/○.
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar as colunas Lancada e Predecessoras.


**v3.58:** lista de tarefas do técnico: a primeira linha também escurece no hover e cada tarefa mostra o código do projeto. Portfólio: "Atividades em andamento agora" mostra as tarefas (subatividades) em andamento, não mais as atividades principais.

**v3.57:** lista de tarefas do técnico: sem a janela de informações ao passar o mouse; a linha só escurece.

**v3.56:** lista de tarefas do técnico: janela com as datas ao passar o mouse; ao clicar, o painel mostra as informações e o botão "Atualizar status", que abre a tarefa já selecionada (na página certa) em Atualizar status.

**v3.55:** aba "Cronograma" do técnico: só as tarefas (subatividades) do projeto, numa lista única (abertas da mais atrasada para a mais distante, concluídas no fim), com fonte menor.

**v3.54**
- Técnico, dentro do projeto: a lista "Atividades e tarefas" é o conteúdo da aba "Cronograma" (o gráfico saiu) e inclui as
  tarefas concluídas (no fim de cada atividade; atividades totalmente concluídas no fim da lista).
- **% da atividade principal calculado, não editável:** proporção das subatividades/tarefas concluídas (canceladas não
  contam) — incluir uma tarefa nova faz o % cair até ela ser concluída. Sem subatividades: 0% até a atividade ser
  concluída (100%). As subatividades continuam com o próprio % editável.


**v3.53**
- Cronogramas do técnico: todas as tarefas abertas dos projetos em que ele está (as dele com o selo "minha").
- **Aviso de atraso ao PMO:** uma vez por dia, ao abrir o portal, o PMO (gerente) de cada projeto recebe um e-mail com as
  atividades/subatividades que passaram do término previsto. Cada atraso é avisado uma vez (coluna AvisoAtraso); se a
  atividade for remarcada e atrasar de novo, avisa de novo. Desliga com `emailAoAtrasar: false`.
- PMO e patrocinador: a aba "Cronograma" do projeto passa a se chamar "Ciclo de vida".
- Técnico dentro do projeto: no lugar do ciclo de vida, a lista de atividades e tarefas ligadas, da mais atrasada para a
  mais distante; a aba continua "Cronograma".
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar a coluna AvisoAtraso.


**v3.52**
- "Atualizar status": "+ Nova tarefa" no cabeçalho da página (abre numa janela); "Atualizar status da tarefa" no canto
  superior direito do painel, sem o lápis.
- Mudar a fase de uma atividade pede confirmação; as subatividades acompanham a nova fase e **mantêm progresso, datas,
  status e responsáveis** (antes, ao salvar a principal, as subatividades eram sobrescritas com os dados dela).
- Cronogramas do técnico: o mesmo calendário por projeto, mas só com as tarefas (subatividades) dele em andamento ou a
  fazer, sem as fases.


**v3.51**
- "Atualizar status": título novo (sem o texto da semana) e lista paginada (5 por página).
- Técnico: as subatividades aparecem como **Tarefas** ("Tarefas 4", "+ Nova tarefa"); o cartão mostra só o título, o projeto
  e a data prevista; filtro por projeto; atrasadas primeiro e depois as mais próximas de hoje.
- Acompanhamento começa fechado: cada linha mostra a ação, a data e quem fez; clicando, aparecem as mudanças.
- Cronograma: atividade/subatividade em andamento com a barra inteira escura (preta na parte feita).


**v3.50 — acompanhamento das subatividades**
- Atualização semanal: a subatividade abre só para leitura (informações, documentos e acompanhamento); o botão
  **"✎ Atualizar status da subatividade"** libera o formulário, que volta para a leitura ao salvar ou cancelar.
- **Acompanhamento** (técnico, PMO e patrocinador): cada atualização grava como a atividade estava **antes** e como ficou
  **depois**; a linha do tempo mostra os campos que mudaram (antes riscado → depois) e "Ver como estava antes" com o
  retrato completo. Aparece na atualização semanal, no painel da atividade e na nova aba **Acompanhamento** do projeto
  (subatividades agrupadas pela atividade principal, com filtro abertas/concluídas/todas).
- **E-mail ao PMO** (gerente do projeto) quando o status de uma subatividade muda (`emailAoMudarStatusSubatividade`).
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar as colunas ItemCodigo, Antes e Depois em Portal Historico.


**v3.49:** em "Atualizar status", o **técnico** vê só as **subatividades** abertas dos projetos em que está (as dele primeiro,
marcadas "minha"); o botão "+ Nova subatividade" no topo da lista deixa escolher o projeto e a atividade principal.
O PMO continua vendo as atividades da semana.


**v3.48 — subatividades na atualização semanal**
- Cronograma: subatividades mostram código, status e o selo da reunião do Teams (como as atividades).
- PMO cria a subatividade indicando o **técnico responsável**; o técnico a vê em "Atualizar status" (mesmo fora da semana).
- Em "Atualizar status", o técnico (e o PMO) pode: incluir **subatividade** dentro da atividade (código automático e ele
  mesmo como responsável), informar se **teve reunião no Teams**, as **horas** e **o que foi feito**, e **adicionar
  documentos** — que vão para a pasta da fase da atividade, com o código no início do nome (ex.: "3.1.1 - relatorio.pdf").
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar as colunas TeveReuniao e Realizado.


**v3.47**
- **Modo escuro:** interruptor "Modo escuro" no menu das iniciais; a escolha fica salva no navegador e é aplicada ao
  abrir o portal (sem piscar claro).
- **Data de assinatura do contrato** no cadastro, na edição e no cabeçalho do projeto (coluna DataAssinatura — rode o script).
- **Fiscal** nas funções da equipe e coluna **Telefone** na equipe (obrigatória para o fiscal).
- **Criação de projeto sem aprovação do patrocinador:** o PMO cria o projeto já ativo (G1 aprovado por ele). Cadastros
  de outras pessoas que ficarem "Em aprovação" são aprovados pelo PMO. Os gates G2 a G4 continuam com o patrocinador.
- **Reunião do Teams:** "+ Convidar outra pessoa" para incluir convidados de fora da equipe, um e-mail por campo.
- **Financeiro** no menu do PMO e do patrocinador (página reservada, em construção).


**v3.46:** sem a dica "Automático: …" embaixo do código da atividade; "Rascunhos" e "Projetos encerrados" começam fechadas.

**v3.45 — código das atividades pela fase**
- Atividade: Iniciação 1.0, 1.1, 1.2…; Planejamento 2.0…; Execução 3.0…; Monitoramento 4.0…; Encerramento 5.0….
  Subatividade: três números (1.1.1, 1.1.2, 2.1.2…). O código é gerado automaticamente e travado.
- No cadastro do projeto, o código acompanha a fase da linha e tudo é renumerado ao trocar a fase, incluir ou remover
  atividades; o modelo Systech já vem nesse padrão. No cronograma, "+ Nova atividade" recalcula o código ao trocar a fase.
- Rascunhos: seção abre e fecha, como "Projetos encerrados".


**v3.44**
- Portfólio: "Rascunhos" e "Projetos encerrados" ficam na coluna dos projetos (mesma largura).
- "Atividades em andamento agora" e "Atividades atrasadas": o projeto aparece no início de cada item; a contagem das
  atrasadas sem fundo vermelho.
- Subatividade: código gerado automaticamente no padrão da principal (1.10 → 1.10.1, 1.10.2…) e travado; botão
  **"+ Subatividade"** no painel da atividade principal já abre com principal, código, fase e datas preenchidos.


**v3.43 — atividades atrasadas no portfólio**
- Seção renomeada para **"Atividades em andamento agora"** (só as que estão no prazo).
- Nova seção **"Atividades atrasadas"** logo abaixo: abertas que passaram do término previsto, das mais atrasadas para as
  menos, com os dias úteis de atraso (feriados não contam), status, %, data prevista e link para o cronograma.


**v3.42 — "Em andamento agora" no portfólio**
- Passa a mostrar as atividades abertas cujo período inclui hoje (mesmo ainda "Planejado"), além das em andamento e
  bloqueadas. As que começam hoje vêm primeiro, com o selo "começa hoje"; subatividades com datas próprias entram.
- Contagem no título e, com mais de 8, o link "Ver todas nos cronogramas".


**v3.41 — coluna "Tipo" do histórico**
- No SharePoint em português, toda lista tem a coluna oculta DocIcon exibida como "Tipo"; o script achava que a coluna
  Tipo do histórico já existia e não a criava. Agora o script compara só o nome interno das colunas (vale para todas)
  e o histórico usa a coluna **TipoMudanca** ("Tipo da mudança"). Registros pendentes são reenviados ao abrir o portal.
- Rode `provisionar-portal.ps1` (sem `-Piloto`) para criar a coluna.


**v3.40 — histórico que não gravava em silêncio**
- Antes, se a lista Portal Historico não existisse quando o portal abriu (ou o SharePoint recusasse a gravação), o registro
  era descartado sem aviso. Agora o portal procura a lista de novo, mostra o motivo exato da falha (lista inexistente,
  coluna faltando, limite do SharePoint…), guarda o registro no navegador e reenvia sozinho.
- A aba Histórico mostra quantos registros estão pendentes, o motivo e o botão "Tentar gravar agora".


**v3.39**
- **Tela de carregamento** nas operações demoradas (criar projeto, reunião do Teams, excluir, gates, documentos…): se passar
  de meio segundo, um cartão com a roda girando e a frase da operação cobre a tela até terminar.
- **Atividade abre só para visualização** (todos os perfis). O patrocinador só vê; PMO e técnico clicam em
  **"✎ Liberar edição"** para editar. Atividade nova abre direto no modo de edição.
- **Histórico:** "Projeto X criado"; registros que não puderem ser gravados (SharePoint indisponível ou limitando o acesso)
  ficam guardados no navegador e são reenviados na próxima releitura.
- **Data simulada** (teste): `dataSimulada: '2026-10-12'` no config.js faz o portal inteiro agir como se fosse esse dia
  (linha de hoje, atrasos, semana da atualização); o cabeçalho mostra "Data simulada".
- Cronograma: atividade atrasada sem progresso fica com a barra inteira avermelhada.


**v3.38 — correção do erro 429 (SharePoint "throttled")**
- Corrigido o ciclo da aba Histórico (v3.37), que relia o histórico sem parar (~130 chamadas por segundo) e fazia o
  SharePoint bloquear o acesso. Agora: 1 leitura ao abrir e outra só quando algo do projeto muda.
- Quando o SharePoint responde 429/503, o portal espera o tempo pedido (Retry-After, ou 1 s, 2 s, 4 s…), pausa todas as
  chamadas juntas e repete, sem mostrar erro.
- Menos chamadas: documentos em 1 chamada (antes 10) e só ao abrir a aba ou no botão "Recarregar lista"; releitura
  automática a cada 2 min (`sincronizarSegundos: 120`, mínimo 30) e só com a aba do navegador visível; consulta das
  reuniões no Outlook no máximo a cada 5 min; pastas sem projeto no máximo a cada 10 min.


**v3.37 — histórico do projeto**
- Nova aba **Histórico** no projeto (PMO e patrocinador): cada mudança feita pelo portal, com data e hora, usuário (e o
  perfil usado), tipo e o que mudou (de → para). Filtros por tipo e busca por pessoa ou texto.
- Registra: criação, edição e exclusão do projeto; rascunho enviado/ativado; atividades e subatividades (criar, editar,
  excluir, atualização semanal); riscos; pendências; gates (solicitar, aprovar, devolver); reuniões (agendar, alterar,
  cancelar, remarcada no Outlook); documentos (enviar, excluir).
- Gravado na lista **Portal Historico** (criada pelo script), pelo código do projeto — o histórico continua existindo
  mesmo se o projeto for excluído.
- Aba Documentos: o PMO pode **excluir** um arquivo (vai para a lixeira do SharePoint).
- Atualizar status: sem o filtro "minhas / toda a equipe"; mostra todas as atividades da semana dos projetos da pessoa.
- A data de "hoje" (linha vermelha do cronograma) é relida a cada minuto: muda sozinha à meia-noite.


**v3.36 — cabeçalho e carregamento**
- Menu na ordem Portfólio, Novo projeto, Cronogramas, Atualizar status (o link de Documentos saiu).
- Botão com as iniciais à direita abre um menu: Abrir Teams, Abrir SharePoint (site do portal), Atualizar dados,
  Perfil de teste e Sair (no piloto, Restaurar piloto). Fecha ao clicar fora ou com Esc.
- Animação de carregamento: roda girando na abertura do portal e nas telas que buscam dados; barrinha animada no topo da
  tela enquanto o portal busca ou grava algo (salvar, aprovar, criar, excluir, atualizar).


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
