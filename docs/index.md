# Portal PMO — documentação da pasta src

O Portal PMO é uma aplicação React e TypeScript para acompanhar projetos, cronogramas, riscos, pendências, documentos e aprovações. O navegador pode trabalhar com dados de demonstração ou com listas e uma biblioteca do SharePoint, acessadas pelo Microsoft Graph.

Esta documentação descreve a implementação recebida em **05/10/2026**, no arquivo `projeto-gerente-de-projetos(2).zip`. O `package.json` declara a versão **3.0.0**; o nome de ZIP usado anteriormente não foi tratado como versão oficial do código.

## Caminhos de leitura

| Quero entender… | Página |
| --- | --- |
| Instalação e execução | [Executar o portal](execucao.md) |
| Organização e fluxo de dados | [Arquitetura](arquitetura.md) |
| Cada tela e componente | [Interface](interface.md) |
| Operações disponíveis pelo contexto | [Estado e funções](estado.md) |
| Autenticação, SharePoint, e-mail e Teams | [Serviços](servicos.md) |
| Fórmulas e regras do negócio | [Regras](regras.md) |
| Tabelas e seus campos | [Dicionário SharePoint](tabelas.md) |
| Um arquivo específico | [Referência de src](referencia.md) |
| Publicar este material | [GitHub Pages](github-pages.md) |

## Escopo

O foco é `src`. `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `public/config.js` e o script de provisionamento foram consultados apenas para confirmar execução, integração e esquema de dados. Esta entrega não inclui uma cópia dos dados do piloto, das configurações corporativas ou do código completo da aplicação.

A documentação pode ser publicada independentemente do portal. Não precisa de login Microsoft, acesso ao SharePoint nem execução do provisionamento.
