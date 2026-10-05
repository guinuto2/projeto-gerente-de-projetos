# Serviços e integrações

## FonteDados

`src/services/FonteDados.ts` define o contrato da interface com a persistência. Os métodos `salvar*` gravam; quem atualiza o estado React é `PortalContext`.

| Grupo | Métodos |
| --- | --- |
| Sessão e leitura | entrar, sair, email, hoje, carregar |
| Projetos | salvarProjeto, criarProjeto, excluirProjeto |
| Atividades | salvarAtividade, criarAtividade, excluirAtividade |
| Riscos | salvarRisco, criarRisco, excluirRisco |
| Pendências | salvarPendencia, criarPendencia, excluirPendencia |
| Gates | salvarGate, criarGate, excluirGates opcional |
| Documentos | documentos, enviarArquivo, linkBiblioteca |
| Pastas órfãs | pastasSemProjeto e excluirPasta opcionais |
| Calendário | criarReuniaoTeams, obterReuniaoTeams, atualizarReuniaoTeams, cancelarReuniaoTeams opcionais |
| Capacidades | reuniaoGravavel opcional |
| E-mail | enviarEmail opcional |
| Piloto | persistir e restaurar opcionais |

## FontePiloto

`carregar` tenta ler `portal-pmo-piloto-v3` do `localStorage`; na ausência ou erro, clona o JSON original. Normaliza tipo antigo e preenche técnicos padrão se a coleção estiver vazia. `persistir` grava o agregado; falhas de armazenamento são suprimidas. `restaurar` remove a chave. `hoje` retorna a referência original do piloto.

Os métodos de gravação não acessam servidor. As criações de atividade, risco, pendência e gate devolvem o próprio objeto. `documentos` organiza arquivos ilustrativos por fase e esvazia as URLs. `enviarArquivo` lança erro explicando que exige SharePoint; `linkBiblioteca` retorna vazio. Não há integração de e-mail ou calendário.

## FonteSharePoint

| Função/etapa | Implementação |
| --- | --- |
| `preparar` | Reutiliza promessa de descoberta; em falha limpa cache para permitir tentativa futura |
| `descobrir` | Resolve site por host/caminho, seis listas obrigatórias, técnicos opcional, colunas de atividades e drive pelo nome |
| `itens` | Lê itens com fields e paginação, solicitando páginas de até 500 |
| `url` | Monta endpoint de coleção/item de lista |
| `carregar` | Lê listas, converte campos, relaciona Lookup ID ao código de projeto e trata gates duplicados |
| `paraColunas` | Mapeia nomes, serializa arrays/equipe e converte datas |
| `gravar` | Remove do payload colunas reconhecidas como ausentes pelo erro e tenta novamente |
| `patchItem` / `postItem` | Usam gravar para tolerar esquema antigo |
| `salvarProjeto` / `salvarAtividade` | PATCH apenas das colunas mapeadas |
| `salvarRisco` / `salvarPendencia` | PATCH direto com mapa restrito de campos |
| `salvarGate` | PATCH com código do gate ou cria item quando ainda não há _id |
| `criarGate` | POST com fase e vínculo ProjetoLookupId; retorna _id |
| `excluirGates` | DELETE sequencial dos IDs fornecidos |
| `criarProjeto` | Cria projeto, atividades, riscos, gates e árvore de pastas em sequência |
| `excluirProjeto` | Remove filhos conhecidos, projeto e opcionalmente pasta; tolera 404 dos filhos e pasta |
| `criarAtividade/criarRisco/criarPendencia` | POST, vínculo numérico ao projeto, retorno com _id |
| `excluirAtividade/excluirRisco/excluirPendencia` | DELETE pelo _id |

Na leitura, `ProjetoLookupId` referencia o ID numérico do item de projeto. Registros cujo vínculo não encontra projeto são ignorados. Gates duplicados são agrupados por código; vence Aprovado, depois Aguardando aprovação, depois Pendente e, em empate, o menor ID. A leitura registra IDs extras em `gatesRepetidos`, sem apagá-los automaticamente.

`txt` transforma nulo em vazio; `num` converte para número com fallback zero; `dataSp` grava datas como meio-dia UTC ou null. O campo `numeros` dos projetos conectados é sempre null.

## GraphClient

| Método | Entrada | Saída/efeito |
| --- | --- | --- |
| `pedir<T>` | caminho e opções HTTP | Token, fetch sem cache, valida HTTP e retorna JSON ou null em 204 |
| `todos<T>` | caminho | Segue @odata.nextLink e concatena value |
| `get/post/patch/excluir` | caminho e corpo quando aplicável | Adaptadores de pedir |
| `enviar` | caminho de drive, File | Cria sessão de upload e envia blocos de 6.553.600 bytes |

A sessão de upload usa comportamento de conflito `rename`. O cliente não implementa retry geral, backoff para throttling nem controle de concorrência por ETag.

## Autenticação

`AutenticadorMsal` configura `PublicClientApplication`, authority pelo tenant, redirect pela origem/caminho e cache em sessionStorage. `entrar` reutiliza uma promessa de sessão; `iniciar` processa retorno do redirect e usa a conta devolvida ou a primeira conta em cache. Sem conta, inicia login por redirect.

`token` tenta aquisição silenciosa e usa redirect quando há necessidade de interação. `tokenPara` faz o mesmo para escopos adicionais, mas usa popup. `email` devolve username/UPN e `sair` executa logout por redirect. `explicarErroLogin` transforma códigos conhecidos em mensagens de diagnóstico.

| Operação no código | Escopo solicitado |
| --- | --- |
| Login e acesso às listas | User.Read e Sites.ReadWrite.All |
| E-mail da conta | Mail.Send |
| E-mail de caixa compartilhada | Mail.Send.Shared |
| Calendário e Teams | Calendars.ReadWrite |

São os escopos que esta versão solicita; configuração e autorização efetivas pertencem ao ambiente Microsoft. Os perfis selecionáveis do cabeçalho não alteram o token.

## Documentos

`criarPasta` trata conflito de nome como pasta já existente. `documentos` percorre as cinco pastas padrão e lista arquivos, sem recursão nas subpastas. Qualquer falha de leitura de uma pasta é suprimida e ela pode aparecer vazia. `enviarArquivo` monta o caminho escapado e delega o upload ao GraphClient. `linkBiblioteca` monta link web do drive e opcionalmente do projeto.

`pastasSemProjeto` compara nomes da raiz com códigos dos projetos, sem diferenciar maiúsculas, e ignora Forms. `excluirPasta` envia DELETE pelo caminho. A classificação é por nome, não por metadados de autoria.

## E-mail

`enviarEmail(assunto, html, para?)` usa `/me/sendMail` ou `/users/{caixa}/sendMail`. Sem destinatário consulta `/me` e envia à própria conta. Converte destinatários separados por vírgula ou ponto e vírgula e pede para salvar nos enviados. Trata falhas de acesso e caixa inexistente com mensagens específicas.

Os templates em `lib/emailProjeto.ts` produzem assunto e HTML; não enviam mensagens sozinhos. A função interna `esc` escapa conteúdo textual; `botao` monta chamada para ação e `montar` o layout do e-mail.

## Teams e calendário

`corpoEvento` converte NovaReuniao em subject, body, start, end e attendees. O fuso informado ao Graph é `E. South America Standard Time`. `calendario` centraliza token adicional, fetch e erros.

| Método | Endpoint |
| --- | --- |
| criarReuniaoTeams | POST /me/events, isOnlineMeeting e teamsForBusiness |
| obterReuniaoTeams | GET /me/events/{id} com campos de edição |
| atualizarReuniaoTeams | PATCH /me/events/{id} |
| cancelarReuniaoTeams | POST /me/events/{id}/cancel |

A criação devolve ID e joinUrl, com fallback para webLink. A leitura calcula duração mínima de 15 minutos e devolve pauta vazia; a pauta original não é recuperada. As ações usam o calendário da conta atual, portanto um ID criado por outra conta pode não ser acessível nesse caminho.
