import test from 'node:test';
import assert from 'node:assert/strict';
import { pode, PAPEIS, type Acao, type Papel } from '../../src/lib/permissoes';

/**
 * Matriz completa: cada combinação de perfil × ação é conferida, permitida ou negada.
 * Qualquer permissão nova (ou retirada) faz este teste falhar até a tabela abaixo ser atualizada de propósito.
 */
const TODAS_AS_ACOES: Acao[] = [
  'criarProjeto', 'editarProjeto', 'excluirProjeto', 'solicitarGate', 'aprovarGate', 'aprovarCadastro',
  'gerenciarAtividades', 'atualizarAtividade', 'criarSubatividade', 'editarRisco', 'responderPendencia', 'enviarDocumento',
];

const ESPERADO: Record<Papel, Acao[]> = {
  PMO: ['criarProjeto', 'editarProjeto', 'excluirProjeto', 'aprovarCadastro', 'solicitarGate', 'gerenciarAtividades',
    'atualizarAtividade', 'criarSubatividade', 'editarRisco', 'responderPendencia', 'enviarDocumento'],
  Patrocinador: ['aprovarGate'],
  'Técnico': ['atualizarAtividade', 'criarSubatividade', 'enviarDocumento'],
  Cliente: [],
};

test('matriz cobre todos os perfis existentes', () => {
  assert.deepEqual([...PAPEIS].sort(), Object.keys(ESPERADO).sort());
});

for (const papel of Object.keys(ESPERADO) as Papel[]) {
  for (const acao of TODAS_AS_ACOES) {
    const permitido = ESPERADO[papel].includes(acao);
    test(`permissão: ${papel} ${permitido ? 'PODE' : 'NÃO pode'} ${acao}`, () => {
      assert.equal(pode(papel, acao), permitido);
    });
  }
}

test('segurança: Cliente não tem nenhuma permissão de alteração', () => {
  assert.deepEqual(TODAS_AS_ACOES.filter(a => pode('Cliente', a)), []);
});
