# Limitações observadas e manutenção

Estes pontos descrevem o código recebido. Não são correções aplicadas nesta entrega.

## Perfis de teste

`lib/permissoes.ts` deixa explícito que o seletor é para teste. Ele controla interface e fica salvo em `portal-pmo-papel-teste-v2`; não representa autorização Microsoft. O papel padrão é PMO; existe migração da chave legada. `pode` consulta a matriz e `salvarPapel` persiste a escolha.

| Ação | Patrocinador | PMO | Técnico |
| --- | --- | --- | --- |
| Criar/editar projeto | Sim | Sim | Não |
| Excluir projeto | Sim | Não | Não |
| Solicitar gate | Não | Sim | Não |
| Aprovar gate | Sim | Não | Não |
| Gerenciar estrutura de atividades | Sim | Sim | Não |
| Atualizar atividade | Sim | Sim | Sim |
| Editar risco/responder pendência | Sim | Sim | Não |
| Enviar documento | Sim | Sim | Sim |

A leitura das listas ocorre antes da filtragem por equipe no navegador. O filtro visual do Técnico não impede que dados já recebidos sejam inspecionados. O controle efetivo pertence às permissões da conta no serviço remoto.

## Persistência e concorrência

- A herança de campos da macro para filhas e parte do congelamento de baseline das filhas só mudam o estado local; uma releitura pode reverter esses valores.
- Criar projeto, aprovar gate, excluir projeto e agendar reunião envolvem várias chamadas sem transação ou rollback. Falhas intermediárias podem deixar trabalho parcial.
- A maioria dos comandos usa o agregado capturado pelo contexto; `aplicarCom` protege especificamente alguns fluxos de reunião contra estado antigo. Edições simultâneas não possuem versionamento por ETag.
- Cache/fila de gates evita duplicação dentro da instância da página, mas não é trava distribuída entre usuários ou abas independentes.
- O fallback `gravar` pode omitir campos ausentes no SharePoint; o sucesso da operação não significa que esses campos tenham sido gravados.
- Exclusão de projeto usa os filhos conhecidos no snapshot e não cancela reuniões de calendário. A exclusão de atividade pode tentar cancelar; falhas de cancelamento são suprimidas nesse fluxo.

## Regras que merecem atenção ao evoluir

| Ponto | Consequência |
| --- | --- |
| Datas/feriados fixos | Calendário útil precisa de manutenção |
| Contagem de cadastro + G1 | Aprovações pendentes pode contar duas unidades para o mesmo cadastro |
| Gate bloqueante só em parte da UI | Não tratar sequência como validação universal do contexto |
| Projeto encerrado | Há aviso e separação no portfólio, mas não uma trava geral de edição por situação |
| Falhas de documentos suprimidas | Pasta vazia pode também indicar erro de acesso/leitura |
| Atualização manual | Pode reler mesmo com edição aberta |
| Código de atividade/pendência | Algumas validações são limitadas; não há restrição única remota no script |
| CSV | Escapa sintaxe, mas não neutraliza fórmulas introduzidas em textos |
| Pauta de reunião | Leitura devolve vazio e edição pode substituir o texto do convite |
| Horários | Modelo declara Brasília; cálculo usa Date local do navegador em alguns pontos |

## Onde alterar cada recurso

Para adicionar um campo persistido, atualize o modelo, o formulário/editor, o comando do contexto quando necessário, os mapeamentos de leitura/gravação e o esquema externo. Atualize também exportações e templates que devam carregar o novo dado.

Para incluir uma página, crie o componente em `pages`, registre a rota em `App` e adicione navegação quando necessária. Para nova operação remota, comece pelo contrato `FonteDados`, implemente capacidades apropriadas nas fontes e exponha pelo contexto.

O `package.json` não possui script de teste automatizado. A validação estática prevista pelo projeto é `npm run build`. Fluxos de SharePoint, permissões, e-mails e calendário precisam ser verificados num ambiente de integração autorizado; eles não foram executados para produzir este material.
