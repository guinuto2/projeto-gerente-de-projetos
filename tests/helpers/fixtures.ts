import type { Atividade, Dados, Projeto, Risco, Pendencia } from '../../src/types/models';

/** Dados fictícios para os testes. Não representam um cliente real nem acessam o SharePoint. */
export function projetoTeste(parcial: Partial<Projeto> = {}): Projeto {
  return {
    codigo: 'EXEMPLO-01', nome: 'Implantação de laboratório', cliente: 'Cliente Exemplo', tipo: 'Servidores',
    fase: 'Execução', farol: 'Amarelo', situacaoCadastro: 'Ativo',
    gerente: 'Gerente Exemplo', arquiteto: 'Arquiteto Exemplo', patrocinador: 'Responsável Exemplo',
    contrato: 'CONTRATO-INTERNO', inicio: '2026-05-01', terminoBaseline: '2026-06-30',
    terminoPrevisto: '2026-07-07', objetivo: 'Objetivo fictício', escopoIncluido: ['Escopo fictício'],
    escopoExcluido: [], premissas: ['Informação interna'], dependencias: [], restricoes: [], numeros: null,
    equipe: [
      { nome: 'Interno', funcao: 'Gerente', empresa: 'Systech', email: 'gerente@systech.com.br' },
      { nome: 'Externo', funcao: 'Fiscal', empresa: 'Cliente Exemplo', email: 'fiscal@cliente.example' },
    ],
    fases: [
      { fase: 'Iniciação', gate: 'G1', nome: 'G1', situacao: 'Aprovado', data: '2026-05-01', info: 'Interno' },
      { fase: 'Execução', gate: 'G3', nome: 'G3', situacao: 'Pendente', data: '2026-06-01', info: 'Interno' },
    ],
    ...parcial,
  };
}

export function atividadeTeste(parcial: Partial<Atividade> = {}): Atividade {
  return {
    codigo: '3.0', nome: 'Instalar solução', fase: 'Execução', equipe: 'Systech/Cliente',
    duracao: 4, descricao: 'Descrição interna', marco: false,
    inicio: '2026-05-11', termino: '2026-05-14', baselineInicio: '2026-05-11', baselineTermino: '2026-05-14',
    status: 'Planejado', percentual: 0, pai: '', observacao: 'Observação interna',
    ...parcial,
  };
}

export function dadosTeste(projeto = projetoTeste(), atividades: Atividade[] = []): Dados {
  return {
    referencia: '2026-05-20', projetos: [projeto], atividades: { [projeto.codigo]: atividades },
    riscos: { [projeto.codigo]: [] as Risco[] }, pendencias: { [projeto.codigo]: [] as Pendencia[] },
    decisoes: { [projeto.codigo]: [] }, documentos: { [projeto.codigo]: [] }, tecnicos: [],
  };
}
