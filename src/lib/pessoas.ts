/**
 * Técnicos da Systech. A fonte oficial é a lista "Portal Tecnicos" do SharePoint
 * (Nome, Email, Funcao, Ativo); TECNICOS_PADRAO é usado no modo piloto e pelo script para popular a lista.
 */
import type { Tecnico } from '../types/models';

export const TECNICOS_PADRAO: Tecnico[] = [
  { nome: 'Guilherme Santos', email: 'guilherme.santos@systech.com.br', funcao: 'Técnico', ativo: true },
  { nome: 'Felipe Cunha', email: 'felipe.cunha@systechtecnologia.com.br', funcao: 'Técnico', ativo: true },
  { nome: 'Mario Junior', email: 'mario.junior@systechtecnologia.com.br', funcao: 'Técnico', ativo: true },
  { nome: 'Leonardo Costa', email: 'leonardo.costa@systechtecnologia.com.br', funcao: 'Técnico', ativo: true }
];

/** Técnicos ativos, em ordem alfabética. */
export const ativos = (lista: Tecnico[]): Tecnico[] =>
  lista.filter(t => t.ativo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

export const tecnicoPorNome = (lista: Tecnico[], nome: string): Tecnico | undefined =>
  lista.find(t => t.nome.toLowerCase() === nome.trim().toLowerCase());
