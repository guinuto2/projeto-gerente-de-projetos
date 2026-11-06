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

/** Pessoa da lista Portal Tecnicos, com os perfis do portal (pela coluna Função). */
export interface PessoaApp { nome: string; email: string; papeis: ('PMO' | 'Patrocinador' | 'Técnico' | 'Cliente')[] }

/** Técnicos para o cadastro: os do app (função Técnico) e os da lista Portal Tecnicos, sem repetir (pelo e-mail ou nome). */
export function tecnicosParaCadastro(tabela: Tecnico[], app: PessoaApp[]): Tecnico[] {
  const soTecnicos = new Set(app.filter(p => p.papeis.includes('Técnico')).map(p => (p.email || p.nome).toLowerCase()));
  tabela = tabela.filter(t => soTecnicos.has((t.email || t.nome).toLowerCase()) || !app.some(p => (p.email || p.nome).toLowerCase() === (t.email || t.nome).toLowerCase()));
  const doApp: Tecnico[] = app.filter(p => p.papeis.includes('Técnico')).map(p => ({ nome: p.nome, email: p.email, funcao: 'Técnico', ativo: true } as Tecnico));
  const chave = (t: { nome: string; email: string }) => (t.email || t.nome).toLowerCase();
  const vistos = new Set(doApp.map(chave));
  return [...doApp, ...tabela.filter(t => !vistos.has(chave(t)) && !doApp.some(a => a.nome.toLowerCase() === t.nome.toLowerCase()))]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
/** Pessoas do app com um perfil (PMO para gerente, Patrocinador para patrocinador). */
export const pessoasComPapel = (app: PessoaApp[], papel: PessoaApp['papeis'][number]) => app.filter(p => p.papeis.includes(papel));

/** Perfis pela função na lista Portal Tecnicos: PMO/Gerente de projeto → PMO; Patrocinador; o resto (Técnico, Arquiteto) → Técnico. */
export function pessoasDaLista(lista: Tecnico[]): PessoaApp[] {
  return ativos(lista).map(t => {
    const f = (t.funcao || 'Técnico').toLowerCase();
    const papeis: PessoaApp['papeis'] = [];
    if (/pmo|gerente/.test(f)) papeis.push('PMO');
    if (/patrocinador/.test(f)) papeis.push('Patrocinador');
    if (/t[eé]cnico|arquiteto/.test(f) || !papeis.length) papeis.push('Técnico');
    return { nome: t.nome, email: (t.email || '').toLowerCase(), papeis };
  });
}
