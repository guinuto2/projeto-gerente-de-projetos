# Páginas e componentes

As páginas consultam contextos; componentes visuais recebem props e callbacks ou usam `usePortal`. Formulários mantêm estado local e exibem erros retornados por promessas. Não há biblioteca externa de formulários.

## Páginas

| Arquivo | Responsabilidade |
| --- | --- |
| `EditarProjetoPage.tsx` | Formulário de dados gerais/equipe/escopo e farol; mantém código, fase e baseline fora da edição direta. |
| `NovoProjetoPage.tsx` | Cadastro em quatro etapas; rascunho, envio pelo PMO ou criação ativa pelo patrocinador; trata e-mail separado da gravação. |
| `PortfolioPage.tsx` | Busca por código/nome/cliente/gerente, filtros de fase/aprovação e seções de projetos visíveis. |
| `ProjetoPage.tsx` | Resolve código e aba, verifica visibilidade, mostra cabeçalho/ciclo/avisos e abre decisão de gate. |

No detalhe, selecionar fase leva ao cronograma e aplica filtro. Trocar de código limpa o filtro e rola ao topo. A aba padrão é cronograma; riscos e pendências têm contagem de itens abertos. Os indicadores do projeto ficam ocultos para o perfil Patrocinador.

No cadastro, o estado `form` sobrevive à troca das quatro etapas. O rascunho usa validação mínima, o PMO envia Em aprovação e o Patrocinador pode criar Ativo após confirmação. Depois de salvar, a navegação ocorre antes de aguardar o aviso de e-mail.

Na edição, `paraForm` transforma arrays em texto multilinha. `salvar` valida campos básicos e datas, chama `editarProjeto` e volta ao detalhe. Fase e baseline são alteradas pelos gates, não pelo formulário.

## Componentes por grupo

### components/layout

| Componente | Comportamento |
| --- | --- |
| `Cabecalho` | Navegação, perfil de teste, usuário, sincronização, logout e restauração do piloto. O título da aba acompanha a sigla do perfil. |

### components/novo

| Componente | Comportamento |
| --- | --- |
| `EditorEquipe` | Tabela editável de membros; técnicos vêm do catálogo ativo e preenchem nome/e-mail/empresa. Funções diferentes permitem texto livre. |
| `PassoCronograma` | Edita linhas de atividade, datas, fase, equipe e marco; permite adicionar/remover e aplicar cronograma padrão. |
| `PassoDadosGerais` | Campos de identificação, cliente, tipo, contrato, gerente, arquiteto, datas e objetivo. Bloqueia código em edição. |
| `PassoEscopo` | Edita textos de escopo incluído/excluído, premissas, dependências e restrições. |
| `PassoRiscos` | Edita riscos iniciais e permite aplicar o modelo de riscos. |

### components/portfolio

| Componente | Comportamento |
| --- | --- |
| `CardProjeto` | Link ao detalhe com código, nome, tipo, farol/situação, gerente, avanço e próximo marco. |
| `EmAndamento` | Mostra até seis atividades macro Em andamento ou Bloqueado dos projetos visíveis. |
| `IndicadoresPortfolio` | Conta ativos, distribuição de faróis, aprovações, riscos altos abertos e pendências. |
| `PastasSemProjeto` | Consulta pastas órfãs por nome e permite removê-las após confirmação; só aparece quando a página permite excluir projetos. |
| `ProjetosEncerrados` | Tabela recolhível ordenada pela data de G4, com fallback para término previsto/baseline; mostra desvio. |
| `ProximosMarcos` | Combina gates não aprovados e marcos não concluídos de hoje em diante; mostra os cinco primeiros por data. |
| `Rascunhos` | Tabela de rascunhos com quantidade de dados faltantes e atalho para continuar. |
| `TrilhaFases` | Faixas visuais do ciclo; destaca Execução e Monitoramento em paralelo. |

### components/projeto

| Componente | Comportamento |
| --- | --- |
| `AvisoRascunho` | Mostra requisitos faltantes, atalhos de edição/cronograma e ação de enviar para aprovação ou ativar conforme perfil. |
| `CabecalhoProjeto` | Mostra identificação e metadados do projeto, com ações de edição/exclusão conforme permissões. |
| `CicloVida` | Mostra fases e gates, filtra cronograma por fase, identifica gate anterior bloqueante e permite solicitar/analisar aprovação. |
| `ExcluirProjeto` | Confirma pelo código digitado, oferece remoção de documentos e avisa por e-mail usando cópia anterior do projeto. |
| `IndicadoresProjeto` | Exibe avanço, planejado, desvio e contadores do projeto a partir dos utilitários. |

### components/projeto/abas

| Componente | Comportamento |
| --- | --- |
| `AbaCronograma` | Controla filtro de equipe/fase, exportação CSV e abertura do editor de atividade; compõe Gantt. |
| `AbaDecisoes` | Tabela somente de leitura de decisões ordenadas por código: decisão, descrição e justificativa. |
| `AbaDocumentos` | Carrega pastas ao abrir e ao mudar atualizadoEm; envia um arquivo por seleção e relê a lista. |
| `AbaEscopo` | Exibe números do piloto quando existentes, listas de escopo e detalhes de equipe/premissas. |
| `AbaPendencias` | Tabela por código com pergunta, resposta, impacto e situação; permite criar/editar/excluir e exportar. |
| `AbaRiscos` | Combina matriz dos riscos abertos, contadores por situação, tabela, editor e CSV. |
| `ExportarCsv` | Seleciona gerador de cronograma/riscos/pendências e baixa arquivo nomeado com projeto, tipo e data real. |
| `Gantt` | Calcula escala semanal, posição e largura em dias corridos; renderiza barras percentuais, baseline divergente, marcos e hoje, agrupados por fase. |
| `MatrizRiscos` | Conta riscos abertos por probabilidade e impacto em matriz 3×3; cor pela soma dos índices dos níveis. |

### components/projeto/editores

| Componente | Comportamento |
| --- | --- |
| `DecidirGate` | Drawer de aprovação/devolução com parecer e opção de congelar baseline no G2; permite aprovar com atividades abertas. |
| `EditarAtividade` | Valida datas e nome, limita percentual, cria/edita/exclui atividade e orquestra criação/edição/cancelamento de reunião. |
| `EditarPendencia` | Na criação recebe pergunta/detalhe/impacto; na edição altera situação e resposta; exclusão usa confirmação nativa. |
| `EditarRisco` | Na criação recebe dados do risco; na edição permite níveis, situação, responsável e mitigação; exclusão usa confirmação nativa. |
| `ReuniaoTeams` | Seção de formulário para tipo, horário, duração, pauta e seleção de participantes; calcula lista deduplicada. |

### components/ui

| Componente | Comportamento |
| --- | --- |
| `Abas` | Botões de abas com contagem opcional, seleção e callback aoMudar. |
| `Carregando` | Estado de carregamento com role status e texto configurável. |
| `Chips` | Filtros genéricos de seleção única, callback e rótulo acessível. |
| `Confirmacao` | Modal de confirmação; pausa sincronização e bloqueia cancelamento por Escape/fundo quando ocupado. |
| `Drawer` | Painel lateral com formulário, rodapé de ações, erro e botão salvar; pausa sincronização e fecha por Escape. |
| `Kpi` | Cartão de indicador com valor, nota, alerta e conteúdo opcional. |
| `Losango` | Representação visual de gate com cor por situação. |
| `Mensagem` | Aviso de informação, sucesso ou erro; erros usam role alert. |
| `Selo` | Etiqueta de situação/farol com cores configuráveis e fallback neutro. |
| `Vazio` | Apresentação de estado vazio com conteúdo livre. |

## Edição de atividades

`proximoCodigo` sugere código a partir das macros existentes. `salvar` exige nome e datas, rejeita datas novas/alteradas no passado e força 100% no status Concluído; caso contrário limita a porcentagem a 0–100. Datas antigas que não foram alteradas são aceitas.

`abrirEdicaoReuniao` carrega evento e reconstrói participantes marcados/extras. `confirmarCancelamento` cancela reunião; `confirmarExcluir` exclui atividade e, quando solicitado, tenta cancelar reuniões vinculadas. Uma falha de reunião posterior à gravação da atividade vira aviso, sem desfazer a atividade.

O perfil Técnico recebe controles estruturais desabilitados. Isso é regra da interface; o serviço não recebe um papel autenticado para validar essas restrições.

## Tabelas exibidas

| Tela | Colunas principais |
| --- | --- |
| Riscos | ID, risco, probabilidade, impacto, mitigação, responsável, situação |
| Pendências | ID, pendência/resposta, impacto, situação |
| Decisões | ID, decisão, descrição, justificativa |
| Encerrados | Código, projeto, cliente, tipo, GP, encerrado em, desvio |
| Rascunhos | Código, projeto, cliente, gerente, situação e ação |
| Equipe | Função, nome, empresa, e-mail e remover |

O Gantt usa elementos HTML/CSS posicionados, não uma tabela de banco. A escala visual usa dias corridos e semanas; os indicadores de duração usam dias úteis.

## CSS e acessibilidade implementada

`global.css` concentra tokens de cor/tipografia, grades, cards, cabeçalho, tabelas roláveis, Gantt, formulários, modal e drawer. Há ajustes em larguras de 1180px e 860px e tratamento de movimento reduzido. `tema.ts` contém cores usadas diretamente em TSX.

A implementação utiliza rótulos, role status/alert/dialog, aria-modal, aria-selected e teclado Enter em linhas clicáveis. Esses atributos não demonstram conformidade completa: o código de modal/drawer não implementa um gerenciador completo de foco. O Drawer permite fechar por Escape/fundo mesmo durante gravação; Confirmacao impede cancelamento enquanto ocupado.
