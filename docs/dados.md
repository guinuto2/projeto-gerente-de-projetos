# Modelo de dados e relacionamentos

O projeto não contém um banco SQL. No modo conectado, as “tabelas” são **sete listas do SharePoint**, além da biblioteca de documentos. No piloto, as mesmas entidades ficam em um agregado JSON e no armazenamento do navegador.

| Entidade | Persistência | Relação |
| --- | --- | --- |
| Projeto | Portal Projetos | Registro principal |
| Atividade | Portal Atividades | Muitos itens por projeto; pai pelo código da atividade |
| Risco | Portal Riscos | Muitos itens por projeto |
| Pendência | Portal Pendencias | Muitos itens por projeto |
| Gate | Portal Gates | G1–G4 por projeto |
| Decisão | Portal Decisoes | Muitos itens por projeto; leitura na interface |
| Técnico | Portal Tecnicos | Catálogo independente e opcional na leitura |
| Documento | Documentos de Projetos | Pasta com nome igual ao código do projeto |
| MembroEquipe | Texto Equipe do projeto | Cópia de nome/função/empresa/e-mail, não lookup para técnicos |

## Identificadores

`_id` é o ID do item no SharePoint, ausente no piloto. `codigo` é o identificador de negócio usado em rotas e índices em memória. Os filhos possuem lookup `Projeto`, exposto pelo Graph como `ProjetoLookupId`; o frontend converte o ID para código usando `codigoPorId`.

O script cria o lookup como obrigatório e indexado, apontando para Portal Projetos e exibindo Codigo. O código da aplicação não trata a exclusão como cascata nativa: remove itens dependentes explicitamente.

`Atividade.pai` corresponde a `AtividadePai`, texto com o código da macro no mesmo projeto. Não é lookup para outro item. O código permite criar subatividade de macro; a exclusão percorre alvo e filhos diretos.

## Agregado em memória

```typescript
interface Dados {
  referencia: string;
  projetos: Projeto[];
  atividades: Record<string, Atividade[]>;
  riscos: Record<string, Risco[]>;
  pendencias: Record<string, Pendencia[]>;
  decisoes: Record<string, Decisao[]>;
  documentos: Record<string, Arquivo[]>;
  tecnicos: Tecnico[];
}
```

As chaves de atividades/riscos/pendências/decisões/documentos são códigos de projeto. Gates ficam dentro de `Projeto.fases`; membros dentro de `Projeto.equipe`. `NovoProjeto` agrupa projeto, atividades e riscos para cadastro. Documentos conectados são buscados sob demanda e não preenchidos pela leitura geral das listas.

## Serialização

- Arrays de escopo, premissas, dependências e restrições viram texto com um item por linha.
- Equipe vira uma linha por membro no formato `Nome | Função | Empresa | Email`.
- Datas de calendário trafegam no modelo como `aaaa-mm-dd`; ao gravar colunas Data*, usa-se `T12:00:00Z`.
- `ReuniaoInicio` é texto local `aaaa-mm-ddThh:mm`; não é coluna SharePoint DateTime.
- `numeros` existe no modelo/piloto, mas a fonte conectada o define como null.

O delimitador de equipe não tem escape próprio para barras verticais inseridas nos valores. Mudanças no cadastro de técnicos não atualizam automaticamente a cópia já guardada em cada equipe.

## Biblioteca de documentos

O script cria a biblioteca com título `Documentos de Projetos` e URL relativa `DocumentosProjetos`. A fonte resolve o drive pelo título configurado e usa sua URL retornada.

| Pasta por projeto | Conteúdo esperado por fase |
| --- | --- |
| `01 · Iniciação` | Documentos de abertura |
| `02 · Planejamento` | Planejamento e baseline |
| `03 · Execução` | Evidências de implementação |
| `04 · Monitoramento e controle` | Acompanhamento |
| `05 · Encerramento` | Aceite e fechamento |

Os nomes são convenções do código, não validação do tipo do arquivo enviado. O portal lê arquivos diretamente nessas pastas.

## Operações oferecidas

| Coleção | Ler | Criar | Alterar | Excluir |
| --- | --- | --- | --- | --- |
| Projetos | Sim | Sim | Campos gerais | Sim, pelo Patrocinador na UI |
| Atividades | Sim | Sim | Estrutura/status/progresso | Sim |
| Riscos | Sim | Sim | Situação, níveis, responsável e mitigação | Sim |
| Pendências | Sim | Sim | Situação e resposta | Sim |
| Gates | Sim | Automático | Aprovação/parecer | Extras ou junto do projeto |
| Decisões | Sim | Sem editor em src | Sem editor em src | Junto da exclusão do projeto |
| Técnicos | Sim | Sem editor em src | Sem editor em src | Sem editor em src |
| Documentos | Sim | Upload | Sem editor de conteúdo em src | Pasta, em fluxos de exclusão |
