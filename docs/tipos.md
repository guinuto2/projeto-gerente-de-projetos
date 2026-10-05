# Tipos TypeScript

Referência de `src/types/models.ts`. O sufixo `?` significa propriedade opcional; união com `null` permite ausência explícita. `_id` é opcional porque o piloto não cria IDs SharePoint.

## Gate

```typescript
interface Gate {
  _id?: string;
  fase: Fase;
  gate: string;
  nome: string;
  situacao: SituacaoGate;
  data: string;
  info: string;
  /** preenchidos na decisão do gate */
  aprovadoPor?: string;
  dataAprovacao?: string;
  parecer?: string;
}
```

## MembroEquipe

```typescript
interface MembroEquipe { nome: string; funcao: string; empresa: string; email: string }
```

## Tecnico

```typescript
interface Tecnico { _id?: string; nome: string; email: string; funcao: string; ativo: boolean }
```

## Numeros

```typescript
interface Numeros {
  localidades: number; hosts: number; clusters: number; hostsMover: number;
  vmsImpactadas: number; janelas: string; diasSystech: number; diasTRF1: number;
}
```

## Projeto

```typescript
interface Projeto {
  _id?: string;
  codigo: string;
  nome: string;
  cliente: string;
  tipo: string;
  fase: Fase;
  farol: 'Verde' | 'Amarelo' | 'Vermelho';
  situacaoCadastro: SituacaoCadastro;
  gerente: string;
  arquiteto: string;
  patrocinador: string;
  contrato: string;
  inicio: string;
  terminoBaseline: string;
  terminoPrevisto: string;
  objetivo: string;
  escopoIncluido: string[];
  escopoExcluido: string[];
  premissas: string[];
  dependencias: string[];
  restricoes: string[];
  numeros: Numeros | null;
  equipe: MembroEquipe[];
  fases: Gate[];
  /** itens repetidos em Portal Gates (mesmo projeto e mesmo gate) — o portal oferece remover */
  gatesRepetidos?: string[];
}
```

## Atividade

```typescript
interface Atividade {
  _id?: string;
  codigo: string;
  nome: string;
  fase: Fase;
  equipe: string;
  duracao: number;
  descricao: string;
  marco: boolean;
  inicio: string;
  termino: string;
  baselineInicio: string;
  baselineTermino: string;
  status: StatusAtividade;
  percentual: number;
  /** código da atividade macro, quando é subatividade */
  pai: string;
  observacao: string;
  /** reunião do Teams ligada à atividade (link para entrar, início local 'aaaa-mm-ddThh:mm', id do evento) */
  reuniaoUrl?: string;
  reuniaoInicio?: string;
  reuniaoId?: string;
  /** Implementação, Alinhamento, Interna ou Execução */
  reuniaoTipo?: string;
}
```

## NovaReuniao

```typescript
interface NovaReuniao {
  /** tipo de reunião (Implementação, Alinhamento, Interna, Execução) */
  tipo?: string;
  titulo: string;
  /** início local, 'aaaa-mm-ddThh:mm' (horário de Brasília) */
  inicio: string;
  duracaoMin: number;
  pauta: string;
  participantes: string[];
}
```

## Risco

```typescript
interface Risco {
  _id?: string;
  codigo: string;
  descricao: string;
  impactoProjeto: string;
  cenarios: string;
  probabilidade: Nivel;
  impacto: Nivel;
  mitigacao: string;
  contingencia: string;
  responsavel: string;
  situacao: SituacaoRisco;
}
```

## Pendencia

```typescript
interface Pendencia {
  _id?: string;
  codigo: string;
  pergunta: string;
  detalhe: string;
  impacto: string;
  situacao: 'Aberta' | 'Respondida';
  resposta?: string;
}
```

## Decisao

```typescript
interface Decisao { _id?: string; codigo: string; decisao: string; descricao: string; justificativa: string; impacto: string }
```

## Arquivo

```typescript
interface Arquivo { nome: string; url: string; modificado: string; autor: string; fase?: string }
```

## PastaDocumentos

```typescript
interface PastaDocumentos { pasta: string; url: string; arquivos: Arquivo[] }
```

## Dados

```typescript
interface Dados {
  referencia: string;
  projetos: Projeto[];
  atividades: Record<string, Atividade[]>;
  riscos: Record<string, Risco[]>;
  pendencias: Record<string, Pendencia[]>;
  decisoes: Record<string, Decisao[]>;
  documentos: Record<string, Arquivo[]>;
  /** técnicos da Systech (lista Portal Tecnicos) */
  tecnicos: Tecnico[];
}
```

## NovoProjeto

```typescript
interface NovoProjeto { projeto: Projeto; atividades: Atividade[]; riscos: Risco[] }
```

## Valores enumerados por uniões

```typescript
export type Fase = 'Iniciação' | 'Planejamento' | 'Execução' | 'Monitoramento' | 'Encerramento';
export type EstadoFase = 'Concluída' | 'Em andamento' | 'Não iniciada';
export type StatusAtividade = 'Planejado' | 'Em andamento' | 'Bloqueado' | 'Concluído' | 'Cancelado';
export type Nivel = 'Baixo' | 'Médio' | 'Alto';
export type SituacaoRisco = 'Aberto' | 'Em tratamento' | 'Mitigado' | 'Fechado';
export type SituacaoGate = 'Pendente' | 'Aguardando aprovação' | 'Aprovado' | '';
export type SituacaoCadastro = 'Rascunho' | 'Em aprovação' | 'Ativo' | 'Encerrado';
```

`FormProjeto`, `LinhaAtividade` e `LinhaRisco` em `components/novo/formulario.ts` são modelos temporários de formulário. `PortalConfig` descreve configuração, `FonteDados` descreve persistência e `PortalValor` descreve o estado/comandos do contexto. Não são tabelas adicionais.
