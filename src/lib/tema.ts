/**
 * Cores da identidade Systech usadas em estilos dinâmicos (Gantt, ciclo de vida, gates).
 * São variáveis CSS (definidas em styles/global.css) para acompanhar o modo claro/escuro.
 * Verde, amarelo e vermelho continuam reservados ao farol e aos status.
 */
export const TEMA = {
  preto: 'var(--preto)',
  grafite: 'var(--grafite)',
  cinzaMarca: 'var(--cinzaMarca)',
  vinho: 'var(--vinho)',
  vinhoClaro: 'var(--vinhoClaro)',
  vinhoBorda: 'var(--vinhoBorda)',
  texto: 'var(--texto)',
  suave: 'var(--suave)',
  borda: 'var(--borda)',
  /* cronograma */
  barraFundo: 'var(--g-barra)',
  concluido: 'var(--g-concluido)',
  emCurso: 'var(--g-emcurso)',
  /** fundo da barra em andamento: a barra inteira fica escura, a parte feita mais escura ainda */
  emCursoFundo: 'var(--g-emcursoFundo)',
  atrasado: 'var(--g-atrasado)',
  atrasadoFundo: 'var(--g-atrasadoFundo)',
  baseline: 'var(--g-baseline)',
  futuro: 'var(--g-futuro)'
} as const;

/** Tema da tela: claro ou escuro (guardado no navegador). */
export type Tema = 'claro' | 'escuro';
const CHAVE = 'portal-pmo-tema';
export function temaSalvo(): Tema {
  try { return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'; } catch { return 'claro'; }
}
export function aplicarTema(t: Tema) {
  document.documentElement.dataset.theme = t === 'escuro' ? 'dark' : 'light';
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t === 'escuro' ? 'dark' : 'light');
  try { localStorage.setItem(CHAVE, t); } catch { /* sem armazenamento */ }
}
