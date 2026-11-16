/** Escopo de projetos dos perfis de patrocínio. Não substitui autorização no SharePoint. */
import type { Dados, Notificacao, Projeto, Tecnico } from '../types/models';
import type { Papel } from './permissoes';

export type PapelPatrocinador = 'Patrocinador Geral' | 'Patrocinador VMware';
export const ehPatrocinador = (papel: Papel): papel is PapelPatrocinador =>
  papel === 'Patrocinador Geral' || papel === 'Patrocinador VMware';

const normalizar = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Usa exclusivamente o campo Tipo do projeto, não procura palavras no nome/cliente. */
export function projetoVmwareOuOmnissa(p: Pick<Projeto, 'tipo'>): boolean {
  return ['vmware', 'omnissa'].includes(normalizar(p.tipo));
}

export function patrocinadorPodeVer(papel: PapelPatrocinador, p: Pick<Projeto, 'tipo' | 'situacaoCadastro'>): boolean {
  if (p.situacaoCadastro === 'Rascunho') return false;
  return papel === 'Patrocinador Geral' || projetoVmwareOuOmnissa(p);
}

/** Papéis explicitamente cadastrados na coluna Funcao de Portal Tecnicos. "Patrocinador" genérico não atribui acesso amplo. */
export function papeisPatrocinioDaFuncao(funcao: string): PapelPatrocinador[] {
  const partes = normalizar(funcao).split(/[,;|/]+/).map(f => f.trim());
  return (['Patrocinador Geral', 'Patrocinador VMware'] as const).filter(papel =>
    partes.includes(normalizar(papel)));
}

/** Destinatários do patrocínio: só pessoas ativas com função explícita e escopo compatível.
 * A equipe do projeto, isoladamente, não autoriza receber informações de projetos alheios ao escopo.
 */
export function emailsPatrocinadoresDoProjeto(projeto: Projeto, pessoas: Tecnico[]): string[] {
  const encontrados = pessoas.filter(p => p.ativo && p.email && papeisPatrocinioDaFuncao(p.funcao)
    .some(role => patrocinadorPodeVer(role, projeto)));
  return [...new Set(encontrados.map(p => p.email.trim().toLowerCase()))];
}

/** Impede que avisos antigos de projetos de outras tecnologias sejam exibidos no sino do patrocinador restrito. */
export function notificacaoVisivelPatrocinador(n: Pick<Notificacao, 'link'>, papel: Papel, projetos: Projeto[]): boolean {
  if (!ehPatrocinador(papel)) return true;
  const match = /^\/projeto\/([^/?#]+)(?:\/|$)/.exec(n.link || '');
  if (!match) return papel === 'Patrocinador Geral'; // links sem projeto são descartados no perfil restrito
  let codigo: string;
  try { codigo = decodeURIComponent(match[1]); } catch { return false; }
  const projeto = projetos.find(p => p.codigo === codigo);
  return !!projeto && patrocinadorPodeVer(papel, projeto);
}

/** Exclui patrocinadores incompatíveis da cópia de e-mails enviada à equipe,
 * inclusive quando estiverem cadastrados como membro em um projeto antigo. */
export function emailsEquipePermitida(projeto: Projeto, pessoas: Tecnico[]): string[] {
  const vmware = new Set(pessoas.filter(t => t.ativo && t.email &&
    papeisPatrocinioDaFuncao(t.funcao).includes('Patrocinador VMware') &&
    !papeisPatrocinioDaFuncao(t.funcao).includes('Patrocinador Geral'))
    .map(t => t.email.toLowerCase()));
  return projeto.equipe.filter(m => {
    if (!m.email) return false;
    if (!projetoVmwareOuOmnissa(projeto) && vmware.has(m.email.toLowerCase())) return false;
    if (/patrocinador/i.test(m.funcao)) return emailsPatrocinadoresDoProjeto(projeto, pessoas).includes(m.email.toLowerCase());
    return true;
  }).map(m => m.email);
}

/** A camada React recebe apenas os registros compatíveis com o papel de patrocínio.
 * IMPORTANTE: o Graph ainda precisa das permissões adequadas na origem de dados. */
export function dadosParaPatrocinador(dados: Dados, papel: Papel): Dados {
  if (!ehPatrocinador(papel)) return dados;
  const projetos = dados.projetos.filter(p => patrocinadorPodeVer(papel, p));
  const codigos = new Set(projetos.map(p => p.codigo));
  const manter = <T>(fonte: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(fonte).filter(([codigo]) => codigos.has(codigo)));
  return { ...dados, projetos, atividades: manter(dados.atividades), riscos: manter(dados.riscos),
    pendencias: manter(dados.pendencias), decisoes: manter(dados.decisoes), documentos: manter(dados.documentos) };
}
