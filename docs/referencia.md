# Referência do código de src

Catálogo de todos os arquivos do pacote recebido. Cada seção informa a responsabilidade e as funções nomeadas com a linha de declaração no arquivo original. Assinaturas preservam parâmetros e tipos explícitos; retorno sem anotação é inferido pelo TypeScript. Lambdas anônimas de map/filter e callbacks inline não recebem entradas separadas.

As explicações de comportamento estão em [Interface](interface.md), [Estado](estado.md), [Serviços](servicos.md) e [Regras](regras.md). As interfaces do contrato ficam em FonteDados, e as entidades em [Tipos](tipos.md).

## App.tsx

Compõe os três providers e define as rotas com HashRouter.

| Função | Linha | Contrato |
| --- | --- | --- |
| `App` | 15 | `App()` |

## components/layout/Cabecalho.tsx

Navegação, perfil de teste, usuário, sincronização, logout e restauração do piloto. O título da aba acompanha a sigla do perfil.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Cabecalho` | 9 | `Cabecalho()` |
| `classe` | 18 | `classe({ isActive }: { isActive: boolean })` |
| `restaurar` | 20 | `restaurar()` |

## components/novo/EditorEquipe.tsx

Tabela editável de membros; técnicos vêm do catálogo ativo e preenchem nome/e-mail/empresa. Funções diferentes permitem texto livre.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ehTecnico` | 8 | `ehTecnico(m: MembroEquipe)` |
| `tecnicoVazio` | 9 | `tecnicoVazio(): MembroEquipe` |
| `pessoaVazia` | 10 | `pessoaVazia(): MembroEquipe` |
| `EditorEquipe` | 16 | `EditorEquipe({ equipe, aoMudar }: Props)` |
| `mudar` | 19 | `mudar(i: number, campos: Partial<MembroEquipe>)` |
| `escolherTecnico` | 20 | `escolherTecnico(i: number, nome: string)` |

## components/novo/PassoCronograma.tsx

Edita linhas de atividade, datas, fase, equipe e marco; permite adicionar/remover e aplicar cronograma padrão.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PassoCronograma` | 7 | `PassoCronograma({ linhas, aoMudar, aoUsarModelo, dataMinima }: Props)` |
| `mudar` | 8 | `mudar(i: number, c: K, v: LinhaAtividade[K])` |

## components/novo/PassoDadosGerais.tsx

Campos de identificação, cliente, tipo, contrato, gerente, arquiteto, datas e objetivo. Bloqueia código em edição.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PassoDadosGerais` | 9 | `PassoDadosGerais({ form, mudar, edicao = false, aoEscolherArquiteto, dataMinima }: Props)` |
| `antesDeHoje` | 12 | `antesDeHoje(v: string)` |
| `campo` | 13 | `campo(c: Campo, rotulo: string, extra: { type?: string; placeholder?: string; span?: boolean; bloqueado?: boolean; min?: string } = {})` |

## components/novo/PassoEscopo.tsx

Edita textos de escopo incluído/excluído, premissas, dependências e restrições.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PassoEscopo` | 5 | `PassoEscopo({ form, mudar }: { form: FormProjeto; mudar: (c: Campo, v: string) => void })` |
| `area` | 6 | `area(c: Campo, rotulo: string)` |

## components/novo/PassoRiscos.tsx

Edita riscos iniciais e permite aplicar o modelo de riscos.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PassoRiscos` | 7 | `PassoRiscos({ linhas, aoMudar, aoUsarModelo }: Props)` |
| `mudar` | 8 | `mudar(i: number, c: K, v: LinhaRisco[K])` |

## components/novo/formulario.ts

Cria valores iniciais, valida cadastro, converte para domínio e aplica modelos de cronograma, riscos e equipe.

| Função | Linha | Contrato |
| --- | --- | --- |
| `diaUtilIso` | 6 | `diaUtilIso(s: string)` |
| `novaAtividade` | 22 | `novaAtividade(n: number): LinhaAtividade` |
| `novoRisco` | 23 | `novoRisco(n: number): LinhaRisco` |
| `formVazio` | 25 | `formVazio(): FormProjeto` |
| `validar` | 32 | `validar(f: FormProjeto, d: Dados, hoje: string): string[]` |
| `br` | 34 | `br(s: string)` |
| `montarProjeto` | 52 | `montarProjeto(f: FormProjeto, situacao: SituacaoCadastro, aprovacaoPmo?: { por: string; em: string }, tecnicos: Tecnico[] = []): NovoProjeto` |
| `fimDaFase` | 60 | `fimDaFase(fase: Fase)` |
| `gate` | 61 | `gate(fase: Fase, g: string, nome: string, data: string, info = '', sit: Gate['situacao'] = 'Pendente'): Gate` |
| `cronogramaModelo` | 88 | `cronogramaModelo(inicio: string): LinhaAtividade[]` |
| `riscosModelo` | 105 | `riscosModelo(): LinhaRisco[]` |
| `montarEquipe` | 110 | `montarEquipe(f: FormProjeto, tecnicos: Tecnico[] = []): MembroEquipe[]` |
| `tem` | 112 | `tem(n: string)` |

## components/portfolio/CardProjeto.tsx

Link ao detalhe com código, nome, tipo, farol/situação, gerente, avanço e próximo marco.

| Função | Linha | Contrato |
| --- | --- | --- |
| `CardProjeto` | 9 | `CardProjeto({ projeto: p }: { projeto: Projeto })` |
| `curto` | 13 | `curto(s: string)` |

## components/portfolio/EmAndamento.tsx

Mostra até seis atividades macro Em andamento ou Bloqueado dos projetos visíveis.

| Função | Linha | Contrato |
| --- | --- | --- |
| `EmAndamento` | 9 | `EmAndamento()` |

## components/portfolio/IndicadoresPortfolio.tsx

Conta ativos, distribuição de faróis, aprovações, riscos altos abertos e pendências.

| Função | Linha | Contrato |
| --- | --- | --- |
| `IndicadoresPortfolio` | 7 | `IndicadoresPortfolio()` |
| `conta` | 15 | `conta(f: string)` |

## components/portfolio/PastasSemProjeto.tsx

Consulta pastas órfãs por nome e permite removê-las após confirmação; só aparece quando a página permite excluir projetos.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PastasSemProjeto` | 10 | `PastasSemProjeto()` |
| `remover` | 25 | `remover()` |

## components/portfolio/ProjetosEncerrados.tsx

Tabela recolhível ordenada pela data de G4, com fallback para término previsto/baseline; mostra desvio.

| Função | Linha | Contrato |
| --- | --- | --- |
| `encerradoEm` | 8 | `encerradoEm(p: Projeto)` |
| `ProjetosEncerrados` | 11 | `ProjetosEncerrados({ projetos }: { projetos: Projeto[] })` |
| `abrir` | 15 | `abrir(p: Projeto)` |

## components/portfolio/ProximosMarcos.tsx

Combina gates não aprovados e marcos não concluídos de hoje em diante; mostra os cinco primeiros por data.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ProximosMarcos` | 7 | `ProximosMarcos()` |

## components/portfolio/Rascunhos.tsx

Tabela de rascunhos com quantidade de dados faltantes e atalho para continuar.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Rascunhos` | 7 | `Rascunhos({ projetos }: { projetos: Projeto[] })` |
| `abrir` | 11 | `abrir(p: Projeto)` |

## components/portfolio/TrilhaFases.tsx

Faixas visuais do ciclo; destaca Execução e Monitoramento em paralelo.

| Função | Linha | Contrato |
| --- | --- | --- |
| `TrilhaFases` | 6 | `TrilhaFases({ atual }: { atual: Fase })` |

## components/projeto/AvisoRascunho.tsx

Mostra requisitos faltantes, atalhos de edição/cronograma e ação de enviar para aprovação ou ativar conforme perfil.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AvisoRascunho` | 11 | `AvisoRascunho({ projeto: p }: { projeto: Projeto })` |
| `confirmar` | 22 | `confirmar()` |

## components/projeto/CabecalhoProjeto.tsx

Mostra identificação e metadados do projeto, com ações de edição/exclusão conforme permissões.

| Função | Linha | Contrato |
| --- | --- | --- |
| `CabecalhoProjeto` | 10 | `CabecalhoProjeto({ projeto: p }: { projeto: Projeto })` |

## components/projeto/CicloVida.tsx

Mostra fases e gates, filtra cronograma por fase, identifica gate anterior bloqueante e permite solicitar/analisar aprovação.

| Função | Linha | Contrato |
| --- | --- | --- |
| `cores` | 13 | `cores(selecionada: boolean, e: EstadoFase): [string, string, string]` |
| `gateBloqueante` | 28 | `gateBloqueante(p: Projeto, g: Gate): Gate &#124; undefined` |
| `gateDaFase` | 34 | `gateDaFase(p: Projeto, f: Fase): Gate &#124; undefined` |
| `CicloVida` | 41 | `CicloVida({ projeto: p, faseSel, aoSelecionar, aoDecidir }: Props)` |
| `solicitar` | 50 | `solicitar(g: Gate)` |
| `botaoFase` | 60 | `botaoFase(f: Fase)` |
| `losango` | 72 | `losango(f: Fase)` |

## components/projeto/ExcluirProjeto.tsx

Confirma pelo código digitado, oferece remoção de documentos e avisa por e-mail usando cópia anterior do projeto.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ExcluirProjeto` | 9 | `ExcluirProjeto({ projeto: p, aoFechar }: { projeto: Projeto; aoFechar: () => void })` |
| `tecla` | 19 | `tecla(e: KeyboardEvent)` |
| `excluir` | 34 | `excluir()` |

## components/projeto/IndicadoresProjeto.tsx

Exibe avanço, planejado, desvio e contadores do projeto a partir dos utilitários.

| Função | Linha | Contrato |
| --- | --- | --- |
| `IndicadoresProjeto` | 6 | `IndicadoresProjeto({ projeto: p }: { projeto: Projeto })` |

## components/projeto/abas/AbaCronograma.tsx

Controla filtro de equipe/fase, exportação CSV e abertura do editor de atividade; compõe Gantt.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AbaCronograma` | 16 | `AbaCronograma({ projeto, faseSel, limparFase }: Props)` |

## components/projeto/abas/AbaDecisoes.tsx

Tabela somente de leitura de decisões ordenadas por código: decisão, descrição e justificativa.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AbaDecisoes` | 6 | `AbaDecisoes({ projeto }: { projeto: Projeto })` |

## components/projeto/abas/AbaDocumentos.tsx

Carrega pastas ao abrir e ao mudar atualizadoEm; envia um arquivo por seleção e relê a lista.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AbaDocumentos` | 13 | `AbaDocumentos({ projeto }: { projeto: Projeto })` |
| `enviar` | 28 | `enviar(pasta: string, e: ChangeEvent<HTMLInputElement>)` |

## components/projeto/abas/AbaEscopo.tsx

Exibe números do piloto quando existentes, listas de escopo e detalhes de equipe/premissas.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Lista` | 3 | `Lista({ itens }: { itens: string[] })` |
| `AbaEscopo` | 5 | `AbaEscopo({ projeto: p }: { projeto: Projeto })` |

## components/projeto/abas/AbaPendencias.tsx

Tabela por código com pergunta, resposta, impacto e situação; permite criar/editar/excluir e exportar.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AbaPendencias` | 11 | `AbaPendencias({ projeto }: { projeto: Projeto })` |
| `abrir` | 15 | `abrir(c: string)` |

## components/projeto/abas/AbaRiscos.tsx

Combina matriz dos riscos abertos, contadores por situação, tabela, editor e CSV.

| Função | Linha | Contrato |
| --- | --- | --- |
| `AbaRiscos` | 13 | `AbaRiscos({ projeto }: { projeto: Projeto })` |
| `abrir` | 17 | `abrir(c: string)` |

## components/projeto/abas/ExportarCsv.tsx

Seleciona gerador de cronograma/riscos/pendências e baixa arquivo nomeado com projeto, tipo e data real.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ExportarCsv` | 11 | `ExportarCsv({ projeto, tipo }: { projeto: Projeto; tipo: keyof typeof GERADORES })` |
| `exportar` | 14 | `exportar()` |

## components/projeto/abas/Gantt.tsx

Calcula escala semanal, posição e largura em dias corridos; renderiza barras percentuais, baseline divergente, marcos e hoje, agrupados por fase.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Gantt` | 18 | `Gantt({ projeto, atividades, filtro, aoAbrir }: Props)` |
| `pos` | 33 | `pos(s: string)` |
| `larg` | 34 | `larg(a: string, b: string)` |
| `corBarra` | 35 | `corBarra(a: Atividade)` |
| `barra` | 44 | `barra(a: Atividade)` |

## components/projeto/abas/MatrizRiscos.tsx

Conta riscos abertos por probabilidade e impacto em matriz 3×3; cor pela soma dos índices dos níveis.

| Função | Linha | Contrato |
| --- | --- | --- |
| `MatrizRiscos` | 5 | `MatrizRiscos({ abertos }: { abertos: Risco[] })` |
| `celula` | 6 | `celula(pr: string, im: string)` |

## components/projeto/editores/DecidirGate.tsx

Drawer de aprovação/devolução com parecer e opção de congelar baseline no G2; permite aprovar com atividades abertas.

| Função | Linha | Contrato |
| --- | --- | --- |
| `DecidirGate` | 13 | `DecidirGate({ projeto: p, gate, aoFechar }: { projeto: Projeto; gate: Gate; aoFechar: () => void })` |
| `decidir` | 26 | `decidir(aprovar: boolean)` |

## components/projeto/editores/EditarAtividade.tsx

Valida datas e nome, limita percentual, cria/edita/exclui atividade e orquestra criação/edição/cancelamento de reunião.

| Função | Linha | Contrato |
| --- | --- | --- |
| `proximoCodigo` | 22 | `proximoCodigo(lista: Atividade[]): string` |
| `EditarAtividade` | 30 | `EditarAtividade({ projeto, codigo, faseInicial, aoFechar }: Props)` |
| `quando` | 68 | `quando(s?: string)` |
| `abrirEdicaoReuniao` | 70 | `abrirEdicaoReuniao()` |
| `confirmarCancelamento` | 86 | `confirmarCancelamento()` |
| `muda` | 95 | `muda(k: keyof typeof f)` |
| `salvar` | 97 | `salvar()` |
| `br` | 102 | `br(s: string)` |
| `excluir` | 155 | `excluir()` |
| `confirmarExcluir` | 156 | `confirmarExcluir()` |

## components/projeto/editores/EditarPendencia.tsx

Na criação recebe pergunta/detalhe/impacto; na edição altera situação e resposta; exclusão usa confirmação nativa.

| Função | Linha | Contrato |
| --- | --- | --- |
| `EditarPendencia` | 9 | `EditarPendencia({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo?: string; aoFechar: () => void })` |
| `muda` | 22 | `muda(k: keyof typeof f)` |
| `salvar` | 24 | `salvar()` |
| `excluir` | 38 | `excluir()` |

## components/projeto/editores/EditarRisco.tsx

Na criação recebe dados do risco; na edição permite níveis, situação, responsável e mitigação; exclusão usa confirmação nativa.

| Função | Linha | Contrato |
| --- | --- | --- |
| `EditarRisco` | 9 | `EditarRisco({ projeto, codigo, aoFechar }: { projeto: Projeto; codigo?: string; aoFechar: () => void })` |
| `muda` | 24 | `muda(k: keyof typeof f)` |
| `salvar` | 26 | `salvar()` |
| `excluir` | 44 | `excluir()` |

## components/projeto/editores/ReuniaoTeams.tsx

Seção de formulário para tipo, horário, duração, pauta e seleção de participantes; calcula lista deduplicada.

| Função | Linha | Contrato |
| --- | --- | --- |
| `marcacaoPadrao` | 19 | `marcacaoPadrao(equipe: MembroEquipe[], meuEmail: string, tipo: string): Record<string, boolean>` |
| `formReuniaoInicial` | 29 | `formReuniaoInicial(equipe: MembroEquipe[], titulo: string, data: string, meuEmail: string): FormReuniao` |
| `convidados` | 35 | `convidados(f: FormReuniao): string[]` |
| `ReuniaoTeams` | 55 | `ReuniaoTeams({ form: f, aoMudar, equipe, meuEmail, disponivel, motivo, edicao = false, dataMinima }: Props)` |
| `muda` | 56 | `muda(k: K, v: FormReuniao[K])` |
| `todos` | 59 | `todos(v: boolean)` |

## components/ui/Abas.tsx

Botões de abas com contagem opcional, seleção e callback aoMudar.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Abas` | 3 | `Abas({ abas, ativa, aoMudar }: { abas: Aba[]; ativa: string; aoMudar: (id: string) => void })` |

## components/ui/Carregando.tsx

Estado de carregamento com role status e texto configurável.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Carregando` | 1 | `Carregando({ texto = 'Carregando…' }: { texto?: string })` |

## components/ui/Chips.tsx

Filtros genéricos de seleção única, callback e rótulo acessível.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Chips` | 10 | `Chips({ opcoes, valor, aoMudar, rotulo, formatar }: ChipsProps<T>)` |

## components/ui/Confirmacao.tsx

Modal de confirmação; pausa sincronização e bloqueia cancelamento por Escape/fundo quando ocupado.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Confirmacao` | 15 | `Confirmacao({ titulo, children, rotuloConfirmar, ocupado = false, erro, aoConfirmar, aoCancelar }: Props)` |
| `tecla` | 18 | `tecla(e: KeyboardEvent)` |

## components/ui/Drawer.tsx

Painel lateral com formulário, rodapé de ações, erro e botão salvar; pausa sincronização e fecha por Escape.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Drawer` | 20 | `Drawer({ titulo, subtitulo, aberto, salvando, erro, aoFechar, aoSalvar, rotuloSalvar = 'Salvar', acoes, children }: DrawerProps)` |
| `tecla` | 24 | `tecla(e: KeyboardEvent)` |
| `enviar` | 29 | `enviar(e: FormEvent)` |

## components/ui/Kpi.tsx

Cartão de indicador com valor, nota, alerta e conteúdo opcional.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Kpi` | 3 | `Kpi({ rotulo, valor, nota, alerta = false, children }: { rotulo: string; valor?: ReactNode; nota?: string; alerta?: boolean; children?: ReactNode })` |

## components/ui/Losango.tsx

Representação visual de gate com cor por situação.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Losango` | 4 | `Losango({ texto, situacao, grande = false, titulo }: { texto: string; situacao: string; grande?: boolean; titulo?: string })` |

## components/ui/Mensagem.tsx

Aviso de informação, sucesso ou erro; erros usam role alert.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Mensagem` | 3 | `Mensagem({ tipo, children, className = '' }: { tipo: 'ok' &#124; 'erro' &#124; 'info'; children: ReactNode; className?: string })` |

## components/ui/Selo.tsx

Etiqueta de situação/farol com cores configuráveis e fallback neutro.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Selo` | 4 | `Selo({ valor, cores, forte = false }: { valor: string; cores: Record<string, Cores>; forte?: boolean })` |

## components/ui/Vazio.tsx

Apresentação de estado vazio com conteúdo livre.

| Função | Linha | Contrato |
| --- | --- | --- |
| `Vazio` | 3 | `Vazio({ children }: { children: ReactNode })` |

## config/config.ts

Interface PortalConfig, valores padrão, merge com window.PORTAL_CONFIG e seleção do modo piloto.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## data/piloto-trf1.json

Agregado JSON de demonstração; base de FontePiloto, com datas ilustrativas e coleções indexadas por projeto.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## lib/calculos.ts

Indicadores calculados por projeto e fase, seleção de macros e contadores de riscos/pendências.

| Função | Linha | Contrato |
| --- | --- | --- |
| `macro` | 6 | `macro(d: Dados, cod: string): Atividade[]` |
| `contaParaAvanco` | 8 | `contaParaAvanco(a: Atividade)` |
| `avanco` | 10 | `avanco(d: Dados, cod: string): number` |
| `planejado` | 17 | `planejado(d: Dados, cod: string, hoje: string): number` |
| `desvio` | 32 | `desvio(p: Projeto): number` |
| `riscosAbertos` | 38 | `riscosAbertos(d: Dados, cod: string): Risco[]` |
| `riscosAltos` | 41 | `riscosAltos(d: Dados, cod: string): Risco[]` |
| `pendenciasAbertas` | 44 | `pendenciasAbertas(d: Dados, cod: string): Pendencia[]` |
| `proximoMarco` | 47 | `proximoMarco(d: Dados, cod: string, hoje: string): Atividade &#124; undefined` |
| `estadoFase` | 57 | `estadoFase(_d: Dados, p: Projeto, fase: Fase): EstadoFase` |
| `faseAtual` | 65 | `faseAtual(_d: Dados, p: Projeto): Fase` |
| `progressoFase` | 70 | `progressoFase(d: Dados, cod: string, fase: Fase): { feitas: number; total: number; abertas: Atividade[] }` |

## lib/constantes.ts

Opções de domínio, cores, gates, modelos de reunião e helpers de ordenação/código.

| Função | Linha | Contrato |
| --- | --- | --- |
| `normalizarTipo` | 12 | `normalizarTipo(t: string): string` |
| `porCodigo` | 31 | `porCodigo(a: { codigo: string }, b: { codigo: string })` |
| `classeEquipe` | 34 | `classeEquipe(equipe: string): 's' &#124; 'c' &#124; 'a'` |
| `tipoReuniao` | 66 | `tipoReuniao(nome?: string)` |
| `proximoCodigoSeq` | 72 | `proximoCodigoSeq(codigos: string[], prefixoPadrao: string): string` |

## lib/csv.ts

Serialização CSV compatível com o formato pt-BR e download via Blob no navegador.

| Função | Linha | Contrato |
| --- | --- | --- |
| `celula` | 8 | `celula(v: unknown): string` |
| `data` | 12 | `data(s?: string)` |
| `montarCsv` | 14 | `montarCsv(cabecalho: string[], linhas: unknown[][]): string` |
| `baixarCsv` | 19 | `baixarCsv(nomeArquivo: string, conteudo: string)` |
| `csvCronograma` | 27 | `csvCronograma(d: Dados, p: Projeto): string` |
| `csvRiscos` | 44 | `csvRiscos(d: Dados, p: Projeto): string` |
| `csvPendencias` | 51 | `csvPendencias(d: Dados, p: Projeto): string` |

## lib/datas.ts

Conversão ISO/local, formatos brasileiros, contagem/deslocamento de dias úteis e normalização de linhas.

| Função | Linha | Contrato |
| --- | --- | --- |
| `dia` | 8 | `dia(iso?: string &#124; null): Date &#124; null` |
| `iso` | 14 | `iso(d?: Date &#124; null): string` |
| `isoDeDataHora` | 20 | `isoDeDataHora(v?: string &#124; null): string` |
| `dm` | 22 | `dm(s?: string): string` |
| `dma` | 27 | `dma(s?: string): string` |
| `diaUtil` | 32 | `diaUtil(d: Date): boolean` |
| `diasUteis` | 35 | `diasUteis(a?: string, b?: string): number` |
| `somarDiasUteis` | 49 | `somarDiasUteis(s: string, n: number): string` |
| `hojeIso` | 61 | `hojeIso(): string` |
| `horaAgora` | 62 | `horaAgora(): string` |
| `linhas` | 65 | `linhas(t?: string &#124; string[] &#124; null): string[]` |
| `extensao` | 68 | `extensao(nome: string): string` |

## lib/emailProjeto.ts

Templates HTML e assuntos de e-mail, links do portal e corpo de convite Teams.

| Função | Linha | Contrato |
| --- | --- | --- |
| `esc` | 9 | `esc(s: string)` |
| `urlDoPortal` | 12 | `urlDoPortal(): string` |
| `linkProjeto` | 16 | `linkProjeto(cod: string)` |
| `botao` | 35 | `botao(texto: string, url: string): string` |
| `montar` | 50 | `montar(e: Email): string` |
| `linhaDado` | 51 | `linhaDado([k, v]: [string, string])` |
| `dadosProjeto` | 73 | `dadosProjeto(p: Projeto): [string, string][]` |
| `emailNovoProjeto` | 79 | `emailNovoProjeto({ projeto: p }: NovoProjeto, autor: string)` |
| `emailSolicitacaoProjeto` | 93 | `emailSolicitacaoProjeto({ projeto: p, atividades, riscos }: NovoProjeto, autor: string)` |
| `emailSolicitacaoGate` | 108 | `emailSolicitacaoGate(p: Projeto, g: Gate, progresso: { feitas: number; total: number }, autor: string)` |
| `emailGateAprovado` | 128 | `emailGateAprovado(p: Projeto, g: Gate, extra: { por: string; em: string; parecer: string; proximaFase: string })` |
| `emailProjetoCriadoPeloPmo` | 153 | `emailProjetoCriadoPeloPmo({ projeto: p }: NovoProjeto, autor: string)` |
| `corpoReuniao` | 167 | `corpoReuniao(p: Projeto, a: Atividade, pauta: string, tipo?: string): string` |
| `linha` | 168 | `linha(k: string, v: string)` |
| `quandoReuniao` | 179 | `quandoReuniao(r: NovaReuniao)` |
| `emailReuniaoAlterada` | 186 | `emailReuniaoAlterada(p: Projeto, a: Atividade, antes: NovaReuniao, depois: NovaReuniao, joinUrl: string)` |
| `mudou` | 187 | `mudou(x: string, y: string)` |
| `emailProjetoExcluido` | 214 | `emailProjetoExcluido(p: Projeto, autor: string, quando: string, removidos: [string, number][], documentos: boolean)` |

## lib/gates.ts

Gera os gates ausentes conforme fase e situação atual.

| Função | Linha | Contrato |
| --- | --- | --- |
| `situacaoInicial` | 7 | `situacaoInicial(p: Projeto, fase: Fase): Gate['situacao']` |
| `gatesFaltantes` | 17 | `gatesFaltantes(p: Projeto): Gate[]` |

## lib/modeloSystech.ts

Define modelos de atividades e riscos para preencher novos projetos.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## lib/permissoes.ts

Matriz de ações por perfil de teste, leitura e persistência do papel no navegador.

| Função | Linha | Contrato |
| --- | --- | --- |
| `pode` | 34 | `pode(papel: Papel, acao: Acao): boolean` |
| `papelSalvo` | 37 | `papelSalvo(): Papel` |
| `salvarPapel` | 46 | `salvarPapel(p: Papel)` |

## lib/pessoas.ts

Catálogo padrão do piloto e funções de técnicos ativos/busca por nome.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ativos` | 15 | `ativos(lista: Tecnico[]): Tecnico[]` |
| `tecnicoPorNome` | 18 | `tecnicoPorNome(lista: Tecnico[], nome: string): Tecnico &#124; undefined` |

## lib/rascunho.ts

Lista requisitos que faltam para enviar ou ativar um rascunho.

| Função | Linha | Contrato |
| --- | --- | --- |
| `pendenciasRascunho` | 5 | `pendenciasRascunho(d: Dados, p: Projeto, hoje: string): string[]` |
| `br` | 7 | `br(s: string)` |

## lib/tema.ts

Paleta compartilhada pelas representações visuais programáticas.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## main.tsx

Importa o CSS global e monta App dentro de React.StrictMode no elemento root.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## pages/EditarProjetoPage.tsx

Formulário de dados gerais/equipe/escopo e farol; mantém código, fase e baseline fora da edição direta.

| Função | Linha | Contrato |
| --- | --- | --- |
| `paraForm` | 15 | `paraForm(p: Projeto): FormProjeto` |
| `EditarProjetoPage` | 24 | `EditarProjetoPage()` |
| `mudar` | 40 | `mudar(c: keyof FormProjeto, v: string)` |
| `salvar` | 42 | `salvar()` |

## pages/NovoProjetoPage.tsx

Cadastro em quatro etapas; rascunho, envio pelo PMO ou criação ativa pelo patrocinador; trata e-mail separado da gravação.

| Função | Linha | Contrato |
| --- | --- | --- |
| `NovoProjetoPage` | 19 | `NovoProjetoPage()` |
| `mudar` | 31 | `mudar(c: keyof FormProjeto, v: string)` |
| `usarCronogramaModelo` | 35 | `usarCronogramaModelo()` |
| `enviar` | 43 | `enviar(situacao: SituacaoCadastro)` |

## pages/PortfolioPage.tsx

Busca por código/nome/cliente/gerente, filtros de fase/aprovação e seções de projetos visíveis.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PortfolioPage` | 21 | `PortfolioPage()` |

## pages/ProjetoPage.tsx

Resolve código e aba, verifica visibilidade, mostra cabeçalho/ciclo/avisos e abre decisão de gate.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ProjetoPage` | 24 | `ProjetoPage()` |
| `irAba` | 47 | `irAba(id: string)` |
| `selecionarFase` | 48 | `selecionarFase(f: Fase &#124; null)` |
| `decidir` | 50 | `decidir(g: Gate)` |

## services/FonteDados.ts

Contrato tipado das operações comuns e opcionais de persistência.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## services/FontePiloto.ts

Implementação em memória/localStorage, documentos ilustrativos e base JSON.

| Função | Linha | Contrato |
| --- | --- | --- |
| `entrar` | 15 | `entrar()` |
| `sair` | 16 | `sair()` |
| `email` | 17 | `email()` |
| `hoje` | 18 | `hoje()` |
| `carregar` | 20 | `carregar(): Promise<Dados>` |
| `persistir` | 32 | `persistir(d: Dados)` |
| `restaurar` | 37 | `restaurar()` |
| `salvarAtividade` | 42 | `salvarAtividade()` |
| `salvarRisco` | 43 | `salvarRisco()` |
| `salvarPendencia` | 44 | `salvarPendencia()` |
| `salvarProjeto` | 45 | `salvarProjeto()` |
| `salvarGate` | 46 | `salvarGate()` |
| `criarProjeto` | 47 | `criarProjeto()` |
| `excluirProjeto` | 48 | `excluirProjeto()` |
| `criarAtividade` | 49 | `criarAtividade(_p: unknown, atv: Atividade)` |
| `excluirAtividade` | 50 | `excluirAtividade()` |
| `criarRisco` | 51 | `criarRisco(_p: unknown, r: Risco)` |
| `excluirRisco` | 52 | `excluirRisco()` |
| `criarPendencia` | 53 | `criarPendencia(_p: unknown, x: Pendencia)` |
| `excluirPendencia` | 54 | `excluirPendencia()` |
| `criarGate` | 55 | `criarGate(_p: unknown, g: Gate)` |
| `documentos` | 57 | `documentos(cod: string): Promise<PastaDocumentos[]>` |
| `enviarArquivo` | 62 | `enviarArquivo(): Promise<void>` |
| `linkBiblioteca` | 66 | `linkBiblioteca()` |

## services/FonteSharePoint.ts

Adaptador entre modelos TypeScript, listas/drive SharePoint e APIs de e-mail/calendário Graph.

| Função | Linha | Contrato |
| --- | --- | --- |
| `txt` | 29 | `txt(v: unknown): string` |
| `num` | 30 | `num(v: unknown): number` |
| `dataSp` | 32 | `dataSp(v?: string): string &#124; null` |
| `paraColunas` | 35 | `paraColunas(campos: Campos, mapa: Record<string, string>): Campos` |
| `entrar` | 77 | `entrar()` |
| `sair` | 78 | `sair()` |
| `email` | 79 | `email()` |
| `hoje` | 80 | `hoje()` |
| `preparar` | 85 | `preparar(): Promise<void>` |
| `descobrir` | 90 | `descobrir(): Promise<void>` |
| `reuniaoGravavel` | 115 | `reuniaoGravavel()` |
| `gravar` | 124 | `gravar(acao: (campos: Campos) => Promise<T>, campos: Campos): Promise<T>` |
| `patchItem` | 138 | `patchItem(k: ChaveLista, id: string &#124; undefined, campos: Campos)` |
| `postItem` | 141 | `postItem(k: ChaveLista, campos: Campos)` |
| `itens` | 145 | `itens(k: ChaveLista)` |
| `url` | 148 | `url(k: ChaveLista, id?: string)` |
| `carregar` | 152 | `carregar(): Promise<Dados>` |
| `projetoDe` | 188 | `projetoDe(f: Campos)` |
| `ordem` | 249 | `ordem(a: { codigo: string }, b: { codigo: string })` |
| `salvarAtividade` | 257 | `salvarAtividade(_cod: string, atv: Atividade, campos: Partial<Atividade>)` |
| `criarAtividade` | 260 | `criarAtividade(p: Projeto, a: Atividade): Promise<Atividade>` |
| `excluirAtividade` | 264 | `excluirAtividade(_cod: string, a: Atividade)` |
| `criarRisco` | 267 | `criarRisco(p: Projeto, r: Risco): Promise<Risco>` |
| `excluirRisco` | 274 | `excluirRisco(_cod: string, r: Risco)` |
| `criarPendencia` | 275 | `criarPendencia(p: Projeto, x: Pendencia): Promise<Pendencia>` |
| `excluirPendencia` | 281 | `excluirPendencia(_cod: string, x: Pendencia)` |
| `pastasSemProjeto` | 283 | `pastasSemProjeto(codigos: string[])` |
| `excluirPasta` | 289 | `excluirPasta(nome: string)` |
| `salvarRisco` | 293 | `salvarRisco(_cod: string, r: Risco, campos: Partial<Risco>)` |
| `salvarPendencia` | 297 | `salvarPendencia(_cod: string, p: Pendencia, campos: Partial<Pendencia>)` |
| `salvarProjeto` | 300 | `salvarProjeto(p: Projeto, campos: Partial<Projeto>)` |
| `salvarGate` | 303 | `salvarGate(p: Projeto, g: Gate, campos: Partial<Gate>)` |
| `excluirGates` | 309 | `excluirGates(ids: string[])` |
| `criarGate` | 312 | `criarGate(p: Projeto, g: Gate): Promise<Gate>` |
| `criarProjeto` | 317 | `criarProjeto({ projeto: p, atividades, riscos }: NovoProjeto)` |
| `excluirProjeto` | 341 | `excluirProjeto(d: Dados, p: Projeto, { documentos }: { documentos: boolean })` |
| `criarPasta` | 368 | `criarPasta(pai: string, nome: string)` |
| `documentos` | 377 | `documentos(cod: string): Promise<PastaDocumentos[]>` |
| `enviarArquivo` | 396 | `enviarArquivo(cod: string, pasta: string, arquivo: File)` |
| `enviarEmail` | 409 | `enviarEmail(assunto: string, html: string, para?: string): Promise<string>` |
| `corpoEvento` | 442 | `corpoEvento(r: NovaReuniao, corpoHtml: string)` |
| `d2` | 444 | `d2(n: number)` |
| `calendario` | 456 | `calendario(caminho: string, metodo: string, corpo?: unknown): Promise<T &#124; null>` |
| `criarReuniaoTeams` | 477 | `criarReuniaoTeams(r: NovaReuniao, corpoHtml: string): Promise<{ id: string; joinUrl: string }>` |
| `obterReuniaoTeams` | 484 | `obterReuniaoTeams(id: string): Promise<NovaReuniao>` |
| `atualizarReuniaoTeams` | 495 | `atualizarReuniaoTeams(id: string, r: NovaReuniao, corpoHtml: string): Promise<void>` |
| `cancelarReuniaoTeams` | 499 | `cancelarReuniaoTeams(id: string, mensagem: string): Promise<void>` |
| `linkBiblioteca` | 503 | `linkBiblioteca(cod?: string)` |

## services/auth.ts

Contrato de autenticação, implementação MSAL, autenticador fictício e tradução de erros.

| Função | Linha | Contrato |
| --- | --- | --- |
| `entrar` | 36 | `entrar(): Promise<string>` |
| `iniciar` | 41 | `iniciar(): Promise<string>` |
| `token` | 62 | `token(): Promise<string>` |
| `email` | 75 | `email()` |
| `tokenPara` | 77 | `tokenPara(escopos: string[]): Promise<string>` |
| `sair` | 91 | `sair(): Promise<void>` |
| `entrar` | 98 | `entrar()` |
| `token` | 99 | `token()` |
| `tokenPara` | 100 | `tokenPara()` |
| `email` | 101 | `email()` |
| `sair` | 102 | `sair()` |
| `explicarErroLogin` | 106 | `explicarErroLogin(e: Error): string` |

## services/criarFonte.ts

Singleton assíncrono que escolhe e importa a fonte de dados conforme configuração.

| Função | Linha | Contrato |
| --- | --- | --- |
| `criarFonte` | 12 | `criarFonte(): Promise<FonteDados>` |
| `montar` | 17 | `montar(): Promise<FonteDados>` |

## services/graph.ts

Cliente HTTP autenticado, paginação Graph e upload em blocos.

| Função | Linha | Contrato |
| --- | --- | --- |
| `pedir` | 11 | `pedir(caminho: string, opcoes: { method?: string; json?: unknown; headers?: Record<string, string> } = {}): Promise<T>` |
| `todos` | 26 | `todos(caminho: string): Promise<T[]>` |
| `get` | 37 | `get(c: string)` |
| `post` | 38 | `post(c: string, json: unknown)` |
| `patch` | 39 | `patch(c: string, json: unknown)` |
| `excluir` | 40 | `excluir(c: string)` |
| `enviar` | 43 | `enviar(caminhoDrive: string, arquivo: File): Promise<void>` |

## state/PapelContext.tsx

Provider do papel de teste e callbacks de troca/verificação.

| Função | Linha | Contrato |
| --- | --- | --- |
| `PapelProvider` | 12 | `PapelProvider({ children }: { children: ReactNode })` |
| `usePapel` | 19 | `usePapel()` |

## state/PortalContext.tsx

Carga e sincronização dos dados, comandos de domínio e coordenação de efeitos externos.

| Função | Linha | Contrato |
| --- | --- | --- |
| `testeReuniao` | 72 | `testeReuniao(): string[] &#124; null` |
| `emailPatrocinador` | 78 | `emailPatrocinador()` |
| `emailDoGp` | 79 | `emailDoGp(p: Projeto): string` |
| `destinatarios` | 84 | `destinatarios(...grupos: string[]): string` |
| `garantirGates` | 99 | `garantirGates(fonte: FonteDados, d: Dados): Promise<Dados>` |
| `assinar` | 122 | `assinar(d: Dados)` |
| `comItem` | 126 | `comItem(d: Dados, chave: ChaveItens, cod: string, codigo: string, campos: Partial<T>): Dados` |
| `PortalProvider` | 131 | `PortalProvider({ children }: { children: ReactNode })` |
| `editando` | 188 | `editando()` |
| `aoVoltar` | 219 | `aoVoltar()` |
| `projeto` | 227 | `projeto(cod: string)` |
| `salvarAtividade` | 236 | `salvarAtividade(cod, codigo, campos)` |
| `salvarRisco` | 246 | `salvarRisco(cod, codigo, campos)` |
| `salvarPendencia` | 251 | `salvarPendencia(cod, codigo, campos)` |
| `aprovarCadastro` | 256 | `aprovarCadastro(cod, parecer = '')` |
| `solicitarGate` | 259 | `solicitarGate(cod, gate)` |
| `decidirGate` | 264 | `decidirGate(cod, gate, { aprovar, parecer, congelarBaseline })` |
| `editarProjeto` | 291 | `editarProjeto(cod, campos)` |
| `criarAtividade` | 296 | `criarAtividade(cod, atv)` |
| `excluirProjeto` | 304 | `excluirProjeto(cod, opcoes)` |
| `sem` | 308 | `sem(r: Record<string, T>)` |
| `avisarExclusaoProjeto` | 315 | `avisarExclusaoProjeto(p, removidos, documentos)` |
| `submeterRascunho` | 323 | `submeterRascunho(cod, modo)` |
| `removerGatesRepetidos` | 347 | `removerGatesRepetidos(cod)` |
| `criarRisco` | 354 | `criarRisco(cod, r)` |
| `excluirRisco` | 359 | `excluirRisco(cod, codigo)` |
| `criarPendencia` | 364 | `criarPendencia(cod, x)` |
| `excluirPendencia` | 369 | `excluirPendencia(cod, codigo)` |
| `agendarReuniao` | 374 | `agendarReuniao(cod, a, r)` |
| `atualizarReuniao` | 391 | `atualizarReuniao(cod, a, r, anterior)` |
| `cancelarReuniao` | 411 | `cancelarReuniao(cod, a, mensagem)` |
| `lerReuniao` | 418 | `lerReuniao(a)` |
| `excluirAtividade` | 423 | `excluirAtividade(cod, codigo, opcoes)` |
| `criarProjeto` | 435 | `criarProjeto(novoProjeto)` |
| `avisarPmoProjeto` | 449 | `avisarPmoProjeto(novoProjeto)` |
| `avisarPmoGate` | 455 | `avisarPmoGate(cod, gate)` |
| `avisarAprovacao` | 464 | `avisarAprovacao(cod, gate, parecer)` |
| `enviarEmailCriacao` | 473 | `enviarEmailCriacao(novoProjeto)` |
| `restaurarPiloto` | 480 | `restaurarPiloto()` |
| `usePortal` | 500 | `usePortal(): PortalValor` |
| `useBloqueioSincronizacao` | 507 | `useBloqueioSincronizacao(id: string, ativo: boolean)` |

## state/ToastContext.tsx

Fila local de avisos; exibe o último e remove cada aviso após 3,8 segundos.

| Função | Linha | Contrato |
| --- | --- | --- |
| `ToastProvider` | 7 | `ToastProvider({ children }: { children: ReactNode })` |
| `useToast` | 22 | `useToast()` |

## state/useProjetosVisiveis.ts

Filtra acesso visual por equipe e divide projetos em abertos, rascunhos e encerrados.

| Função | Linha | Contrato |
| --- | --- | --- |
| `norm` | 6 | `norm(s: string)` |
| `ehMarcador` | 8 | `ehMarcador(nome: string)` |
| `membrosConhecidos` | 11 | `membrosConhecidos(projetos: Projeto[]): string[]` |
| `useProjetosVisiveis` | 20 | `useProjetosVisiveis()` |

## styles/global.css

CSS global: tokens, layout, tabelas, Gantt, ciclo, formulários, drawer, modal, toast e ajustes responsivos.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## types/models.ts

Interfaces e uniões do domínio; não realiza validação em runtime.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.

## vite-env.d.ts

Referência dos tipos Vite e declaração de VITE_AUTH_TESTE.

Arquivo de dados, estilos, declarações ou constantes; não declara funções nomeadas.
