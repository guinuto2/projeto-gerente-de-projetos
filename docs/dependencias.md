# Dependências

As versões declaradas vêm de `package.json`; as resolvidas vêm do `package-lock.json` recebido. Não são uma recomendação para atualizar versões.

## Execução

| Pacote | Declarada | Resolvida no lock | Uso |
| --- | --- | --- | --- |
| `@azure/msal-browser` | `4.30.0` | `4.30.0` | Autenticação Microsoft e obtenção de tokens. |
| `react` | `^19.0.0` | `19.3.0` | Componentes, hooks, Context API e estado. |
| `react-dom` | `^19.0.0` | `19.3.0` | Montagem da árvore React no elemento root. |
| `react-router-dom` | `^6.30.0` | `6.30.6` | HashRouter, rotas, links e navegação. |

## Desenvolvimento

| Pacote | Declarada | Resolvida no lock | Uso |
| --- | --- | --- | --- |
| `@types/react` | `^19.0.0` | `19.3.0` | Tipos para APIs React. |
| `@types/react-dom` | `^19.0.0` | `19.3.0` | Tipos para montagem e APIs React DOM. |
| `@vitejs/plugin-react` | `^4.3.4` | `4.7.0` | Transformação React e integração com Vite. |
| `typescript` | `~5.7.0` | `5.7.3` | Verificação estática de tipos. |
| `vite` | `^6.2.0` | `6.4.3` | Servidor de desenvolvimento e build estático. |

## O que o projeto usa diretamente

A comunicação HTTP usa `fetch`, sem Axios. Os formulários usam estado React e validações próprias, sem React Hook Form ou Zod. Os componentes visuais e o Gantt são próprios, com CSS global; não há dependência declarada de Tailwind, shadcn/ui ou biblioteca de gráficos. O contexto usa `useState`, `useMemo`, `useCallback`, `useRef` e `useEffect`, sem Redux.

O código também utiliza APIs do navegador: `localStorage`, `sessionStorage` pelo MSAL, `structuredClone`, `File`, `Blob`, `URL.createObjectURL`, `fetch` e eventos de foco/visibilidade. As fontes Montserrat e IBM Plex Mono são carregadas externamente pelo `index.html`.

## Dependências externas à aplicação

| Recurso | Necessário quando |
| --- | --- |
| Entra ID e conta Microsoft | Autenticação no modo conectado |
| SharePoint e Microsoft Graph | Ler e gravar listas e arquivos |
| Calendário Microsoft/Teams | Agendar, editar e cancelar reuniões |
| Caixa de e-mail Microsoft | Enviar mensagens pelas ações do portal |
| Python 3.12, MkDocs 1.6.1 e Material 9.6.14 | Gerar esta documentação |

Os pacotes Python estão em `requirements-docs.txt`, separados das dependências npm. O script externo de provisionamento importa `PnP.PowerShell`; ele não faz parte do bundle React.
