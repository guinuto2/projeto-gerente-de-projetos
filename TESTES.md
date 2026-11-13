# Testes automatizados — Central Systech

## Suíte ampliada com regressões críticas e testes de mutação

A suíte mantém a primeira etapa (testes unitários, renderização de componentes, TypeScript e build)
e acrescenta **testes de integração simulada**. A execução padrão (`npm test`) executa todos os grupos.

### Comandos

```bash
npm ci
npm run typecheck
npm test
npm run test:unit
npm run test:components
npm run test:integration
npm run test:mutations
npm run build
```

**Ferramentas:** Node.js 22, executor de testes nativo (`node:test`), TypeScript e ReactDOM Server.
Não foram adicionadas novas dependências. Os testes de componentes cobrem HTML renderizado no servidor,
sem eventos reais do navegador. Testes E2E poderão ser adicionados separadamente.

### Cobertura implementada

| Grupo | O que é verificado |
| --- | --- |
| Unitários | Regras de cronograma, datas, códigos, dependências, permissões, atualização de status, percentual e filtros. |
| Componentes | Renderização e acessibilidade básica de abas, filtros, KPIs, Kanban, mensagens, carregamento, gráficos e gates. |
| Integração — modelos e cronograma | Aplicação de modelos, datas úteis, subatividades, dependências, validações, gates e evolução do progresso. |
| Integração — relatórios e clientes | Status Report interno/cliente, exposição de dados, publicação de atividades, indicadores, escaping HTML e destinatários. |
| Integração — Microsoft Graph | Token, headers, métodos HTTP, paginação, mensagens de erro, download e status 429. |
| Integração — modo piloto | Carregamento, recuperação de estado, modelos, histórico, notificações, documentos e Wiki com `localStorage` simulado. |
| Integração — SharePoint | Descoberta de listas, leitura, conversão de campos, gates duplicados, atualização, conflito de edição, colunas ausentes e reuso de inicialização. |

Os arquivos estão em `tests/unit/`, `tests/components/`, `tests/integration/` e `tests/helpers/`.
`tests/helpers/fixtures.ts` utiliza somente dados fictícios.

### Regressões críticas e teste de mutação

A suíte inclui **159 testes** (94 unitários, 12 de componentes e 53 de integração simulada).
As verificações atacam diretamente 25 regressões apontadas nas duas rodadas de avaliação da suíte:

| Área | Defeito que os testes devem identificar |
| --- | --- |
| Acesso do cliente | Projetos de outros órgãos aparecem na visão do cliente. |
| Rascunhos | Técnico, Cliente ou Patrocinador vê um projeto ainda em rascunho. |
| Permissões | Patrocinador exclui projeto ou Técnico edita riscos. |
| Publicação ao cliente | Causa do atraso e horas vazam no JSON, ou tarefas não lançadas são incluídas. |
| Relatórios | Nome de usuário não escapado permite injeção de HTML no Status Report. |
| Ciclo de vida | PortalProvider aceita gravar atividade, risco, pendência ou gate em projeto encerrado. |
| Concorrência | SharePoint ignora alterações concorrentes de uma atividade. |
| Atualização | Atraso sem causa ou 100% com status aberto são aceitos. |
| Cadastro | Edital ou Service Entitlement deixam de exigir contrato e data de assinatura. |
| Planejamento | Aviso de sobrecarga usa as atividades de outro técnico. |
| **2ª rodada** — Visibilidade | Técnico vê projeto ativo de outra equipe (encerrados continuam abertos para consulta). |
| **2ª rodada** — Permissões | Qualquer combinação perfil × ação diferente da matriz esperada (ex.: Cliente envia documento, Técnico gerencia o cronograma, Patrocinador aprova cadastro). |
| **2ª rodada** — Relatórios | Versão do cliente do Status Report passa a listar riscos internos. |
| **2ª rodada** — Publicação ao cliente | E-mails da equipe ou número do contrato vazam na cópia. |
| **2ª rodada** — Ciclo de vida | Projeto encerrado aceita reunião do Teams ou decisão de gate (as 16 ações bloqueadas são conferidas). |
| **2ª rodada** — Avisos | Sino avisa quem fez a própria ação; limite de 8 h/dia ou de 20% acima das horas planejadas é alterado. |

O comando **`npm run test:mutations`** realiza o teste de mutação direcionado:

1. Copia `src/`, `tests/` e o executor para um diretório temporário isolado do código original.
2. Confirma que a suíte passa sem mutações (baseline).
3. Planta **um defeito de cada vez**, executando o grupo de testes correspondente.
4. Considera a mutação *detectada* apenas se um teste falhar de fato (`not ok`).
5. Remove o diretório temporário, sem alterar os arquivos originais.

O comando falha se um dos 25 defeitos escapar ou se o trecho a modificar tiver sido refatorado e não puder mais ser encontrado. Em caso de refatoração legítima, atualize o cenário de mutação e seus testes para a nova implementação.

**Limite:** os 25/25 demonstram detecção destas mutações específicas, não cobertura de 100% de todos os defeitos possíveis. Filtragem no React não substitui políticas e permissões efetivas do SharePoint para proteção entre clientes.

**Matriz de permissões:** `tests/unit/permissoes-matriz.test.ts` confere todas as combinações perfil × ação.
Ao mudar uma permissão de propósito, atualize a tabela `ESPERADO` do teste junto com `src/lib/permissoes.ts`.

**Sino:** a regra de destinatários fica em `src/lib/notificacoes.ts` (`destinatariosAviso`), função pura usada pelo
`PortalContext` e testada em `tests/unit/avisos.test.ts`.

**Teste estável:** o teste de publicação sensível usa valores sentinela que não aparecem por acaso (ex.: `424242`) e deixa o
horário de geração (`gerado`) fora da comparação. Antes, cerca de 4% das execuções falhavam sem erro no código.

O teste de mutação usa tempo limite de 60 s por execução, para não falhar à toa na máquina mais lenta do GitHub.

### Segurança e isolamento

- **Nenhum teste precisa de credenciais reais**, token MSAL, acesso ao Microsoft 365 ou conexão com o SharePoint.
- Os testes de Microsoft Graph substituem `fetch` por respostas em memória, sem tráfego externo.
- Os testes da `FonteSharePoint` substituem o transporte Graph por um mock; as regras da classe de mapeamento e conflito são executadas de verdade.
- Os testes da `FontePiloto` simulam `window` e `localStorage`, não alterando registros reais do navegador.
- O Node executa cada arquivo de teste isoladamente, mantendo mocks e alterações temporárias fora da aplicação.
- A suíte verifica contratos e fluxos entre módulos, **mas não garante o comportamento do SharePoint real** nem simula cliques no navegador.

### Pull Requests

São duas automações, com papéis diferentes:

| Automação | Verificação | Quando roda | Obrigatória? |
| --- | --- | --- | --- |
| `.github/workflows/testes.yml` | **`qualidade / validar`** | Todo PR para `main`, `merge_group` e manualmente | **Sim** |
| `.github/workflows/mutacoes.yml` | `mutacoes / verificar` | PRs que mexem nos arquivos vigiados, todo dia às 6h (Brasília) e manualmente | **Não** (informativa) |

**`qualidade / validar`** executa:

1. `npm ci`
2. `npm run typecheck`
3. `npm test` (todos os grupos, incluindo integração)
4. `npm run build`

Ela **não tem filtro de caminhos** de propósito: uma verificação obrigatória com filtro não roda nos PRs que não mexem
naqueles arquivos, e o GitHub fica esperando por ela, travando o merge.

**`mutacoes / verificar`** executa `npm run test:mutations` (25 defeitos deliberados em cópia temporária). Ela confere
se os testes ainda pegam os defeitos, não o código em si, e é sensível a refatorações dos trechos vigiados. Por isso
avisa, mas não trava o merge. Se um PR mexer em `src/lib/permissoes.ts`, `publicacaoCliente.ts`, `statusReport.ts`,
`validacoes.ts`, `notificacoes.ts`, `src/state/useProjetosVisiveis.ts`, `PortalContext.tsx`, `src/services/FonteSharePoint.ts`,
`tests/` ou nos scripts de teste, olhe o resultado dela antes do merge. Ao incluir um novo arquivo vigiado em
`scripts/verificar-mutacoes.mjs`, inclua também o caminho em `mutacoes.yml`.

#### Tornar obrigatória só a `qualidade / validar`

A verificação só aparece para ser escolhida depois de rodar pelo menos uma vez (abra um PR com estas automações).
Depois, no GitHub (administrador do repositório):

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. **Ruleset name:** `Proteção da main` · **Enforcement status:** Active · **Target branches:** Include default branch.
3. Marque **Require a pull request before merging** e **Require status checks to pass** → **Add checks** →
   `qualidade / validar` (**não** adicione `mutacoes / verificar`). Recomendado: **Block force pushes**.
4. Deixe a **Bypass list** vazia para valer também para administradores e clique em **Create**.

Na tela antiga (**Settings → Branches → Add branch protection rule**): padrão `main`, marque **Require a pull request
before merging** e **Require status checks to pass before merging**, escolha `qualidade / validar` e salve.

Os testes usam simulações: passar em tudo não garante o comportamento no SharePoint e no Entra reais. Antes de um deploy
importante, faça um teste manual rápido entrando como PMO, Técnico e Cliente.

### Como adicionar testes

Crie arquivos `*.test.ts` ou `*.test.tsx` no grupo correspondente. O executor
`scripts/run-tests.mjs` compila as fontes e os testes para CommonJS em um diretório temporário,
copia os arquivos JSON importados por módulos e usa `node --test`. O diretório temporário é removido
no final. O `package-lock.json`, os workflows de deploy do Firebase e os módulos de produção
não precisam ser alterados para adicionar novos casos.

O `typecheck` atual valida os arquivos da aplicação (`src/`); os testes são transpilados e executados
separadamente. A validação estática completa dos próprios arquivos de teste pode ser introduzida em
uma próxima etapa, caso sejam instaladas as tipagens correspondentes do ambiente Node.
