# Configuração

Fonte: `src/config/config.ts`, `src/services/criarFonte.ts`, `src/services/auth.ts` e `index.html`.

`config` combina defaults com `window.PORTAL_CONFIG`. `index.html` carrega `./config.js` antes de `/src/main.tsx`. O arquivo público não deve conter segredo de cliente: ele é entregue ao navegador.

| Chave | Default em src | Efeito |
| --- | --- | --- |
| `tenantId` | vazio | Diretório usado na authority; vazio usa organizations |
| `clientId` | vazio | ID do app; vazio seleciona piloto |
| `sharepointHost` | vazio | Host para descoberta do site |
| `sitePath` | `/sites/TesteProjetos` | Caminho do site |
| `biblioteca` | `Documentos de Projetos` | Nome da biblioteca procurada |
| `sincronizarSegundos` | 60 | Intervalo desejado; contexto aplica mínimo de 15 |
| `emailAoCriarProjeto` | true | Habilita aviso nos fluxos de criação/ativação |
| `emailAoAprovar` | true | Habilita aviso após aprovação pela interface |
| `emailAoSolicitarAprovacao` | true | Habilita aviso nos pedidos |
| `emailAoAlterarReuniao` | true | Resumo adicional de alteração de reunião |
| `emailAoExcluirProjeto` | true | Aviso após exclusão pela interface |
| `emailSomentePara` | vazio | Destino de teste usado pelos avisos e como fallback dos convites |
| `reuniaoSomentePara` | vazio | Destino de teste dos convites, com prioridade sobre o anterior |
| `urlPortal` | vazio | Base dos links nos e-mails; vazio usa endereço aberto |
| `emailRemetente` | vazio | Caixa compartilhada; vazio envia como conta logada |
| `emailPatrocinador` | vazio | Destinatários das solicitações e confirmações |
| `emailPmo` | vazio | Nome legado, fallback de emailPatrocinador |

Os valores da configuração corporativa recebida não foram reproduzidos nesta documentação. Os defaults acima não significam que o `public/config.js` recebido esteja vazio.

## Configuração de teste de autenticação

`import.meta.env.VITE_AUTH_TESTE === '1'` seleciona `AutenticadorTeste` no modo SharePoint. Ele devolve um token fictício; não autentica em um SharePoint real. Não habilite essa variável para executar uma integração normal.

## Links de e-mail

`urlDoPortal` usa `config.urlPortal` ou a origem/caminho da página (sem a query e o fragmento do endereço aberto); `linkProjeto` adiciona `#/projeto/` e o código escapado. A URL do site MkDocs é independente da URL da aplicação.
