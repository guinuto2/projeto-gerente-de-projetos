import { useCallback, useMemo } from 'react';
import type { Projeto } from '../types/models';
import { usePortal } from './PortalContext';
import { usePapel } from './PapelContext';

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
/** Nomes que são só marcadores no cadastro, não pessoas. */
const ehMarcador = (nome: string) => !nome.trim() || nome.startsWith('[') || /^a preencher/i.test(nome);

/** Todas as pessoas citadas nas equipes dos projetos. */
export function membrosConhecidos(projetos: Projeto[]): string[] {
  const nomes = projetos.flatMap(p => p.equipe.map(e => e.nome)).filter(n => !ehMarcador(n));
  return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * PMO e GP veem todos os projetos. O Técnico vê só aqueles em cuja equipe aparece,
 * pelo nome ou pelo e-mail da conta Microsoft logada.
 */
export function useProjetosVisiveis() {
  const { dados, usuario, email, fonte } = usePortal();
  const { papel } = usePapel();
  const membros = useMemo(() => membrosConhecidos(dados.projetos), [dados.projetos]);

  // no piloto não há conta logada: usa a primeira pessoa das equipes
  const identidade = useMemo(() => (
    fonte.modo === 'piloto' ? { nome: membros[0] || '', email: '' } : { nome: usuario, email }
  ), [fonte.modo, membros, usuario, email]);

  const podeVer = useCallback((p: Projeto) => {
    if (papel !== 'Técnico') return true;
    return p.equipe.some(m =>
      (!!identidade.nome && norm(m.nome) === norm(identidade.nome)) ||
      (!!identidade.email && !!m.email && norm(m.email) === norm(identidade.email)));
  }, [papel, identidade]);

  const todos = useMemo(() => dados.projetos.filter(podeVer), [dados.projetos, podeVer]);
  /** projetos em andamento (o que o portfólio, os indicadores e os marcos consideram) */
  const projetos = useMemo(() => todos.filter(p => p.situacaoCadastro !== 'Encerrado' && p.situacaoCadastro !== 'Rascunho'), [todos]);
  const encerrados = useMemo(() => todos.filter(p => p.situacaoCadastro === 'Encerrado'), [todos]);
  /** rascunhos: só para quem cadastra projetos (o técnico não vê) */
  const rascunhos = useMemo(() => (papel === 'Técnico' ? [] : todos.filter(p => p.situacaoCadastro === 'Rascunho')), [todos, papel]);
  return { projetos, encerrados, rascunhos, todos, podeVer, identidade, membros };
}
