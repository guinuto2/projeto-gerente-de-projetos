/** Executor de testes com Node.js + TypeScript, sem novas dependências ou serviços externos. */
import { readdir, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

async function arquivos(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entradas.map(entrada => {
    const caminho = join(dir, entrada.name);
    return entrada.isDirectory() ? arquivos(caminho) : [caminho];
  }))).flat().sort();
}

const grupo = process.argv.includes('--unit') ? 'unit' : process.argv.includes('--components') ? 'components' : process.argv.includes('--integration') ? 'integration' : null;
const pastaTestes = join(raiz, 'tests', grupo || '');
const somente = process.argv.find(p => p.startsWith('--file='))?.slice('--file='.length).replaceAll('\\', '/');
const testes = (await arquivos(pastaTestes)).filter(p => /\.test\.[jt]sx?$/.test(p) && (!somente || relative(raiz, p).split('\\').join('/') === somente));
if (!testes.length) {
  console.error('Nenhum teste encontrado em tests/.');
  process.exit(1);
}

const temporario = await mkdtemp(join(raiz, '.test-tmp-'));
try {
  await writeFile(join(temporario, 'package.json'), '{"type":"commonjs"}\n');
  // Compila TS/TSX para CommonJS sem executar dependências nativas do Rollup/esbuild.
  // O TS da aplicação é verificado à parte por `npm run typecheck` no CI.
  for (const origem of [...await arquivos(join(raiz, 'src')), ...await arquivos(join(raiz, 'tests'))]) {
    const extensao = extname(origem);
    if (extensao === '.json') {
      const destino = join(temporario, relative(raiz, origem));
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, await readFile(origem));
      continue;
    }
    if (!['.ts', '.tsx'].includes(extensao) || origem.endsWith('.d.ts')) continue;
    const destino = join(temporario, relative(raiz, origem).replace(/\.tsx?$/, '.js'));
    await mkdir(dirname(destino), { recursive: true });
    const conteudo = await readFile(origem, 'utf8');
    const compilado = ts.transpileModule(conteudo, {
      fileName: origem,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      reportDiagnostics: true,
    });
    const erros = (compilado.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
    if (erros.length) throw new Error(`Falha de compilação em ${relative(raiz, origem)}: ${erros.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`);
    await writeFile(destino, compilado.outputText);
  }
  const compilados = testes.map(p => join(temporario, relative(raiz, p).replace(/\.tsx?$/, '.js')));
  const resultado = spawnSync(process.execPath, ['--test', ...compilados], {
    cwd: raiz,
    stdio: 'inherit',
    env: { ...process.env, TZ: 'UTC' },
  });
  if (resultado.error) throw resultado.error;
  process.exitCode = resultado.status ?? 1;
} finally {
  await rm(temporario, { recursive: true, force: true });
}
