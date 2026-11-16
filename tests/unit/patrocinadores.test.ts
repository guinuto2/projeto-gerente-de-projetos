import test from 'node:test';
import assert from 'node:assert/strict';
import { projetoTeste, dadosTeste } from '../helpers/fixtures';
import { papelDaFuncao, pode } from '../../src/lib/permissoes';
import { dadosParaPatrocinador, emailsEquipePermitida, emailsPatrocinadoresDoProjeto, notificacaoVisivelPatrocinador, papeisPatrocinioDaFuncao, patrocinadorPodeVer, projetoVmwareOuOmnissa } from '../../src/lib/patrocinadores';
import { pessoasDaLista } from '../../src/lib/pessoas';

const pessoal = [
  { nome: 'Geral', email: 'GERAL@exemplo.com', funcao: 'Patrocinador Geral', ativo: true },
  { nome: 'VM', email: 'vm@exemplo.com', funcao: 'Patrocinador VMware', ativo: true },
  { nome: 'Duas funções', email: 'ambos@exemplo.com', funcao: 'Patrocinador VMware;Patrocinador Geral', ativo: true },
  { nome: 'Antigo', email: 'antigo@exemplo.com', funcao: 'Patrocinador', ativo: true },
  { nome: 'Inativo', email: 'inativo@exemplo.com', funcao: 'Patrocinador Geral', ativo: false },
];

test('App Roles do Entra ID mapeiam para os dois patrocinadores; role genérica antiga não herda acesso geral', () => {
  assert.equal(papelDaFuncao('PatrocinadorGeral'), 'Patrocinador Geral');
  assert.equal(papelDaFuncao('PatrocinadorVMware'), 'Patrocinador VMware');
  assert.equal(papelDaFuncao('Patrocinador Geral'), 'Patrocinador Geral');
  assert.equal(papelDaFuncao('Patrocinador_VMware'), 'Patrocinador VMware');
  assert.equal(papelDaFuncao('Patrocinador'), null);
  assert.equal(pode('Patrocinador VMware', 'editarProjeto'), false);
  assert.equal(pode('Patrocinador Geral', 'aprovarGate'), true);
});

test('classificação por Tipo não reconhece palavras no nome do projeto', () => {
  assert.equal(projetoVmwareOuOmnissa({ tipo: 'VMware' }), true);
  assert.equal(projetoVmwareOuOmnissa({ tipo: 'OMNISSA' }), true);
  assert.equal(projetoVmwareOuOmnissa({ tipo: 'Servidores' }), false);
  assert.equal(projetoVmwareOuOmnissa({ tipo: 'VMware / Servidores' }), false); // não conceder acesso por substring
});

test('sponsor VMware não recebe projeto não VMware mesmo encerrado; geral recebe', () => {
  for (const tipo of ['Backup', 'Servidores', 'Storage', 'Client', 'Rede']) {
    const p = projetoTeste({ tipo, situacaoCadastro: 'Encerrado' });
    assert.equal(patrocinadorPodeVer('Patrocinador VMware', p), false);
    assert.equal(patrocinadorPodeVer('Patrocinador Geral', p), true);
  }
  const rasc = projetoTeste({ tipo: 'VMware', situacaoCadastro: 'Rascunho' });
  assert.equal(patrocinadorPodeVer('Patrocinador VMware', rasc), false);
  assert.equal(patrocinadorPodeVer('Patrocinador Geral', rasc), false);
});

test('lista Portal Tecnicos exige funções de patrocínio explícitas e respeita atividade', () => {
  assert.deepEqual(papeisPatrocinioDaFuncao('Patrocinador VMware / Arquiteto'), ['Patrocinador VMware']);
  assert.deepEqual(papeisPatrocinioDaFuncao('Patrocinador'), []);
  const app = pessoasDaLista(pessoal);
  assert.equal(app.some(p => p.nome === 'Antigo' && p.papeis.includes('Patrocinador Geral')), false);
  assert.equal(app.some(p => p.nome === 'Inativo'), false);
  assert.deepEqual(emailsPatrocinadoresDoProjeto(projetoTeste({ tipo: 'Servidores' }), pessoal).sort(), ['ambos@exemplo.com', 'geral@exemplo.com']);
  assert.deepEqual(emailsPatrocinadoresDoProjeto(projetoTeste({ tipo: 'Omnissa' }), pessoal).sort(), ['ambos@exemplo.com', 'geral@exemplo.com', 'vm@exemplo.com']);
});

test('e-mails de equipe não repassam conteúdo de outro fabricante ao patrocinador VMware', () => {
  const p = projetoTeste({ tipo: 'Servidores', equipe: [
    { nome: 'VM', email: 'vm@exemplo.com', funcao: 'Patrocinador VMware', empresa: 'Systech' },
    { nome: 'Geral', email: 'geral@exemplo.com', funcao: 'Patrocinador Geral', empresa: 'Systech' },
    { nome: 'Técnico', email: 'tecnico@exemplo.com', funcao: 'Técnico', empresa: 'Systech' },
  ] });
  assert.deepEqual(emailsEquipePermitida(p, pessoal), ['geral@exemplo.com', 'tecnico@exemplo.com']);
});

test('dados expostos ao patrocinador VMware não incluem riscos, atividades ou documentos alheios ao escopo', () => {
  const vm = projetoTeste({ codigo: 'VM', tipo: 'VMware' });
  const outro = projetoTeste({ codigo: 'ST', tipo: 'Storage' });
  const dados = dadosTeste(vm);
  dados.projetos = [vm, outro];
  dados.atividades.ST = []; dados.riscos.ST = []; dados.pendencias.ST = [];
  dados.documentos.ST = []; dados.decisoes.ST = [];
  const restritos = dadosParaPatrocinador(dados, 'Patrocinador VMware');
  assert.deepEqual(restritos.projetos.map(x => x.codigo), ['VM']);
  for (const chave of ['atividades', 'riscos', 'pendencias', 'documentos', 'decisoes'] as const) {
    assert.equal('ST' in restritos[chave], false, chave);
  }
  assert.equal(dadosParaPatrocinador(dados, 'PMO'), dados);
});

test('notificações antigas de outro escopo ficam ocultas no sino', () => {
  const projetos = [projetoTeste({ codigo: 'VM', tipo: 'Omnissa' }), projetoTeste({ codigo: 'OUTRO', tipo: 'Rede' })];
  assert.equal(notificacaoVisivelPatrocinador({ link: '/projeto/VM' }, 'Patrocinador VMware', projetos), true);
  assert.equal(notificacaoVisivelPatrocinador({ link: '/projeto/OUTRO' }, 'Patrocinador VMware', projetos), false);
  assert.equal(notificacaoVisivelPatrocinador({ link: '/atualizar' }, 'Patrocinador VMware', projetos), false);
  assert.equal(notificacaoVisivelPatrocinador({ link: '/projeto/OUTRO' }, 'Patrocinador Geral', projetos), true);
});
