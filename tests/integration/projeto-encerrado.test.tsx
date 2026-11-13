/** Teste de integração do guard efetivo no PortalProvider com fonte isolada. */
import test from 'node:test';
import assert from 'node:assert/strict';
const React = require('react') as typeof import('react');
import { renderToStaticMarkup } from 'react-dom/server';
import { dadosTeste, projetoTeste, atividadeTeste } from '../helpers/fixtures';

// Não chama o login nem consulta o SharePoint. O carregamento por efeito não roda em SSR.
Object.assign(globalThis, { window: { PORTAL_CONFIG: {} }, localStorage: { getItem: () => null, setItem: () => undefined } });
const criarFonteMod = require.resolve('../../src/services/criarFonte');
require.cache[criarFonteMod] = { id: criarFonteMod, filename: criarFonteMod, loaded: true, exports: { criarFonte: async () => { throw new Error('Não acessar a fonte real'); } } } as NodeModule;
const { PortalProvider, usePortal } = require('../../src/state/PortalContext') as typeof import('../../src/state/PortalContext');

test('projeto encerrado: o PortalProvider rejeita todas as operações de gravação sem chamar a fonte', async () => {
  const encerrado = projetoTeste({ situacaoCadastro: 'Encerrado' });
  const a = atividadeTeste();
  const dados = dadosTeste(encerrado, [a]);
  const operacoesChamadas: string[] = [];
  const fonte = new Proxy({
    modo: 'piloto', modoCliente: false, hoje: () => '2026-05-20', email: () => '', reuniaoGravavel: () => true, tarefasGravaveis: () => true,
  } as Record<string, unknown>, {
    get(target, key) {
      if (key in target) return target[key as string];
      return (...args: unknown[]) => { operacoesChamadas.push(`${String(key)}:${args.length}`); return Promise.resolve(); };
    },
  });
  let valor: ReturnType<typeof usePortal> | undefined;
  const Capturar = () => { valor = usePortal(); return null; };
  const useStateOriginal = React.useState;
  let contador = 0;
  // Injeta fonte e dados exclusivamente nos dois primeiros estados do PortalProvider.
  (React as unknown as { useState: typeof React.useState }).useState = ((inicial: unknown) => {
    const [v, set] = useStateOriginal(inicial as never);
    contador++;
    if (contador === 1) return [fonte, set];
    if (contador === 2) return [dados, set];
    return [v, set];
  }) as typeof React.useState;
  try {
    renderToStaticMarkup(React.createElement(PortalProvider, null, React.createElement(Capturar)));
  } finally {
    (React as unknown as { useState: typeof React.useState }).useState = useStateOriginal;
  }
  assert.ok(valor, 'o Provider deve fornecer as ações reais');
  const operacoes = [
    ['salvarAtividade', [encerrado.codigo, a.codigo, { percentual: 50 }]],
    ['criarAtividade', [encerrado.codigo, a]],
    ['excluirAtividade', [encerrado.codigo, a.codigo]],
    ['atualizarSemanal', [encerrado.codigo, a.codigo, { percentual: 50 }]],
    ['salvarRisco', [encerrado.codigo, 'R1', {}]],
    ['criarRisco', [encerrado.codigo, {}]],
    ['excluirRisco', [encerrado.codigo, 'R1']],
    ['salvarPendencia', [encerrado.codigo, 'P1', {}]],
    ['criarPendencia', [encerrado.codigo, {}]],
    ['excluirPendencia', [encerrado.codigo, 'P1']],
    ['solicitarGate', [encerrado.codigo, 'G3']],
    ['decidirGate', [encerrado.codigo, 'G4', { aprovar: true, parecer: '' }]],
    ['lancarTarefas', [encerrado.codigo, ['3.0']]],
    ['agendarReuniao', [encerrado.codigo, a.codigo, {}]],
    ['atualizarReuniao', [encerrado.codigo, a.codigo, {}]],
    ['cancelarReuniao', [encerrado.codigo, a.codigo]],
  ] as const;
  // As 16 ações que o portal bloqueia em projeto encerrado: tirar qualquer uma da lista do portal faz este teste falhar.
  assert.equal(operacoes.length, 16);
  for (const [nome, args] of operacoes) {
    const acao = (valor as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[nome];
    await assert.rejects(() => acao(...args), /encerrado.*somente leitura/i, nome);
  }
  assert.deepEqual(operacoesChamadas, [], 'não pode fazer nenhuma operação na fonte');
});
