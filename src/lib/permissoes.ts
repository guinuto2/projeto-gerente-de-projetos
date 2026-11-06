/**
 * Perfis do portal. No modo conectado vêm das funções de aplicativo (App Roles) do Entra ID atribuídas
 * à pessoa no app "Portal PMO"; no piloto, de um seletor de demonstração. Eles controlam o que a tela
 * mostra; quem garante a segurança dos dados são as permissões do site no SharePoint.
 *
 * Fluxo: o PMO cadastra e conduz os projetos e solicita aprovações; o Patrocinador aprova.
 */
export type Papel = 'Patrocinador' | 'PMO' | 'Técnico' | 'Cliente';
export const PAPEIS: Papel[] = ['Patrocinador', 'PMO', 'Técnico', 'Cliente'];

export type Acao =
  | 'criarProjeto' | 'editarProjeto' | 'excluirProjeto'
  | 'solicitarGate' | 'aprovarGate'
  | 'aprovarCadastro'       // aprovar o cadastro de um projeto (G1)
  | 'gerenciarAtividades'   // incluir, excluir, mudar nome/fase/datas/marco
  | 'atualizarAtividade'    // status, % e observação
  | 'criarSubatividade'     // incluir subatividade dentro de uma atividade (atualização semanal)
  | 'editarRisco' | 'responderPendencia' | 'enviarDocumento';

const MATRIZ: Record<Papel, Acao[]> = {
  // só aprova os gates G2 a G4 e visualiza; não cria, não edita, não exclui
  Patrocinador: ['aprovarGate'],
  // cadastra, edita e conduz os projetos; envia para aprovação do patrocinador; exclui projetos
  PMO: ['criarProjeto', 'editarProjeto', 'excluirProjeto', 'aprovarCadastro', 'solicitarGate', 'gerenciarAtividades', 'atualizarAtividade', 'criarSubatividade', 'editarRisco', 'responderPendencia', 'enviarDocumento'],
  'Técnico': ['atualizarAtividade', 'criarSubatividade', 'enviarDocumento'],
  // só consulta os projetos do seu órgão: atividades, dashboard e cronograma
  Cliente: []
};

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  Patrocinador: 'Aprova os gates G2 a G4 e visualiza os projetos',
  PMO: 'Cria projetos (já ativos), aprova cadastros de outros, edita e exclui; solicita os gates G2 a G4 ao patrocinador',
  'Técnico': 'Atualiza as atividades, inclui subatividades e envia documentos',
  Cliente: 'Acompanha os projetos do seu órgão: atividades, dashboard e cronograma'
};

/** Sigla exibida no cabeçalho conforme o perfil. */
export const SIGLA_PAPEL: Record<Papel, string> = { Patrocinador: 'PAT', PMO: 'PMO', 'Técnico': 'TO', Cliente: 'CLI' };

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

/** Converte o valor da função do Entra ID (App Role) no perfil do portal. Valores desconhecidos são ignorados. */
export function papelDaFuncao(valor: string): Papel | null {
  const v = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return v === 'pmo' ? 'PMO' : v === 'patrocinador' ? 'Patrocinador' : v === 'tecnico' ? 'Técnico' : v === 'cliente' ? 'Cliente' : null;
}
