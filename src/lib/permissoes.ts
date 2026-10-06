/**
 * Perfis de TESTE. Controlam só o que a tela mostra; quem garante a segurança de verdade
 * são as permissões do site no SharePoint (Membros / Visitantes).
 *
 * Fluxo: o PMO cadastra e conduz os projetos e solicita aprovações; o Patrocinador aprova.
 */
export type Papel = 'Patrocinador' | 'PMO' | 'Técnico';
export const PAPEIS: Papel[] = ['Patrocinador', 'PMO', 'Técnico'];

export type Acao =
  | 'criarProjeto' | 'editarProjeto' | 'excluirProjeto'
  | 'solicitarGate' | 'aprovarGate'
  | 'gerenciarAtividades'   // incluir, excluir, mudar nome/fase/datas/marco
  | 'atualizarAtividade'    // status, % e observação
  | 'editarRisco' | 'responderPendencia' | 'enviarDocumento';

const MATRIZ: Record<Papel, Acao[]> = {
  // só aprova (gates e cadastros) e visualiza; não cria, não edita, não exclui
  Patrocinador: ['aprovarGate'],
  // cadastra, edita e conduz os projetos; envia para aprovação do patrocinador; exclui projetos
  PMO: ['criarProjeto', 'editarProjeto', 'excluirProjeto', 'solicitarGate', 'gerenciarAtividades', 'atualizarAtividade', 'editarRisco', 'responderPendencia', 'enviarDocumento'],
  'Técnico': ['atualizarAtividade', 'enviarDocumento']
};

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  Patrocinador: 'Aprova gates e cadastros de projeto e visualiza os projetos',
  PMO: 'Cadastra, edita e exclui projetos, cronograma e riscos; solicita aprovação ao patrocinador',
  'Técnico': 'Atualiza status, % e observação das atividades e envia documentos'
};

/** Sigla exibida no cabeçalho conforme o perfil. */
export const SIGLA_PAPEL: Record<Papel, string> = { Patrocinador: 'PAT', PMO: 'PMO', 'Técnico': 'TO' };

export const pode = (papel: Papel, acao: Acao): boolean => MATRIZ[papel].includes(acao);

const CHAVE = 'portal-pmo-papel-teste-v2';
export function papelSalvo(): Papel {
  try {
    const p = localStorage.getItem(CHAVE) as Papel | null;
    if (p && PAPEIS.includes(p)) return p;
    // perfis antigos: GP virou PMO
    const antigo = localStorage.getItem('portal-pmo-papel-teste');
    return antigo === 'Técnico' ? 'Técnico' : 'PMO';
  } catch { return 'PMO'; }
}
export function salvarPapel(p: Papel) { try { localStorage.setItem(CHAVE, p); } catch { /* sem armazenamento */ } }
