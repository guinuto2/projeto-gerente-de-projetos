# Como executar o portal

Fonte: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html` e `src/config/config.ts`.

## Pré-requisitos

Use o projeto completo, com `src`, `public`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.json` e `vite.config.ts`. A pasta de documentação sozinha não executa a aplicação.

O Vite registrado no lock aceita Node `^18.0.0 || ^20.0.0 || >=22.0.0`. Para reproduzir em um ambiente compatível, use Node 22 ou superior e npm. Essa faixa vem do pacote instalado; o projeto não define `engines` próprio.

## Instalar e iniciar

No terminal, dentro da raiz do projeto:

```bash
npm ci
npm run dev
```

Abra **http://localhost:8080/**. `dev` executa `vite --port 8080`; a configuração `strictPort: true` faz o servidor falhar se a porta estiver ocupada. Encerre o processo que está usando a porta ou ajuste a configuração intencionalmente.

No PowerShell, se a execução de `npm.ps1` estiver bloqueada, use a variante do executável:

```powershell
npm.cmd ci
npm.cmd run dev
```

`npm ci` usa o lock do projeto e reinstala `node_modules`. Não dependa da pasta `node_modules` copiada de outro computador.

## Escolher o modo de dados

Em `public/config.js`, o objeto `window.PORTAL_CONFIG` é carregado antes do React. O arquivo recebido está configurado para integração; para testar localmente sem login, deixe `clientId` vazio na sua cópia de configuração:

```javascript
window.PORTAL_CONFIG = {
  clientId: ''
};
```

Sem `clientId`, `criarFonte()` escolhe `FontePiloto`. As alterações ficam no navegador. A data usada como “hoje” é a referência do JSON do piloto, não o relógio atual.

Para conectar ao SharePoint, configure `tenantId`, `clientId`, `sharepointHost`, `sitePath` e `biblioteca`. É necessário que o site tenha as listas do [dicionário](tabelas.md), que a conta tenha acesso e que o aplicativo Microsoft esteja configurado para o redirecionamento utilizado. O código calcula esse endereço como `window.location.origin + window.location.pathname`, sem o fragmento `#/...`.

Os escopos solicitados estão em [Serviços](servicos.md). O provisionamento é externo a `src`; não é executado pelo comando `npm run dev`. O portal pode criar gates faltantes durante a carga, mas não cria as listas.

## Build e prévia

```bash
npm run build
npm run preview
```

`build` executa `tsc -b && vite build`: primeiro verifica TypeScript, depois gera `dist`. `preview` serve o resultado na porta 8080. Encerre o servidor de desenvolvimento antes de usar a mesma porta. Publique os arquivos de `dist` no host da aplicação; `base: './'` gera referências relativas e `HashRouter` usa fragmentos para as rotas.

`config.js` continua sendo configuração de runtime. Alterar `public/config.js` afeta desenvolvimento e builds futuros; em uma distribuição já gerada, o arquivo correspondente é `dist/config.js`.

## Executar a documentação

A documentação usa Python e MkDocs, não os scripts npm do portal. Veja [GitHub Pages](github-pages.md).
