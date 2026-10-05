# Escopo e validação

## Base analisada

- Arquivo recebido: `projeto-gerente-de-projetos(2).zip`.
- Data da análise: 05/10/2026.
- Versão declarada no package.json: `3.0.0`.
- Arquivos em src: **76**.
- Funções nomeadas localizadas para o catálogo: **336** (inclui métodos e helpers internos).

A pasta src do ZIP definitivo foi comparada byte a byte com o src.zip anterior: não houve diferenças. As configurações, dependências e esquema foram confirmados pelo ZIP definitivo.

## O que esta entrega verifica

A documentação foi construída pela leitura do código, dos modelos e do script de esquema. A geração com `python -m mkdocs build --strict` foi concluída. Links e âncoras locais do HTML foram conferidos; o build em subdiretório também foi verificado. As assinaturas e localizações no catálogo são extraídas sintaticamente com o parser TypeScript, não inferidas a partir de nomes.

Não foi realizado login Microsoft, envio de e-mail, convite, exclusão, upload ou provisionamento. A estrutura descrita é a esperada pelos arquivos, sem comprovação de que um site SharePoint remoto corresponda ao esquema. O workflow será executado quando integrado ao repositório; não há publicação remota nesta entrega.

## Manter esta documentação

Ao alterar src, revise os capítulos correspondentes, especialmente os mapeamentos de colunas, permissões de teste, cálculos e contratos. As linhas da referência correspondem ao snapshot recebido e podem mudar em versões futuras. Para atualizar as dependências documentadas, compare package.json e package-lock.json novamente.

## Rastreabilidade

| Assunto | Fonte primária |
| --- | --- |
| Arquitetura e rotas | src/main.tsx, src/App.tsx |
| Contratos do domínio | src/types/models.ts |
| Estado e sincronização | src/state/PortalContext.tsx |
| Interface | src/pages e src/components |
| Listas e mapeamentos | src/services/FonteSharePoint.ts |
| Tipos físicos das colunas | provisionamento/provisionar-portal.ps1 |
| Execução e dependências | package.json, package-lock.json, vite.config.ts |
| Configuração | src/config/config.ts, public/config.js e index.html |

## SHA-256 dos arquivos de src

Hashes permitem identificar o snapshot sem republicar o conteúdo dos arquivos.

| Arquivo | SHA-256 |
| --- | --- |
| `src/App.tsx` | `a8bfcc7624a1bc8100fde5e086478434492c3af1804b9bf150b0ce32b13a5a7e` |
| `src/components/layout/Cabecalho.tsx` | `841aa8a5133c8b46e5858824adf2f5c014dce244ff206a31f004bfc722999761` |
| `src/components/novo/EditorEquipe.tsx` | `49de3971fc6ed74bd1f649937e1656a134d8a0e347e73bd60c3331a014e6e0a6` |
| `src/components/novo/PassoCronograma.tsx` | `2d34ee7060fd9a9109488fd9254a19e742fa3c12d06e1cb9b95a5ff284d22ccd` |
| `src/components/novo/PassoDadosGerais.tsx` | `7b69dfa02329aa4f9497d73ad9ed6718a8aae6cd17f0a9e2809d4d7ddef910a1` |
| `src/components/novo/PassoEscopo.tsx` | `2893e59c3121420f01b3a6c84514491a6c2c686af9043b17fc6c37b6af270b1a` |
| `src/components/novo/PassoRiscos.tsx` | `d1892640b7eec5ea2577c4e126dfcbe7c05ba9c642d17025d4375f0ea3366f4f` |
| `src/components/novo/formulario.ts` | `a0af45fe038eb6110a0fdc9425c3f2fc383f0daa289e17f8d4a467fdf41b1cfe` |
| `src/components/portfolio/CardProjeto.tsx` | `debdcda4d8548c74a01efda2649991156bb13f860dc85466db70706c8750ee98` |
| `src/components/portfolio/EmAndamento.tsx` | `09e71103612c7734766d114986fd640150277c04a7a4c3c7bd63b9bbef5f3ab2` |
| `src/components/portfolio/IndicadoresPortfolio.tsx` | `d3c3c0be703324e8326db9605c7c7078152c003a24a1b5167e93dc0cfd74d919` |
| `src/components/portfolio/PastasSemProjeto.tsx` | `690f68fa1adc3e31051d8a6901a636c1341d1a647367d349a8cebffac7865239` |
| `src/components/portfolio/ProjetosEncerrados.tsx` | `ce1d886bf5f788e740f451848ed3dba5140e828defd43350912639595644f9c3` |
| `src/components/portfolio/ProximosMarcos.tsx` | `94746f4e611f6f1b8918c8b6c84d3f7d9809887224a4550f65b875ad979cf4a2` |
| `src/components/portfolio/Rascunhos.tsx` | `0c150afc4a60fae0069ce1c501dceefa09cc4e2490be74930b2a075d590b9b10` |
| `src/components/portfolio/TrilhaFases.tsx` | `dd73de64ae75f4a2263d1c28ef0403a6ce0a674ee650d504a8e96032a3ccac6d` |
| `src/components/projeto/AvisoRascunho.tsx` | `93ae6cbc0ebefe7288e2ca1168637709a705dd8626ca09388f85a367ac00429c` |
| `src/components/projeto/CabecalhoProjeto.tsx` | `ef4da600c170d4d379dcd64bd9e00d895fffe2ef285d675bb80df7787f5bfc0e` |
| `src/components/projeto/CicloVida.tsx` | `330292dea90ed64b4698f26c3cb5e04f56f8f85844c4ffecf80ce1ee3ea7cffe` |
| `src/components/projeto/ExcluirProjeto.tsx` | `fc46e91b303653a6bb3dfd3c83813fd06156c8f30fd53e77e6dde81c66c20a9b` |
| `src/components/projeto/IndicadoresProjeto.tsx` | `bc49e65b2bc0cdd1991f6ff8f89d57eee9c4ecd68f2eeee3633f12e8278fb38b` |
| `src/components/projeto/abas/AbaCronograma.tsx` | `a03f3d4d39500a91d1fc0f5703efe4e9dcaa4d80ea1d1c592539ee39adf57cfb` |
| `src/components/projeto/abas/AbaDecisoes.tsx` | `d32794745a34e869534d6f7a1d2c9fc95c998fb8bfa8642161febf943b84ddeb` |
| `src/components/projeto/abas/AbaDocumentos.tsx` | `ea5caf4a89dabedacb6076c3152f5e600bd28d0dce635f6c898fff73d0cb1c88` |
| `src/components/projeto/abas/AbaEscopo.tsx` | `6844a6fad2dfda3864c26ccd571aa6cfc58923ac6e6de9c89e2f8ad0e9e04e21` |
| `src/components/projeto/abas/AbaPendencias.tsx` | `70b9d84d6d31d4e23b8a322bdd814d814bf1e00830024168fe3a638324e449df` |
| `src/components/projeto/abas/AbaRiscos.tsx` | `9e43509dc10b1e37f8d87ab3ea46a038920293866240eb67f03bfbf8c6526320` |
| `src/components/projeto/abas/ExportarCsv.tsx` | `33b6134df6c9348353f242dc61cf21e1b6b21758af2074d460500eaa76ffbcc0` |
| `src/components/projeto/abas/Gantt.tsx` | `cd41eadfafd05aa5f7c885f435b46408c1571116a468f280ca189139981b76c7` |
| `src/components/projeto/abas/MatrizRiscos.tsx` | `775e3f9d18def002d3d4448ada198b807ff01c29206acd1f9a8819b7ac4871d1` |
| `src/components/projeto/editores/DecidirGate.tsx` | `995d3bcc881c93f65a9f098b2d14221538f70f1cc639dae78eb2669c59bcb652` |
| `src/components/projeto/editores/EditarAtividade.tsx` | `500ce008850162cdb30d403a16519e579df58c746525867fe76f92626fb5bbd6` |
| `src/components/projeto/editores/EditarPendencia.tsx` | `3fedc451e96647e5a9ee4b429030bac58d85df7c55e785d43fb88ea0c3beafb7` |
| `src/components/projeto/editores/EditarRisco.tsx` | `7421e2cd674395d885fdb67e40f80775d598b042398cf2497d3c3e23946bfc41` |
| `src/components/projeto/editores/ReuniaoTeams.tsx` | `28811f7891be5c6e7c5ff356702bbbbe1621f0d1ace59d4304a63f922e15b1e7` |
| `src/components/ui/Abas.tsx` | `32ff1b15fac90230214820aecf5d9fa90c4c299f68b4aa102471a70e063b6833` |
| `src/components/ui/Carregando.tsx` | `dd3db587393672fc9da8cf431becffaedeb5e34f66514e2908d62ea30af52959` |
| `src/components/ui/Chips.tsx` | `f69f5c90f9738d9962cb4eabbd124a4dbfbdefe3e9d773f96ce24ba987417872` |
| `src/components/ui/Confirmacao.tsx` | `1183d4240d336f69ebab2a58a69c1e025d08075fb0bc8d2ddce0f7a6cc2387af` |
| `src/components/ui/Drawer.tsx` | `ee7da67039198c1a2d5337069f754e7f36030c4b6c0473bc8bd4fced03a790c3` |
| `src/components/ui/Kpi.tsx` | `7edf3f1cc13076fbcf76b02ad16b3f3b92aaf80093ebda86818d31490f60f0db` |
| `src/components/ui/Losango.tsx` | `272e8de3089292c05c038e1ba8e47468c1f0de35a888c097669d2d52dbc08fdd` |
| `src/components/ui/Mensagem.tsx` | `a6ab758cab9fc0e3683033cd8ff8c37e991f9edf10f6e03dad1e199b687d7cd7` |
| `src/components/ui/Selo.tsx` | `5d2ca6236542f8122cc9a5eaccc203411f5eef2267858917244064fa7badd110` |
| `src/components/ui/Vazio.tsx` | `77c7146dea62011735f1846cf425b7e0c54349fd4979787ffe234c85a5bcb648` |
| `src/config/config.ts` | `b537415360a0150021a6cb71e6e360d90a8491ca52823df99315b802d533f0ee` |
| `src/data/piloto-trf1.json` | `3f6e441e1a12898e42e330861f0aad9e4979e4c78abbf0b04d8b492b4c076195` |
| `src/lib/calculos.ts` | `46e891d66a205fe3feab2da429b9bc4f886b57c8d0fe590031d8752f5644e8a6` |
| `src/lib/constantes.ts` | `091dd96f447d5dcd765ace4707f374c8735970e6f2797ec89970fad23796b869` |
| `src/lib/csv.ts` | `b270a4ca953536f4516b7d8023101bad32eeea12b5029fcaaae889f2156d3647` |
| `src/lib/datas.ts` | `c618315f70cb5b32fbf031910f7e15f90c2cb65c5d3d81ead3fcc54c7b2e7699` |
| `src/lib/emailProjeto.ts` | `f5d6b28e464a90e205ac132ecc34ddf36fb453024e9be1753c0dbc4157c730b7` |
| `src/lib/gates.ts` | `02bab2e99c1d2165eb80d6267ee3c82bff3ee8e83b25940565c48d26f947316f` |
| `src/lib/modeloSystech.ts` | `5baacb46f2ad4ce1c3a3fba45c1bae8f35a925d0e15aea2a9238dbc6372d00f4` |
| `src/lib/permissoes.ts` | `ef41819b92fe83670ee389fe5f8c691c8a3bb20a082234255a3986393edae82f` |
| `src/lib/pessoas.ts` | `4df60c58a3748ed5ff9ac2804bcd06127b552d86e020bba27df1d50c759db94a` |
| `src/lib/rascunho.ts` | `b9f0f2f7dc2c0144772e0b2ac30a89fd0056563fe732956b711f9187c6404434` |
| `src/lib/tema.ts` | `bd3694050528f38e6a74a1ef443e2379adbcbc8425ca662b9dff17c9d2f26d35` |
| `src/main.tsx` | `6026c3e9cca68733fa5a4e45473cad36c0b0257bad358ba9ea48d132fd836130` |
| `src/pages/EditarProjetoPage.tsx` | `e9853b145be0f5467b8c62320c3376c9ad8d0a9c851afb16c7db3fa593c5776d` |
| `src/pages/NovoProjetoPage.tsx` | `91a754c71f5b32f9e0677166df2a9095a91c2bbcbad2e000bf9899470a0d1a0d` |
| `src/pages/PortfolioPage.tsx` | `d6c96ef06fc4ab33d903d127b323758c95a2cdc48fbf99ce04ffb618015b9f1c` |
| `src/pages/ProjetoPage.tsx` | `cd6314f6ba51c660a37ba8e7fb2e47e10b9d0b9b7769449ba7568b40fce9c928` |
| `src/services/FonteDados.ts` | `3adbbbde5c77afc1f030d0400e42f86dd28a8a96c5ddc6ae9596b5384d6d771c` |
| `src/services/FontePiloto.ts` | `03c36c7c938b8f193c2cc9ff675cbccfce63abf35e1caabe9533ac8d5beb6806` |
| `src/services/FonteSharePoint.ts` | `783bc6f130bb642bf4cf9cd6443e0577f266d5de2d99882ccd59132f223c2929` |
| `src/services/auth.ts` | `7049c13b79ace82f2c4a7cded6267ecc59159c2e4e26161a3c0c1d26a647a7af` |
| `src/services/criarFonte.ts` | `fc9d0656b134477dd4d8cbae87d77ef5f200f184a3c3122e89b7e810fc852bcb` |
| `src/services/graph.ts` | `19c10bb5210f18226621e16af9f58f95e50617b0c1b5ba42e3bf8f67d9514103` |
| `src/state/PapelContext.tsx` | `16c826c76318e1bc74ab83301d8404b4007028408a36b7b245c252b96f0f0bae` |
| `src/state/PortalContext.tsx` | `f98af7e38cbee4e6f113ee5bf457194f1391be2cb054826a52979da36b357571` |
| `src/state/ToastContext.tsx` | `e385f3377732b16de91bec94f5594c372343014075608b095ca03d82c700c53c` |
| `src/state/useProjetosVisiveis.ts` | `085aee09d0b0211efd2680053df9a8cdd8ab3e0371abb04b9405a3506bb8b206` |
| `src/styles/global.css` | `19c642952b773579b85df3a39f7311f51cc5302919705045a925c928ebc518dd` |
| `src/types/models.ts` | `aa84ab2806c90be11eb6ca0afec79ec16842a725368af6012f4771402429c743` |
| `src/vite-env.d.ts` | `07b27994795c9624d69e5baf07292683461e13a634b0bd61bcedd6ac6eb220ba` |
