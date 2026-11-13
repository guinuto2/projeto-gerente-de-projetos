import test from 'node:test';
import assert from 'node:assert/strict';
import { copiaParaCliente } from '../../src/lib/publicacaoCliente';
import { dadosTeste, projetoTeste, atividadeTeste } from '../helpers/fixtures';

test('segurança: cópia publicada ao cliente nunca inclui causa de atraso, horas ou dados operacionais internos', () => {
  const p = projetoTeste({ nome: 'Entrega externa' });
  const atividade = atividadeTeste({
    causaAtraso: 'MOTIVO_INTERNO_SENSIVEL', horasRealizadas: 424242, horasPlanejadas: 313131,
    observacao: 'OBSERVACAO_SENSIVEL', descricao: 'DETALHE_SENSIVEL',
    realizado: 'RELATORIO_INTERNO_SENSIVEL', atualizadoPor: 'RESPONSAVEL_INTERNO',
  });
  const d = dadosTeste(p, [atividade]);
  const copia = copiaParaCliente(p, d);
  assert.equal(copia.atividades.length, 1);
  const enviado = copia.atividades[0] as unknown as Record<string, unknown>;
  for (const campo of ['causaAtraso', 'horasRealizadas', 'horasPlanejadas', 'realizado', 'atualizadoPor', 'responsavel']) {
    assert.equal(Object.prototype.hasOwnProperty.call(enviado, campo), false, `vazou a propriedade ${campo}`);
  }
  // O horário de geração muda a cada execução e pode conter qualquer número: fica fora da comparação.
  const { gerado: _gerado, ...semHorario } = copia;
  const serializado = JSON.stringify(semHorario);
  for (const segredo of ['MOTIVO_INTERNO_SENSIVEL', '424242', '313131', 'OBSERVACAO_SENSIVEL', 'DETALHE_SENSIVEL', 'RELATORIO_INTERNO_SENSIVEL', 'RESPONSAVEL_INTERNO']) {
    assert.equal(serializado.includes(segredo), false, `vazamento de ${segredo}`);
  }
  assert.equal(d.atividades[p.codigo][0].causaAtraso, 'MOTIVO_INTERNO_SENSIVEL', 'a fonte não deve ser alterada');
});

test('segurança: cliente não recebe subatividades ainda em preparação (lancada=false)', () => {
  const p = projetoTeste();
  const a = atividadeTeste({ codigo: '3.0', lancada: true });
  const naoLancada = atividadeTeste({ codigo: '3.0.1', pai: '3.0', lancada: false, nome: 'TAREFA_EM_PREPARACAO_SIGILOSA' });
  const d = dadosTeste(p, [a, naoLancada]);
  const copia = copiaParaCliente(p, d);
  assert.deepEqual(copia.atividades.map(x => x.codigo), ['3.0']);
  assert.equal(JSON.stringify(copia).includes('TAREFA_EM_PREPARACAO_SIGILOSA'), false);
});
