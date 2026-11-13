import test from 'node:test';
import assert from 'node:assert/strict';
import { copiaParaCliente, dominiosDoCliente, dominioDe } from '../../src/lib/publicacaoCliente';
import { montarStatusReport, inicioDaSemana, emailsDoCliente } from '../../src/lib/statusReport';
import { avanco, pendenciasAbertas, riscosAltos } from '../../src/lib/calculos';
import { atividadeTeste, projetoTeste, dadosTeste } from '../helpers/fixtures';

test('publicação remove dados internos, endereços, atividades canceladas e não lançadas', () => {
  const p = projetoTeste({ parceiro: 'Fornecedor interno', modeloFaturamento: 'Edital', ultimoStatusReport: '2026-05-01' });
  const d = dadosTeste(p, [
    atividadeTeste({ codigo: '3.0', nome: 'Visível', observacao: 'Confidencial', descricao: 'Detalhe interno', responsavel: 'tecnico@systech.com.br' }),
    atividadeTeste({ codigo: '3.0.1', nome: 'Não lançada', pai: '3.0', lancada: false }),
    atividadeTeste({ codigo: '3.1', nome: 'Cancelada', status: 'Cancelado' }),
  ]);
  const copia = copiaParaCliente(p, d);
  assert.deepEqual(copia.atividades.map(a => a.nome), ['Visível']);
  assert.equal(copia.atividades[0].observacao, '');
  assert.equal(copia.atividades[0].descricao, '');
  assert.equal(copia.atividades[0].responsavel, undefined);
  assert.equal(copia.projeto.contrato, '');
  assert.equal(copia.projeto.parceiro, undefined);
  assert.equal(copia.projeto.modeloFaturamento, undefined);
  assert.equal(copia.projeto.ultimoStatusReport, undefined);
  assert.equal(copia.projeto.equipe.every(m => !m.email), true);
  assert.deepEqual(copia.projeto.premissas, []);
  assert.ok(copia.projeto.fases.every(g => g.info === ''));
  assert.equal(d.projetos[0].contrato, 'CONTRATO-INTERNO', 'não pode alterar o objeto de origem');
});

test('identifica domínios de clientes sem incluir e-mails internos e sem duplicação', () => {
  const p = projetoTeste({ equipe: [
    { nome: 'A', funcao: 'Técnico', empresa: 'Systech', email: 'a@systech.com.br' },
    { nome: 'B', funcao: 'Fiscal', empresa: 'Órgão', email: 'B@Cliente.Example' },
    { nome: 'C', funcao: 'Aprovação', empresa: 'Órgão', email: 'c@cliente.example' },
    { nome: 'D', funcao: 'Fiscal', empresa: 'Órgão', email: 'd@systechtecnologia.com.br' },
  ] });
  assert.deepEqual(dominiosDoCliente(p), ['cliente.example']);
  assert.equal(dominioDe('NOME@CLIENTE.EXAMPLE'), 'cliente.example');
});

test('relatório do cliente não inclui farol, marcos, riscos internos nem atividade não lançada', () => {
  const p = projetoTeste({ farol: 'Vermelho' });
  const d = dadosTeste(p, [
    atividadeTeste({ nome: 'Atividade visível', inicio: '2026-05-19', termino: '2026-05-22', marco: true }),
    atividadeTeste({ codigo: '3.1', nome: 'Atividade interna secreta', lancada: false, inicio: '2026-05-19', termino: '2026-05-21', marco: true }),
  ]);
  d.riscos[p.codigo] = [{ codigo: 'R-1', descricao: 'Risco interno confidencial', impactoProjeto: '', cenarios: '', probabilidade: 'Alto', impacto: 'Alto', mitigacao: '', contingencia: '', responsavel: '', situacao: 'Aberto' }];
  const cliente = montarStatusReport(p, d, '2026-05-20', 'cliente').html;
  assert.ok(cliente.includes('Atividade visível'));
  assert.ok(!cliente.includes('Atividade interna secreta'));
  assert.ok(!cliente.includes('Próximos marcos'));
  assert.ok(!cliente.includes('>Farol<'));
  assert.ok(!cliente.includes('Riscos altos abertos'));
  assert.ok(!cliente.includes('Risco interno confidencial'));
  const interno = montarStatusReport(p, d, '2026-05-20', 'equipe').html;
  assert.ok(interno.includes('Próximos marcos'));
  assert.ok(interno.includes('>Farol<'));
  assert.ok(interno.includes('Riscos altos abertos'));
  assert.ok(interno.includes('Risco interno confidencial'));
});

test('relatório de status agrega progresso, atrasos e pendências do mesmo projeto', () => {
  const p = projetoTeste();
  const d = dadosTeste(p, [
    atividadeTeste({ codigo: '3.0', duracao: 2, percentual: 100, status: 'Concluído', dataReal: '2026-05-19' }),
    atividadeTeste({ codigo: '3.1', duracao: 2, percentual: 0, termino: '2026-05-10', causaAtraso: 'Janela / RDM' }),
  ]);
  d.pendencias[p.codigo].push({ codigo: 'P-1', pergunta: 'Acesso pendente', detalhe: '', impacto: 'Alto', situacao: 'Aberta', prazo: '2026-05-18' });
  assert.equal(avanco(d, p.codigo), 50);
  assert.equal(pendenciasAbertas(d, p.codigo).length, 1);
  const html = montarStatusReport(p, d, '2026-05-20', 'cliente').html;
  assert.ok(html.includes('50%'));
  assert.ok(html.includes('Janela / RDM'));
  assert.ok(html.includes('Acesso pendente'));
  assert.ok(html.includes('19/05/2026'));
});

test('relatório trata texto fornecido pelo usuário como texto, não HTML executável', () => {
  const p = projetoTeste({ nome: '<img src=x onerror=alert(1)>', cliente: 'A & B' });
  const d = dadosTeste(p, [atividadeTeste({ nome: '<script>alert(1)</script>', termino: '2026-05-10' })]);
  const html = montarStatusReport(p, d, '2026-05-20', 'cliente').html;
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('A &amp; B'));
});

test('semana do relatório começa na segunda, inclusive domingo e virada do ano', () => {
  assert.equal(inicioDaSemana('2026-05-17'), '2026-05-11');
  assert.equal(inicioDaSemana('2027-01-01'), '2026-12-28');
});

test('destinatários do cliente não incluem membros da Systech', () => {
  const p = projetoTeste();
  assert.equal(emailsDoCliente(p), 'fiscal@cliente.example');
});

test('indicador de riscos altos considera somente riscos abertos elegíveis', () => {
  const p = projetoTeste();
  const d = dadosTeste(p);
  const base = { codigo: 'R-1', descricao: 'Risco', impactoProjeto: '', cenarios: '', probabilidade: 'Alto' as const, impacto: 'Alto' as const, mitigacao: '', contingencia: '', responsavel: '' };
  d.riscos[p.codigo] = [
    { ...base, situacao: 'Aberto' },
    { ...base, codigo: 'R-2', situacao: 'Fechado' },
    { ...base, codigo: 'R-3', situacao: 'Mitigado' },
  ];
  assert.deepEqual(riscosAltos(d, p.codigo).map(r => r.codigo), ['R-1']);
});
