# Dicionário das listas SharePoint

Fonte de nomes, tipos e opções: `provisionamento/provisionar-portal.ps1`. Fonte do mapeamento: `src/services/FonteSharePoint.ts`. Este é o esquema esperado pelo código e script recebidos, não uma inspeção de um site remoto.

`Text` = texto; `Note` = múltiplas linhas; `Choice` = escolha; `Number` = número; `Boolean` = sim/não; `DateTime/DateOnly` = data sem horário exibido. `Title` e o ID são campos nativos. Os nomes na primeira coluna são **nomes internos**, usados pela API.

## Portal Projetos

URL relativa criada: `Lists/PortalProjetos`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Nome do projeto | Text | nome | Campo nativo renomeado visualmente |
| Codigo | Código | Text | codigo | — |
| Cliente | Cliente | Text | cliente | — |
| TipoProjeto | Tipo | Choice | tipo | VMware; Omnissa; Client; Storage; Servidores; Backup; Rede |
| Fase | Fase | Choice | fase | Iniciação; Planejamento; Execução; Monitoramento; Encerramento |
| Farol | Farol | Choice | farol | Verde; Amarelo; Vermelho |
| Situacao | Situação do cadastro | Choice | situacaoCadastro | Rascunho; Em aprovação; Ativo; Encerrado |
| Gerente | Gerente de projeto | Text | gerente | — |
| Arquiteto | Arquiteto | Text | arquiteto | — |
| Patrocinador | Patrocinador | Text | patrocinador | — |
| Contrato | Contrato / pedido | Text | contrato | — |
| DataInicio | Início | DateTime/DateOnly | inicio | Data |
| DataTerminoBaseline | Término (baseline) | DateTime/DateOnly | terminoBaseline | Data |
| DataTerminoPrevista | Término previsto | DateTime/DateOnly | terminoPrevisto | Data |
| Objetivo | Objetivo | Note | objetivo | — |
| EscopoIncluido | No escopo (um por linha) | Note | escopoIncluido | — |
| EscopoExcluido | Fora do escopo (um por linha) | Note | escopoExcluido | — |
| Premissas | Premissas (uma por linha) | Note | premissas | — |
| Dependencias | Dependências (uma por linha) | Note | dependencias | — |
| Restricoes | Restrições (uma por linha) | Note | restricoes | — |
| Equipe | Equipe (Nome  /  Função  /  Empresa  /  Email) | Note | equipe | — |

## Portal Atividades

URL relativa criada: `Lists/PortalAtividades`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Atividade | Text | nome | Campo nativo renomeado visualmente |
| Projeto | Projeto | Lookup | Vínculo externo ao objeto | Obrigatório, indexado; Graph: ProjetoLookupId |
| Codigo | Código | Text | codigo | — |
| Fase | Fase | Choice | fase | Iniciação; Planejamento; Execução; Monitoramento; Encerramento |
| Equipe | Equipe | Text | equipe | — |
| Duracao | Duração (dias úteis) | Number | duracao | — |
| DataInicio | Início previsto | DateTime/DateOnly | inicio | Data |
| DataTermino | Término previsto | DateTime/DateOnly | termino | Data |
| DataBaselineInicio | Início baseline | DateTime/DateOnly | baselineInicio | Data |
| DataBaselineTermino | Término baseline | DateTime/DateOnly | baselineTermino | Data |
| Status | Status | Choice | status | Planejado; Em andamento; Bloqueado; Concluído; Cancelado |
| Percentual | % concluído | Number | percentual | — |
| Marco | Marco | Boolean | marco | — |
| AtividadePai | Atividade pai (código) | Text | pai | — |
| Descricao | Descrição | Note | descricao | — |
| Observacao | Observação | Note | observacao | — |
| ReuniaoTeams | Reunião do Teams (link) | Note | reuniaoUrl | — |
| ReuniaoInicio | Reunião · início | Text | reuniaoInicio | — |
| ReuniaoId | Reunião · ID do evento | Text | reuniaoId | — |
| ReuniaoTipo | Reunião · tipo | Text | reuniaoTipo | — |

## Portal Riscos

URL relativa criada: `Lists/PortalRiscos`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Risco | Text | descricao | Campo nativo renomeado visualmente |
| Projeto | Projeto | Lookup | Vínculo externo ao objeto | Obrigatório, indexado; Graph: ProjetoLookupId |
| Codigo | ID | Text | codigo | — |
| ImpactoProjeto | Impacto no projeto | Note | impactoProjeto | — |
| Cenarios | Cenários | Text | cenarios | — |
| Probabilidade | Probabilidade | Choice | probabilidade | Baixo; Médio; Alto |
| Impacto | Impacto | Choice | impacto | Baixo; Médio; Alto |
| Mitigacao | Mitigação | Note | mitigacao | — |
| Contingencia | Contingência | Note | contingencia | — |
| Responsavel | Responsável | Text | responsavel | — |
| Situacao | Situação | Choice | situacao | Aberto; Em tratamento; Mitigado; Fechado |

## Portal Pendencias

URL relativa criada: `Lists/PortalPendencias`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Pendência | Text | pergunta | Campo nativo renomeado visualmente |
| Projeto | Projeto | Lookup | Vínculo externo ao objeto | Obrigatório, indexado; Graph: ProjetoLookupId |
| Codigo | ID | Text | codigo | — |
| Detalhe | Detalhamento | Note | detalhe | — |
| Impacto | Impacto | Note | impacto | — |
| Situacao | Situação | Choice | situacao | Aberta; Respondida |
| Resposta | Resposta do cliente | Note | resposta | — |

## Portal Gates

URL relativa criada: `Lists/PortalGates`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Nome do gate | Text | nome | Campo nativo renomeado visualmente |
| Projeto | Projeto | Lookup | Vínculo externo ao objeto | Obrigatório, indexado; Graph: ProjetoLookupId |
| Fase | Fase | Choice | fase | Iniciação; Planejamento; Execução; Monitoramento; Encerramento |
| Gate | Código do gate | Text | gate | — |
| Situacao | Situação | Choice | situacao | Pendente; Aguardando aprovação; Aprovado |
| DataPrevista | Data prevista | DateTime/DateOnly | data | Data |
| Info | Critério / informação | Note | info | — |
| AprovadoPor | Aprovado por | Text | aprovadoPor | — |
| DataAprovacao | Data da aprovação | DateTime/DateOnly | dataAprovacao | Data |
| Parecer | Parecer do PMO | Note | parecer | — |

## Portal Decisoes

URL relativa criada: `Lists/PortalDecisoes`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Decisão | Text | decisao | Campo nativo renomeado visualmente |
| Projeto | Projeto | Lookup | Vínculo externo ao objeto | Obrigatório, indexado; Graph: ProjetoLookupId |
| Codigo | ID | Text | codigo | — |
| Descricao | Descrição | Note | descricao | — |
| Justificativa | Justificativa | Note | justificativa | — |
| Impacto | Impacto / observação | Note | impacto | — |

## Portal Tecnicos

URL relativa criada: `Lists/PortalTecnicos`.

| Coluna interna | Rótulo | Tipo | Propriedade no modelo | Opções / observações |
| --- | --- | --- | --- | --- |
| ID | Identificador | Counter | _id | Gerado pelo SharePoint |
| Title | Nome | Text | nome | Campo nativo renomeado visualmente |
| Email | E-mail | Text | email | — |
| Funcao | Função | Choice | funcao | Técnico; Arquiteto; Gerente de projeto |
| Ativo | Ativo | Boolean | ativo | — |

## Diferenças importantes entre ler e gravar

- `Portal Riscos.Cenarios` é lido, mas não é gravado por `criarRisco`; o editor cria esse valor vazio. Ao cadastrar riscos junto do projeto, o payload também não inclui ImpactoProjeto e Contingencia.
- `salvarRisco` aceita só Situacao, Mitigacao, Responsavel, Probabilidade e Impacto. Descrição e contingência não são editáveis no fluxo de alteração atual.
- `salvarPendencia` grava somente Situacao e Resposta. Pergunta, detalhe e impacto são definidos na criação.
- `COLUNAS_PROJETO` não inclui Codigo: o código fica fixo após criar o projeto.
- Gates podem ter colunas legadas ausentes. O fallback de gravação remove campos não reconhecidos; isso permite continuar, mas o campo removido não fica persistido.
- `reuniaoGravavel` exige ReuniaoTeams, ReuniaoInicio e ReuniaoId. ReuniaoTipo é usada, porém não integra essa checagem.
- `Portal Tecnicos` é opcional para a fonte conectada. Se ausente, a lista de técnicos fica vazia; o fallback de técnicos padrão pertence ao piloto.

## Integridade

O script não impõe unicidade ao Codigo do projeto nem ao par projeto/gate. A UI verifica algumas duplicidades, e a leitura deduplica gates, mas essas verificações não substituem restrições no armazenamento. A existência das colunas no script não comprova que uma instalação antiga já as tenha.
