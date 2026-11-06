import type { FormProjeto } from '../components/novo/formulario';
import type { PessoaApp } from './pessoas';

/** Domínio de e-mail da Systech (membros com empresa "Systech" devem usar este). */
export const DOMINIO_SYSTECH = 'systechtecnologia.com.br';
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Confere as pessoas do projeto antes de gravar: e-mails válidos (erro), e — como avisos — e-mail diferente do cadastrado na
 * lista Portal Tecnicos, domínio fora do padrão da Systech, e-mail repetido, gerente que não é PMO, arquiteto que não é técnico,
 * equipe sem técnico e pessoas que ainda não têm acesso ao site no SharePoint.
 */
export function conferirEquipe(f: FormProjeto, pessoas: PessoaApp[], usuariosSite: Set<string> | null): { erros: string[]; avisos: string[] } {
  const erros: string[] = [], avisos: string[] = [];
  const norm = (s: string) => s.trim().toLowerCase();
  const porNome = (n: string) => pessoas.find(p => norm(p.nome) === norm(n));
  const vistos = new Map<string, string>();
  // a mesma pessoa não pode aparecer duas vezes na equipe (pelo nome ou pelo e-mail)
  const repetidas = new Set<string>();
  f.equipe.forEach((m, i) => {
    const nome = norm(m.nome), email = norm(m.email || '');
    if (!nome) return;
    const outra = f.equipe.findIndex((x, k) => k !== i && (norm(x.nome) === nome || (!!email && norm(x.email || '') === email)));
    if (outra >= 0 && !repetidas.has(nome)) {
      repetidas.add(nome); repetidas.add(norm(f.equipe[outra].nome));
      erros.push(`${m.nome.trim()} aparece mais de uma vez na equipe (${m.funcao} e ${f.equipe[outra].funcao}) — deixe só uma linha`);
    }
  });
  for (const m of f.equipe) {
    const nome = m.nome.trim(); const email = norm(m.email || '');
    if (!nome) continue;
    if (email && !EMAIL_OK.test(email)) { erros.push(`${nome}: o e-mail “${m.email}” não é válido`); continue; }
    if (!email && /t[eé]cnico|arquiteto|gerente|patrocinador/i.test(m.funcao)) avisos.push(`${nome} (${m.funcao}) está sem e-mail — não vai receber avisos nem convites`);
    if (email) {
      vistos.set(email, norm(nome));
      const cad = porNome(nome);
      if (cad?.email && cad.email !== email) avisos.push(`${nome}: o e-mail na equipe (${email}) é diferente do cadastrado na lista Portal Tecnicos (${cad.email})`);
      if (norm(m.empresa || '') === 'systech' && !email.endsWith('@' + DOMINIO_SYSTECH)) avisos.push(`${nome}: e-mail fora do domínio @${DOMINIO_SYSTECH} (${email})`);
      if (usuariosSite && !usuariosSite.has(email)) avisos.push(`${nome} (${email}) ainda não tem acesso ao site no SharePoint — dê acesso para ele ver o projeto`);
    }
  }
  const gp = f.gerente.trim();
  if (gp && pessoas.some(p => p.papeis.includes('PMO')) && !pessoas.some(p => p.papeis.includes('PMO') && norm(p.nome) === norm(gp)))
    avisos.push(`o gerente de projeto (${gp}) não está como PMO na lista Portal Tecnicos`);
  const arq = f.arquiteto.trim();
  if (arq && !pessoas.some(p => p.papeis.includes('Técnico') && norm(p.nome) === norm(arq))) avisos.push(`o arquiteto (${arq}) não está como técnico na lista Portal Tecnicos`);
  if (!f.equipe.some(m => /t[eé]cnico|arquiteto/i.test(m.funcao) && m.nome.trim())) avisos.push('a equipe ainda não tem nenhum técnico nem arquiteto');
  return { erros, avisos };
}
