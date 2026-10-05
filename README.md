# Documentação de `src` — Portal PMO

Documentação em português baseada no ZIP `projeto-gerente-de-projetos(2).zip`, recebido em 05/10/2026. O código da aplicação não foi alterado.

## Colocar no repositório

Copie `docs/`, `mkdocs.yml`, `requirements-docs.txt` e `.github/workflows/documentacao-pages.yml` para a raiz do repositório. Inclua também as entradas de `.gitignore` sem substituir as regras existentes. Se já existir documentação, integre os arquivos antes de sobrescrever nomes iguais. Este README pode ser renomeado para `README-documentacao.md`.

## Abrir a documentação no Windows

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-docs.txt
.\.venv\Scripts\python.exe -m mkdocs serve
```

Abra http://127.0.0.1:8000. Não é necessário ativar o ambiente virtual.

## Linux e macOS

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-docs.txt
.venv/bin/python -m mkdocs serve
```

## Publicar

No GitHub, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**. Envie os arquivos para a branch `main`; o workflow gera e publica somente a documentação. Se a branch for outra, ajuste `branches` e a condição `if` do job `deploy`. O endereço aparece no job de publicação.

A publicação ainda não foi executada em um repositório. Veja [o guia completo](docs/github-pages.md).

## Conteúdo

Arquitetura; páginas e componentes; funções e serviços; instalação; dependências declaradas e resolvidas; configuração; tipos TypeScript; listas, colunas e relacionamentos SharePoint; manutenção; referência de todos os arquivos de `src`.
