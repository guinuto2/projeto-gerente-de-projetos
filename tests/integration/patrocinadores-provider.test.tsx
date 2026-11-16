/** Exercita o PortalProvider real, sem autenticar nem gravar no SharePoint. */
import test from 'node:test';
import assert from 'node:assert/strict';
const React = require('react') as typeof import('react');
import { renderToStaticMarkup } from 'react-dom/server';
import { dadosTeste, projetoTeste } from '../helpers/fixtures';

Object.assign(globalThis, { window: { PORTAL_CONFIG: {}, setTimeout, clearTimeout }, localStorage: { getItem: () => null, setItem: () => undefined } });
const modCriarFonte = require.resolve('../../src/services/criarFonte');
require.cache[modCriarFonte] = { id: modCriarFonte, filename: modCriarFonte, loaded: true, exports: { criarFonte: async () => { throw new Error('Fonte real indisponível no teste'); } } } as NodeModule;
const modPapel = require.resolve('../../src/state/PapelContext');
require.cache[modPapel] = { id: modPapel, filename: modPapel, loaded: true, exports: { usePapel: () => ({ papel: 'Patrocinador VMware', semPerfil: false, definirDisponiveis: () => undefined }) } } as NodeModule;
const { PortalProvider, usePortal } = require('../../src/state/PortalContext') as typeof import('../../src/state/PortalContext');

test('Patrocinador VMware: PortalProvider filtra dados e bloqueia ações em outros tipos antes de chamar a fonte', async () => {
  const vm = projetoTeste({ codigo: 'VM-01', tipo: 'VMware' });
  const outro = projetoTeste({ codigo: 'HW-02', tipo: 'Servidores' });
  const dados = dadosTeste(vm);
  dados.projetos = [vm, outro];
  dados.atividades[vm.codigo] = []; dados.atividades[outro.codigo] = [];
  const chamadas: string[] = [];
  const fonte = new Proxy({ modo: 'piloto', hoje: () => '2026-05-20', email: () => 'patrocinador@exemplo.com' } as Record<string, unknown>, {
    get(target, key) {
      if (key in target) return target[key as string];
      return (...args: unknown[]) => { chamadas.push(`${String(key)}(${args.length})`); return Promise.resolve(); };
    },
  });
  let valor: ReturnType<typeof usePortal> | undefined;
  const Capturar = () => { valor = usePortal(); return null; };
  const original = React.useState;
  let contador = 0;
  (React as unknown as { useState: typeof React.useState }).useState = ((inicial: unknown) => {
    const [v, set] = original(inicial as never);
    contador++;
    if (contador === 1) return [fonte, set];
    if (contador === 2) return [dados, set];
    return [v, set];
  }) as typeof React.useState;
  try { renderToStaticMarkup(React.createElement(PortalProvider, null, React.createElement(Capturar))); }
  finally { (React as unknown as { useState: typeof React.useState }).useState = original; }
  assert.ok(valor);
  const chamadasAposRender = [...chamadas];
  assert.deepEqual(valor.dados.projetos.map(p => p.codigo), ['VM-01']);
  await assert.rejects(() => valor!.decidirGate('HW-02', 'G2', { aprovar: true, parecer: 'ok' }), /não tem acesso/);
  await assert.rejects(() => valor!.enviarStatusReport('HW-02'), /não tem acesso/);
  await assert.rejects(() => valor!.decidirGate('VM-01', 'G1', { aprovar: true, parecer: 'ok' }), /não pode aprovar/);
  assert.deepEqual(chamadas, chamadasAposRender, 'a fonte não pode receber uma gravação sem autorização');
});
