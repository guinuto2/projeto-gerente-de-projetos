# Regras de negócio e utilitários

## Indicadores — lib/calculos.ts

| Função | Entrada → saída | Regra exata |
| --- | --- | --- |
| macro | Dados, código → Atividade[] | Somente itens sem pai |
| avanco | Dados, código → number | Média de percentual ponderada por duração, arredondada; exclui canceladas e duração zero |
| planejado | Dados, código, hoje → number | Progresso esperado com baseline, fallback para previsto e ponderação por duração |
| desvio | Projeto → number | Diferença útil entre término baseline e previsto, compensando contagem inclusiva |
| riscosAbertos | Dados, código → Risco[] | Aberto ou Em tratamento |
| riscosAltos | Dados, código → Risco[] | Abertos, impacto Alto, probabilidade diferente de Baixo |
| pendenciasAbertas | Dados, código → Pendencia[] | Situação diferente de Respondida |
| proximoMarco | Dados, código, hoje → Atividade ou undefined | Macro/marco não concluído, término hoje ou futuro, mais próximo |
| estadoFase | Dados, Projeto, Fase → EstadoFase | Usa fase oficial e situação Encerrado; Execução/Monitoramento paralelos |
| faseAtual | Dados, Projeto → Fase | Normaliza Monitoramento para Execução |
| progressoFase | Dados, código, fase → feitas/total/abertas | Macros concluídas ou canceladas contam como feitas |

Exemplo de avanço: atividade de 2 dias a 100% e de 6 dias a 0% produzem `(2×100 + 6×0)/8 = 25%`. Subatividades não duplicam o peso da macro.

No planejado, antes da baseline a contribuição é zero; depois do fim é 100%. Dentro do intervalo usa `max(0, diasUteis(inicio, hoje)-1) / max(1, diasUteis(inicio, fim))`. Assim o primeiro dia começa com zero, e o último dia não é necessariamente 100%. Atividades sem datas permanecem no denominador, mas não contribuem na soma.

O SPI exibido em `IndicadoresProjeto` é `avanco / planejado`, formatado com duas casas; quando o planejado é zero, aparece um travessão.

O farol do projeto é um campo editável, não um resultado automático do percentual. `proximoMarco` não exclui explicitamente Cancelado, apenas Concluído. O contador de aprovações do portfólio soma gates aguardando e cadastros Em aprovação; um cadastro e seu G1 podem contar duas vezes.

## Datas — lib/datas.ts

| Função | Contrato |
| --- | --- |
| dia | ISO opcional → Date local ou null |
| iso | Date opcional → aaaa-mm-dd ou vazio |
| isoDeDataHora | Timestamp → data no fuso local do navegador |
| dm / dma | ISO → dd/mm ou dd/mm/aaaa; ausente vira travessão |
| diaUtil | Date → exclui sábado, domingo e conjunto fixo de feriados |
| diasUteis | início, fim → conta ambos os extremos; negativo se invertido; ausentes dão zero |
| somarDiasUteis | data, n → desloca n dias úteis |
| hojeIso / horaAgora | Data atual / horário local formatado pt-BR |
| linhas | Texto ou array → lista aparada sem linhas vazias |
| extensao | Nome → última extensão em minúsculas |

O calendário de feriados é uma lista fixa entre setembro de 2026 e maio de 2027, não um serviço de calendário. Deve ser mantido para que durações e previsões continuem coerentes.

## Cadastro — components/novo/formulario.ts

| Função | Responsabilidade |
| --- | --- |
| novaAtividade(n) | Linha vazia; primeira fase Iniciação, demais Execução |
| novoRisco(n) | Código R-n, níveis médios e texto vazio |
| formVazio() | Estado inicial com uma atividade e um risco |
| validar(form, dados, hoje) | Lista faltas: código único, nome, cliente, GP, datas, objetivo e atividade válida |
| montarProjeto(form, situação, aprovação?, técnicos?) | Normaliza código, converte texto/listas, gera baseline, equipe e quatro gates |
| cronogramaModelo(início) | Ordena atividades padrão por dias úteis e insere Monitoramento em paralelo |
| riscosModelo() | Cópia dos riscos padrão |
| montarEquipe(form, técnicos) | Normaliza membros e inclui gerente/arquiteto quando não presentes |

O código do projeto é convertido para maiúsculas. A validação de unicidade do cadastro ignora caixa, porém não é uma restrição única transacional no SharePoint. Em rascunho, a tela exige apenas código e nome. A validação completa exige começo a partir de hoje e não permite término anterior ao início.

`montarProjeto` inicializa atividades como Planejado/0%, baseline igual às datas informadas e sem pai. Com aprovação inicial, o projeto nasce em Planejamento e G1 aprovado. A variável `aprovacaoPmo` e alguns comentários têm nomenclatura antiga; a interface atual oferece a aprovação ao Patrocinador.

`pendenciasRascunho` verifica cliente, gerente, objetivo, início não passado, término e macros com datas. Essa verificação é mais curta do que `validar` e não repete todas as comparações entre datas.

## Gates

| Gate | Fecha | Efeito da aprovação |
| --- | --- | --- |
| G1 | Iniciação | Ativa cadastro quando necessário; Planejamento |
| G2 | Planejamento | Execução; pode congelar baseline |
| G3 | Execução e Monitoramento | Encerramento |
| G4 | Encerramento | Situação Encerrado |

`gateBloqueante` procura gate anterior não aprovado na ordenação por código. `gateDaFase` associa Monitoramento ao G3 da Execução. O bloqueio é aplicado no componente CicloVida; não é uma validação universal no comando `decidirGate`. A aprovação com atividades ainda abertas é permitida pela tela. Ao devolver um pedido, `DecidirGate` exige parecer.

`gatesFaltantes` monta G1–G4 ausentes. `situacaoInicial` aprova fases anteriores à fase atual, aprova tudo em projetos encerrados e deixa G1 aguardando quando o cadastro está Em aprovação.

## Constantes, pessoas e visual

`FASES`, `PASTAS`, `STATUS_ATIVIDADE`, `NIVEIS`, `SITUACOES_RISCO`, `TIPOS_PROJETO` e `FUNCOES_EQUIPE` centralizam opções. `GATE_DA_FASE`, `PROXIMA_FASE` e `GATE_APOS_FASE` descrevem ciclo. As famílias `SELO_*`, `COR_*`, `GATE_COR`, `GATE_CAIXA` e `TEMA` centralizam cores.

`normalizarTipo` converte o nome legado VMware / EUC em VMware. `porCodigo` ordena em pt-BR com comparação numérica. `classeEquipe` classifica Systech, cliente ou ambos para CSS. `proximoCodigoSeq` escolhe o prefixo mais frequente e incrementa o maior sufixo numérico desse prefixo. `tipoReuniao` busca definição pelo nome.

`ativos` filtra e ordena técnicos ativos; `tecnicoPorNome` localiza pelo nome normalizado conforme o código. `TECNICOS_PADRAO` é cadastro embutido usado no piloto; os dados pessoais não são republicados aqui. `modeloSystech.ts` contém CRONOGRAMA_SYSTECH e RISCOS_SYSTECH para copiar no cadastro.

## CSV — lib/csv.ts

`csvCronograma`, `csvRiscos` e `csvPendencias` retornam texto; `baixarCsv` cria Blob, dispara download e revoga a URL depois. `montarCsv` inclui BOM UTF-8, delimitador ponto e vírgula e linhas CRLF. `celula` escapa aspas/separadores/quebras; números usam vírgula e `data` formata datas.

Cronograma inclui macros e subatividades ordenadas. Os geradores exportam a coleção inteira do projeto, independentemente do filtro visual atual. O conteúdo não passa por neutralização de fórmulas de planilha.

## Templates de e-mail — lib/emailProjeto.ts

`emailNovoProjeto`, `emailSolicitacaoProjeto`, `emailSolicitacaoGate`, `emailGateAprovado`, `emailProjetoCriadoPeloPmo`, `emailReuniaoAlterada` e `emailProjetoExcluido` retornam assunto/HTML de cada evento. `corpoReuniao` monta o corpo do convite. `urlDoPortal` resolve base e `linkProjeto` cria link para detalhe. O nome `emailProjetoCriadoPeloPmo` é legado; o fluxo atual usa criação/ativação pelo patrocinador.

## Formulário de reunião

`marcacaoPadrao` seleciona pessoas com e-mail, exclui organizador e restringe a Systech no tipo Interna. `formReuniaoInicial` começa desativado, Alinhamento, 10:00 e duração definida no tipo. `convidados` combina marcados e extras válidos, em minúsculas e sem duplicações. Tipos: Implementação 120 min, Alinhamento 60, Interna 30 e Execução 60; a pessoa pode mudar a duração.
