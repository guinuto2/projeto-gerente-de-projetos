import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { Mensagem } from '../../src/components/ui/Mensagem';
import { Carregando } from '../../src/components/ui/Carregando';
import { GraficoBarras } from '../../src/components/ui/GraficoBarras';
import { Losango } from '../../src/components/ui/Losango';
import { KanbanAtividades } from '../../src/components/atualizacao/KanbanAtividades';
import { atividadeTeste, projetoTeste } from '../helpers/fixtures';

test('mensagens de erro anunciam conteúdo para leitores de tela', () => {
  const html = renderToStaticMarkup(<Mensagem tipo="erro">Falha de gravação</Mensagem>);
  assert.match(html, /role="alert"/);
  assert.match(html, /Falha de gravação/);
});

test('indicador de carregamento possui papel status e texto definido', () => {
  const html = renderToStaticMarkup(<Carregando texto="Carregando projetos" telaCheia />);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Carregando projetos/);
  assert.match(html, /cheia/);
});

test('gráfico vazio apresenta informação, sem inventar barras', () => {
  const html = renderToStaticMarkup(<GraficoBarras titulo="Horas" dados={[]} vazio="Nenhum lançamento" />);
  assert.match(html, /Nenhum lançamento/);
  assert.ok(!html.includes('role="img"'));
});

test('gráfico apresenta barras com valores e rótulo acessível', () => {
  const html = renderToStaticMarkup(<GraficoBarras titulo="Atividades" dados={[{ rotulo: 'Abertas', valor: 2, cor: '#abc123' }, { rotulo: 'Fechadas', valor: 3, cor: '#123abc' }]} />);
  assert.match(html, /role="img"/);
  assert.match(html, /Abertas 2/);
  assert.match(html, /Fechadas 3/);
});

test('losango de gate aprovado preserva rótulo e variante de tamanho', () => {
  const html = renderToStaticMarkup(<Losango texto="G3" situacao="Aprovado" grande />);
  assert.match(html, /class="los g"/);
  assert.match(html, />G3</);
});

test('Kanban destaca atividade selecionada e alerta sobre atraso', () => {
  const p = projetoTeste();
  const a = atividadeTeste({ status: 'Planejado', termino: '2026-05-10', percentual: 30 });
  const html = renderToStaticMarkup(<KanbanAtividades itens={[{ projeto: p, atividade: a }]} hoje="2026-05-20" selecionada={`${p.codigo}|${a.codigo}`} aoSelecionar={() => {}} />);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Atrasada/);
  assert.match(html, /30%/);
});
