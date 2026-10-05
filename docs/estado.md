# Estado e funções do portal

Fonte principal: `src/state/PortalContext.tsx`. O contexto expõe dados e comandos por `usePortal()`. Os comandos retornam promessas; o chamador deve aguardar e tratar os erros. As validações da interface não são todas repetidas no contexto.

## Contextos e hooks

| Função | Entrada e saída | Comportamento |
| --- | --- | --- |
| `PortalProvider` | children → Provider/estado de carga/erro | Inicializa fonte, sessão, dados e sincronização |
| `usePortal` | sem argumentos → PortalValor | Lança erro fora de PortalProvider |
| `useBloqueioSincronizacao` | id, ativo → void | Registra bloqueio e remove no cleanup |
| `PapelProvider` | children → Provider | Mantém papel de teste, função trocar e pode |
| `usePapel` | sem argumentos → contexto de papel | Consulta permissões visuais |
| `ToastProvider` | children → Provider + toast | Mantém mensagem transitória na interface |
| `useToast` | sem argumentos → função de aviso | Notifica ações e falhas |
| `useProjetosVisiveis` | sem argumentos → coleções e podeVer | Filtra pelo perfil e pertencimento à equipe |
| `membrosConhecidos` | Projeto[] → string[] | Remove marcadores, deduplica nomes e ordena |

PMO e Patrocinador veem todos os projetos; Técnico é comparado por nome normalizado ou e-mail da equipe. No piloto, a identidade técnica é o primeiro nome da lista de membros. `projetos` exclui rascunhos e encerrados, mas **inclui Em aprovação**; `rascunhos` fica vazio para Técnico.

## Campos expostos

`fonte` é a implementação de persistência; `dados` é o agregado `Dados`; `usuario` e `email` representam a sessão; `hoje` vem da fonte; `sincronizando` indica releitura; `atualizadoEm` é o horário da última leitura; `reuniaoGravavel` indica disponibilidade das colunas necessárias.

## Comandos de projeto e gates

| Função | Parâmetros principais | Resultado e efeitos |
| --- | --- | --- |
| `atualizar` | manual? | Relê listas, garante gates e atualiza assinatura; erro manual vira toast |
| `bloquear` | id, ativo | Adiciona/remove identificador no Set de bloqueios |
| `criarProjeto` | NovoProjeto | Grava conjunto; conectado relê listas; piloto adiciona coleções localmente |
| `editarProjeto` | código, Partial Projeto | Grava campos e substitui projeto no estado |
| `submeterRascunho` | código, aprovacao/ativar | Em aprovação + G1 aguardando, ou Ativo + Planejamento + G1 aprovado |
| `aprovarCadastro` | código, parecer? | Delega a decidirGate para G1 |
| `solicitarGate` | código, gate | Grava Aguardando aprovação e atualiza estado |
| `decidirGate` | código, gate, decisão | Aprova/devolve, grava autoria/data/parecer e avança fase se aprovado |
| `removerGatesRepetidos` | código | Exclui IDs extras e devolve quantidade removida |
| `excluirProjeto` | código, documentos | Remove registros e coleções; limpa cache de gates do projeto |
| `restaurarPiloto` | nenhum | Remove persistência do piloto e recarrega base |

Em `decidirGate`, G1 pode ativar o cadastro, G2 pode congelar baseline, G3 leva ao Encerramento e G4 muda a situação para Encerrado. Devolver define o gate como Pendente e limpa aprovador/data, mantendo o parecer; não retrocede automaticamente a fase.

Ao congelar baseline, o contexto persiste datas de atividades macro que mudaram, mas copia datas para todas as atividades no estado local. Veja as implicações em [Manutenção](manutencao.md).

## Atividades, riscos e pendências

| Função | Entrada | Retorno/efeito |
| --- | --- | --- |
| `salvarAtividade` | projeto, atividade, campos | Recalcula duração quando início e término vêm juntos; grava alvo e atualiza estado |
| `criarAtividade` | projeto, Atividade | Valida código duplicado, calcula duração se necessário e devolve atividade criada |
| `excluirAtividade` | projeto, código, cancelarReunioes? | Exclui alvo e filhos diretos; tenta cancelar reuniões quando solicitado |
| `salvarRisco` | projeto, código, campos | Grava e substitui risco local |
| `criarRisco` | projeto, Risco | Rejeita código já existente no estado; insere e atualiza lista |
| `excluirRisco` | projeto, código | Exclui registro e remove do estado |
| `salvarPendencia` | projeto, código, campos | Grava e substitui pendência local |
| `criarPendencia` | projeto, Pendencia | Verifica duplicidade e adiciona registro |
| `excluirPendencia` | projeto, código | Exclui e filtra lista local |

A herança de status, percentual, datas e fase de uma atividade macro para as filhas ocorre em memória no contexto. `salvarAtividade` da fonte grava apenas o alvo; a herança não é persistida individualmente nas filhas pelo fluxo atual.

## Reuniões

| Função | Entrada | Saída e sequência |
| --- | --- | --- |
| `agendarReuniao` | projeto, atividade, NovaReuniao | Cria evento, grava vínculo na atividade e retorna convidados |
| `lerReuniao` | atividade | Consulta evento e devolve NovaReuniao |
| `atualizarReuniao` | projeto, atividade, reunião, anterior? | Atualiza evento e vínculo; devolve convidados e resultado do e-mail adicional |
| `cancelarReuniao` | projeto, atividade, mensagem | Cancela evento, limpa colunas e estado local |
| `testeReuniao` | nenhum | Retorna destinatários configurados para teste ou null |

O organizador é removido da lista de convidados. O modo piloto não implementa os métodos de calendário. Antes de criar o evento, o código confere as colunas de vínculo; ainda assim, uma falha entre criar o evento e gravar a atividade pode deixar uma reunião sem vínculo persistido.

## Avisos de e-mail

| Função | Uso |
| --- | --- |
| `enviarEmailCriacao(novo)` | Aviso de projeto ativo ao gerente e patrocinador |
| `avisarPmoProjeto(novo)` | Solicitação de cadastro ao patrocinador configurado |
| `avisarPmoGate(código, gate)` | Solicitação de gate, com progresso da fase |
| `avisarAprovacao(código, gate, parecer)` | Aprovação ao gerente e patrocinador |
| `avisarExclusaoProjeto(projeto, removidos, documentos)` | Usa a foto anterior à exclusão e avisa equipe/gerente/patrocinador |

Os nomes `avisarPmo*` são legados: o destinatário atual vem de `emailPatrocinador`, com fallback `emailPmo`. `destinatarios` remove repetidos e aplica o destino de teste. `emailDoGp` procura membro com função de gerente ou mesmo nome do gerente. Falha de e-mail não desfaz o projeto salvo; alguns fluxos exibem toast, enquanto `submeterRascunho` suprime a falha assíncrona.

## Funções internas

`garantirGates` usa fila de promessas e cache por projeto/gate para completar G1–G4. Se a criação falha, mantém gate virtual na tela. `comItem` faz atualização imutável de um item por código. `assinar` serializa projetos, atividades, riscos, pendências, decisões e técnicos, sem documentos. `aplicar` troca o agregado inteiro; `aplicarCom` calcula o novo valor a partir do estado mais recente, usado em reuniões encadeadas. `editando` combina bloqueios explícitos e elemento focado.
