/**
 * Cadastro de técnicos disponíveis para o portal.
 * TESTE: por enquanto só um arquiteto fictício. Depois virá de uma lista do SharePoint
 * (ou de um grupo do Entra ID) com os técnicos da Systech.
 */
export interface Pessoa { nome: string; email: string; funcao: 'Arquiteto' | 'Técnico'; empresa: string }

export const TECNICOS: Pessoa[] = [
  { nome: 'Arquiteto Teste', email: 'arquiteto.teste@systechtecnologia.com.br', funcao: 'Arquiteto', empresa: 'Systech' }
];

export const arquitetos = (): Pessoa[] => TECNICOS.filter(p => p.funcao === 'Arquiteto');
export const pessoaPorNome = (nome: string): Pessoa | undefined =>
  TECNICOS.find(p => p.nome.toLowerCase() === nome.trim().toLowerCase());
