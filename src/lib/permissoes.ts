/**
 * Perfis de TESTE. Controlam só o que a tela mostra; quem garante a segurança de verdade
 * são as permissões do site no SharePoint (Membros / Visitantes).
 */
export type Papel = 'PMO' | 'GP' | 'Técnico';
export const PAPEIS: Papel[] = ['PMO', 'GP', 'Técnico'];

export type Acao =
  | 'criarProjeto' | 'editarProjeto' | 'excluirProjeto'
  | 'solicitarGate' | 'aprovarGate'
  | 'gerenciarAtividades'   // incluir, excluir, mudar nome/fase/datas/marco
  | 'atualizarAtividade'    // status, % e observação
  | 'editarRisco' | 'responderPendencia' | 'enviarDocumento';

const MATRIZ: Record<Papel, Acao[]> = {
  PMO: ['criarProjeto', 'editarProjeto', 'excluirProjeto', 'solicitarGate', 'aprovarGate', 'gerenciarAtividades', 'atualizarAtividade', 'editarRisco', 'responderPendencia', 'enviarDocumento'],
  GP: ['criarProjeto', 'editarProjeto', 'solicitarGate', 'gerenciarAtividades', 'atualizarAtividade', 'editarRisco', 'responderPendencia', 'enviarDocumento'],
  'Técnico': ['atualizarAtividade', 'enviarDocumento']
};

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  PMO: 'Tudo, inclusive aprovar ou devolver gates e excluir projetos',
  GP: 'Cadastra e edita projetos, cronograma e riscos; solicita aprovação de gates',
  'Técnico': 'Atualiza status, % e observação das atividades e envia documentos'
};

export const pode = (papel: Papel, acao: Acao): boolean => MATRIZ[papel].includes(acao);

const CHAVE = 'portal-pmo-papel-teste';
export function papelSalvo(): Papel {
  try { const p = localStorage.getItem(CHAVE) as Papel | null; return p && PAPEIS.includes(p) ? p : 'PMO'; } catch { return 'PMO'; }
}
export function salvarPapel(p: Papel) { try { localStorage.setItem(CHAVE, p); } catch { /* sem armazenamento */ } }

/** Sigla exibida no cabeçalho conforme o perfil: PMO, GP (gerente de projeto) ou TO (técnico). */
export const SIGLA_PAPEL: Record<Papel, string> = { PMO: 'PMO', GP: 'GP', 'Técnico': 'TO' };
