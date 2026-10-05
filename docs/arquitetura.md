# Arquitetura

## Camadas

| Camada | Diretório/arquivo | Responsabilidade |
| --- | --- | --- |
| Entrada | `main.tsx` | Importa CSS e monta App em StrictMode |
| Composição | `App.tsx` | Providers e HashRouter |
| Páginas | `pages/` | Telas associadas a rotas |
| Componentes | `components/` | Exibição, formulários e eventos de interface |
| Estado | `state/` | Dados compartilhados, comandos, perfis e notificações |
| Serviços | `services/` | Contrato de persistência e integrações |
| Domínio | `types/models.ts` | Interfaces e uniões TypeScript |
| Regras | `lib/` | Cálculos, datas, gates, CSV, templates e permissões de teste |
| Configuração | `config/config.ts` | Defaults e configuração runtime |
| Dados de exemplo | `data/piloto-trf1.json` | Base inicial do piloto |
| Apresentação | `styles/global.css` | Layout, componentes e adaptação visual |

## Composição do React

`main.tsx` monta `App`. A ordem dos providers é `ToastProvider`, `PapelProvider`, `PortalProvider` e, dentro deles, `HashRouter`. Assim o estado do portal pode emitir toasts; as páginas e o cabeçalho acessam os três contextos e o roteador.

O portal só libera a árvore filha depois do carregamento inicial. Enquanto aguarda, mostra `Carregando`; se a inicialização falha, mostra `Mensagem` com o erro e orientação de configuração.

## Caminho de uma alteração

1. Um editor mantém valores de formulário em `useState` e valida o preenchimento.
2. Ao salvar, chama um comando de `usePortal`, como `salvarRisco`.
3. O contexto encontra o objeto atual e aguarda o método correspondente de `FonteDados`.
4. `FonteSharePoint` converte propriedades TypeScript em colunas e chama o Graph; no piloto, esses métodos de gravação são intencionalmente vazios.
5. Após sucesso, o contexto constrói uma nova árvore de dados e atualiza a tela. No piloto, chama também `persistir()` para gravar em `localStorage`.

A atualização é predominantemente após a confirmação da gravação, não uma atualização otimista com rollback. Operações com vários itens são sequenciais e não formam uma transação.

## Escolha da fonte

`criarFonte()` guarda uma única `Promise<FonteDados>` por carregamento da página. Sem `config.clientId`, importa dinamicamente `FontePiloto`; com ele, importa `FonteSharePoint` e autenticação. Isso também reduz a disputa entre inicializações repetidas no StrictMode.

O contrato `FonteDados` permite que as mesmas páginas funcionem nos dois modos. Recursos opcionais, como e-mail e calendário, são detectados pela presença do método. A configuração é resolvida ao carregar os módulos; trocar de fonte requer recarregar a página.

## Rotas

| Rota do HashRouter | Componente | Finalidade |
| --- | --- | --- |
| `/` | `PortfolioPage` | Visão geral, filtros, rascunhos e encerrados |
| `/novo` | `NovoProjetoPage` | Cadastro em quatro etapas |
| `/editar/:codigo` | `EditarProjetoPage` | Dados gerais, equipe, escopo e farol |
| `/projeto/:codigo` | `ProjetoPage` | Detalhe, inicialmente cronograma |
| `/projeto/:codigo/:aba` | `ProjetoPage` | Uma das seis abas |
| `*` | `Navigate` | Redireciona ao portfólio |

Exemplo: `http://localhost:8080/#/projeto/PROJ-001/riscos`. O código passa por `encodeURIComponent` na montagem dos links. Uma aba desconhecida dentro de uma rota válida não possui fallback próprio e pode deixar o painel sem conteúdo.

## Sincronização

O contexto relê o SharePoint com intervalo `max(15, sincronizarSegundos)` segundos e ao retornar à aba/foco, se a última leitura tiver mais de 15 segundos. Não faz polling no piloto. Uma assinatura JSON evita substituir o estado quando nada mudou.

A leitura automática espera enquanto a página está oculta, há um formulário bloqueando a sincronização ou um campo de entrada está focado. A busca com `data-busca` é exceção. A atualização manual ignora esses bloqueios de edição, mas respeita a trava contra duas leituras simultâneas. Documentos são carregados separadamente pela aba correspondente.
