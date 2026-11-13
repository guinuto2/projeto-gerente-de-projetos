/**
 * Teste de mutação direcionado a 25 regressões críticas (13 originais + 12 da segunda rodada de avaliação).
 * Cada defeito é introduzido SOMENTE em uma cópia temporária e deve fazer pelo menos um teste falhar.
 * Não altera os arquivos de produção nem exige autenticação/SharePoint.
 */
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const casos = [
  { id: 1, teste: 'tests/integration/visibilidade-projetos.test.tsx', nome: 'Cliente acessa projetos de outro órgão', arquivo: 'src/state/useProjetosVisiveis.ts',
    de: "return p.equipe.some(m => !!m.email && norm(m.empresa) !== 'systech' && dominio(m.email) === meuDominio);",
    para: 'return true;', grupo: 'integration' },
  { id: 2, teste: 'tests/integration/visibilidade-projetos.test.tsx', nome: 'Rascunho exposto a todos os perfis', arquivo: 'src/state/useProjetosVisiveis.ts',
    de: "if (p.situacaoCadastro === 'Rascunho') return papel === 'PMO';",
    para: "if (p.situacaoCadastro === 'Rascunho') return true;", grupo: 'integration' },
  { id: 3, teste: 'tests/unit/invariantes-negocio.test.ts', nome: 'Patrocinador exclui projeto', arquivo: 'src/lib/permissoes.ts',
    de: "Patrocinador: ['aprovarGate'],",
    para: "Patrocinador: ['aprovarGate', 'excluirProjeto'],", grupo: 'unit' },
  { id: 4, teste: 'tests/unit/invariantes-negocio.test.ts', nome: 'Técnico edita riscos', arquivo: 'src/lib/permissoes.ts',
    de: "'Técnico': ['atualizarAtividade',",
    para: "'Técnico': ['editarRisco', 'atualizarAtividade',", grupo: 'unit' },
  { id: 5, teste: 'tests/integration/publicacao-cliente-sensivel.test.ts', nome: 'Cópia do cliente inclui causa do atraso e horas', arquivo: 'src/lib/publicacaoCliente.ts',
    de: "status: a.status, percentual: a.percentual, pai: a.pai, observacao: '', dataReal: a.dataReal",
    para: "status: a.status, percentual: a.percentual, pai: a.pai, observacao: '', dataReal: a.dataReal, causaAtraso: a.causaAtraso, horasRealizadas: a.horasRealizadas",
    grupo: 'integration' },
  { id: 6, teste: 'tests/integration/publicacao-cliente-sensivel.test.ts', nome: 'Cliente vê tarefas em preparação', arquivo: 'src/lib/publicacaoCliente.ts',
    de: ".filter(a => a.status !== 'Cancelado' && a.lancada !== false)",
    para: ".filter(a => a.status !== 'Cancelado')", grupo: 'integration' },
  { id: 7, teste: 'tests/integration/relatorios-clientes.test.ts', nome: 'Status Report vulnerável a HTML/XSS', arquivo: 'src/lib/statusReport.ts',
    de: "const esc = (s: string) => (s || '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]!));",
    para: "const esc = (s: string) => (s || '');", grupo: 'integration' },
  { id: 8, teste: 'tests/integration/projeto-encerrado.test.tsx', nome: 'Projeto encerrado volta a aceitar gravações', arquivo: 'src/state/PortalContext.tsx',
    de: "if (ACOES_BLOQUEADAS_ENCERRADO.has(k) && typeof args[0] === 'string'",
    para: "if (false && ACOES_BLOQUEADAS_ENCERRADO.has(k) && typeof args[0] === 'string'", grupo: 'integration' },
  { id: 9, teste: 'tests/integration/sharepoint-simulado.test.ts', nome: 'Conflito de edição deixa de ser detectado', arquivo: 'src/services/FonteSharePoint.ts',
    de: "await this.exigirSemConflito('atividades', atv._id, atv._modificado, 'esta atividade');",
    para: '/* detecção de conflito removida */', grupo: 'integration' },
  { id: 10, teste: 'tests/unit/regras.test.ts', nome: 'Atraso deixa de exigir causa', arquivo: 'src/lib/validacoes.ts',
    de: "if (aberta(depois) && depois.termino && depois.termino < hoje && !(depois.causaAtraso || '').trim())",
    para: "if (false && aberta(depois) && depois.termino && depois.termino < hoje && !(depois.causaAtraso || '').trim())", grupo: 'unit' },
  { id: 11, teste: 'tests/unit/invariantes-negocio.test.ts', nome: '100% aceito sem status Concluído', arquivo: 'src/lib/validacoes.ts',
    de: "if (pct === 100 && depois.status !== 'Concluído' && depois.status !== 'Cancelado')",
    para: "if (false && pct === 100 && depois.status !== 'Concluído' && depois.status !== 'Cancelado')", grupo: 'unit' },
  { id: 12, teste: 'tests/unit/invariantes-negocio.test.ts', nome: 'Edital deixa de exigir contrato e assinatura', arquivo: 'src/lib/validacoes.ts',
    de: "if (f.modeloFaturamento !== 'Edital' && f.modeloFaturamento !== 'Service Entitlement') return [];",
    para: 'if (true) return [];', grupo: 'unit' },
  { id: 13, teste: 'tests/unit/invariantes-negocio.test.ts', nome: 'Aviso de sobrecarga consulta técnico errado', arquivo: 'src/lib/validacoes.ts',
    de: "(a.responsavel || '').toLowerCase() !== e",
    para: "(a.responsavel || '').toLowerCase() === e", grupo: 'unit' },
  // ---- segunda rodada: defeitos que não estavam na lista original ----
  { id: 14, teste: 'tests/integration/visibilidade-projetos.test.tsx', nome: 'Técnico vê projetos de outras equipes', arquivo: 'src/state/useProjetosVisiveis.ts',
    de: "    return p.equipe.some(m =>\n      (!!identidade.nome",
    para: "    return true || p.equipe.some(m =>\n      (!!identidade.nome", grupo: 'integration' },
  { id: 15, teste: 'tests/unit/permissoes-matriz.test.ts', nome: 'Cliente ganha permissão de enviar documentos', arquivo: 'src/lib/permissoes.ts',
    de: '  Cliente: []', para: "  Cliente: ['enviarDocumento']", grupo: 'unit' },
  { id: 16, teste: 'tests/unit/permissoes-matriz.test.ts', nome: 'Técnico ganha permissão de gerenciar o cronograma', arquivo: 'src/lib/permissoes.ts',
    de: "'Técnico': ['atualizarAtividade', 'criarSubatividade', 'enviarDocumento'],",
    para: "'Técnico': ['atualizarAtividade', 'criarSubatividade', 'enviarDocumento', 'gerenciarAtividades'],", grupo: 'unit' },
  { id: 17, teste: 'tests/unit/permissoes-matriz.test.ts', nome: 'Patrocinador ganha permissão de aprovar cadastro', arquivo: 'src/lib/permissoes.ts',
    de: "Patrocinador: ['aprovarGate'],", para: "Patrocinador: ['aprovarGate', 'aprovarCadastro'],", grupo: 'unit' },
  { id: 18, teste: 'tests/integration/relatorios-clientes.test.ts', nome: 'Relatório do cliente lista os riscos internos', arquivo: 'src/lib/statusReport.ts',
    de: "${versao === 'equipe' ? tabela('Riscos altos abertos (interno)'",
    para: "${true ? tabela('Riscos altos abertos (interno)'", grupo: 'integration' },
  { id: 19, teste: 'tests/integration/relatorios-clientes.test.ts', nome: 'Cópia do cliente vaza os e-mails da equipe', arquivo: 'src/lib/publicacaoCliente.ts',
    de: "empresa: m.empresa, email: '' }))", para: 'empresa: m.empresa, email: m.email }))', grupo: 'integration' },
  { id: 20, teste: 'tests/integration/relatorios-clientes.test.ts', nome: 'Cópia do cliente vaza o número do contrato', arquivo: 'src/lib/publicacaoCliente.ts',
    de: "contrato: '', ultimoStatusReport", para: 'contrato: p.contrato, ultimoStatusReport', grupo: 'integration' },
  { id: 21, teste: 'tests/integration/projeto-encerrado.test.tsx', nome: 'Projeto encerrado aceita reunião do Teams', arquivo: 'src/state/PortalContext.tsx',
    de: "'agendarReuniao', 'atualizarReuniao', 'cancelarReuniao', 'solicitarGate'",
    para: "'atualizarReuniao', 'cancelarReuniao', 'solicitarGate'", grupo: 'integration' },
  { id: 22, teste: 'tests/integration/projeto-encerrado.test.tsx', nome: 'Projeto encerrado aceita decisão de gate', arquivo: 'src/state/PortalContext.tsx',
    de: "'solicitarGate', 'decidirGate']);", para: "'solicitarGate']);", grupo: 'integration' },
  { id: 23, teste: 'tests/unit/avisos.test.ts', nome: 'Sino avisa quem fez a própria ação', arquivo: 'src/lib/notificacoes.ts',
    de: '&& e !== meu)', para: ')', grupo: 'unit' },
  { id: 24, teste: 'tests/unit/avisos.test.ts', nome: 'Limite de horas planejadas sobe de 8 h para 24 h por dia', arquivo: 'src/lib/validacoes.ts',
    de: 'HORAS_POR_DIA = 8', para: 'HORAS_POR_DIA = 24', grupo: 'unit' },
  { id: 25, teste: 'tests/unit/avisos.test.ts', nome: 'Aviso de horas realizadas só a partir de 100% acima (era 20%)', arquivo: 'src/lib/validacoes.ts',
    de: 'planejadas * 1.2', para: 'planejadas * 2', grupo: 'unit' },
];

const temporario = await mkdtemp(join(tmpdir(), 'central-systech-mutacoes-'));
let detectados = 0;
try {
  for (const pasta of ['src', 'tests', 'scripts']) await cp(join(raiz, pasta), join(temporario, pasta), { recursive: true });
  await cp(join(raiz, 'package.json'), join(temporario, 'package.json'));
  await symlink(join(raiz, 'node_modules'), join(temporario, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const baseline = spawnSync(process.execPath, ['scripts/run-tests.mjs'], {
    cwd: temporario, encoding: 'utf8', timeout: 60000,
  });
  if (baseline.status !== 0) throw new Error(`A suíte limpa já falha, portanto não é possível medir as mutações:\n${(baseline.stdout || '') + (baseline.stderr || '')}`);
  console.log(`Baseline: suíte original aprovada. Iniciando ${casos.length} defeitos isolados.`);
  for (const mutacao of casos) {
    const caminho = join(temporario, mutacao.arquivo);
    const original = await readFile(caminho, 'utf8');
    const qtd = original.split(mutacao.de).length - 1;
    if (qtd !== 1) throw new Error(`Mutação ${mutacao.id} inválida: trecho esperado encontrado ${qtd} vez(es) em ${mutacao.arquivo}`);
    try {
      await writeFile(caminho, original.replace(mutacao.de, mutacao.para));
      const resultado = spawnSync(process.execPath, ['scripts/run-tests.mjs', `--file=${mutacao.teste}`], {
        cwd: temporario, encoding: 'utf8', timeout: 60000,
      });
      const log = `${resultado.stdout || ''}\n${resultado.stderr || ''}`;
      const capturou = resultado.status !== 0 && /not ok \d+/.test(log);
      if (capturou) detectados++;
      console.log(`${capturou ? '✓ CAPTUROU' : '✗ ESCAPOU'}  ${String(mutacao.id).padStart(2, '0')}/${casos.length} — ${mutacao.nome}`);
      if (!capturou) {
        const trecho = log.slice(-1400);
        console.error(`  Detalhes: ${trecho || resultado.error?.message || '(nenhum)'}`);
      }
    } finally {
      await writeFile(caminho, original);
    }
  }
  console.log(`\nMutantes detectados: ${detectados}/${casos.length}.`);
  if (detectados !== casos.length) process.exitCode = 1;
} catch (e) {
  console.error((e instanceof Error ? e.message : String(e)));
  process.exitCode = 1;
} finally {
  await rm(temporario, { recursive: true, force: true });
}
