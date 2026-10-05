# Publicar a documentação no GitHub Pages

Esta entrega contém um workflow pronto para gerar o MkDocs e publicar o diretório `site`. Ele não compila nem publica o portal React e não executa provisionamento.

## 1. Copiar os arquivos

Na raiz do repositório, junto ao `package.json` do portal se usar o mesmo repositório, coloque:

| Caminho | Uso |
| --- | --- |
| `mkdocs.yml` | Tema, navegação, plugins e extensões |
| `requirements-docs.txt` | Versões do MkDocs e tema |
| `docs/` | Páginas Markdown |
| `.github/workflows/documentacao-pages.yml` | Geração e publicação |

Pode usar um repositório dedicado somente à documentação. O conteúdo do ZIP deve ficar na raiz desse repositório, não dentro de mais um nível de pasta. Preserve o README e as regras de gitignore existentes se integrar a outro projeto.

## 2. Conferir localmente

Windows, sem precisar ativar ambiente virtual:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-docs.txt
.\.venv\Scripts\python.exe -m mkdocs serve
```

Abra http://127.0.0.1:8000. Para gerar os arquivos estáticos:

```powershell
.\.venv\Scripts\python.exe -m mkdocs build --strict
```

Linux/macOS:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-docs.txt
.venv/bin/python -m mkdocs serve
# Após encerrar o servidor com Ctrl+C:
.venv/bin/python -m mkdocs build --strict
```

`site/` é saída gerada e não precisa entrar no Git. Os caminhos de navegação são relativos, apropriados para Pages em subdiretório.

## 3. Habilitar o Pages

No repositório, abra **Settings → Pages → Build and deployment** e selecione **GitHub Actions** como Source. O workflow usa build e deploy separados, ambiente `github-pages` e permissões de publicação no job de deploy, conforme o [guia oficial do GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 4. Enviar os arquivos

```bash
git add docs mkdocs.yml requirements-docs.txt .github/workflows/documentacao-pages.yml
git commit -m "docs: documenta arquitetura e codigo de src"
git push
```

O workflow está configurado para `main`, com filtro para os arquivos da documentação. Se usar outra branch, troque tanto `on.push.branches` quanto `jobs.deploy.if`. Para publicar manualmente, abra **Actions → Documentação MkDocs no GitHub Pages → Run workflow** na branch configurada.

## 5. Abrir o resultado

A URL fica disponível no ambiente `github-pages` e no job de deploy. Em repositório comum, o formato costuma ser `https://USUARIO.github.io/REPOSITORIO/`; em repositório de usuário/organização pode ser a raiz. Use o endereço efetivamente retornado, sem adivinhar usuário ou nome do repositório. O workflow obtém a URL real com `configure-pages` e a passa ao MkDocs pela variável `MKDOCS_SITE_URL`. Isso também permite gerar os links corretos da página 404 quando o site fica em um subdiretório.

O workflow desta entrega publica na raiz do site Pages desse repositório. Se o repositório já publica o portal ou outra documentação, integre os workflows ou use um repositório separado para evitar substituir o conteúdo do mesmo destino.

## Diagnóstico

| Sintoma | Conferir |
| --- | --- |
| Workflow não dispara | Branch e caminhos alterados; arquivo dentro de .github/workflows |
| Falha no build strict | Erro indicado no log, links e configuração MkDocs |
| Falha de deploy | Pages habilitado, permissões e regras do ambiente github-pages |
| Site antigo | Última execução e URL do deploy |
| Link da aplicação com login | Você abriu o portal React; a documentação tem fluxo separado |

Referências: [MkDocs — publicação](https://www.mkdocs.org/user-guide/deploying-your-docs/) e [MkDocs — configuração](https://www.mkdocs.org/user-guide/configuration/). A publicação remota deve ser feita ao adicionar os arquivos ao seu repositório; esta entrega não criou nem alterou um repositório GitHub.
