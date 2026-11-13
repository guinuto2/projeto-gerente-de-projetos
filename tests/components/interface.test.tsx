import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Abas } from '../../src/components/ui/Abas';
import { Chips } from '../../src/components/ui/Chips';
import { Kpi } from '../../src/components/ui/Kpi';
import { Vazio } from '../../src/components/ui/Vazio';
import { Selo } from '../../src/components/ui/Selo';
import { KanbanAtividades } from '../../src/components/atualizacao/KanbanAtividades';
import type { Atividade, Projeto } from '../../src/types/models';

test('Abas marca a aba selecionada de forma acessível', () => {
  const html = renderToStaticMarkup(<Abas abas={[{ id: 'lista', rotulo: 'Lista' }, { id: 'kanban', rotulo: 'Kanban', contagem: 3 }]} ativa="kanban" aoMudar={() => {}} />);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Kanban/);
  assert.match(html, /aria-selected="false"[^>]*>Lista/);
  assert.match(html, /class="cnt">3/);
});

test('Chips apresenta opções e informa qual está ativa', () => {
  const html = renderToStaticMarkup(<Chips opcoes={['Todos', 'Atrasadas']} valor="Atrasadas" aoMudar={() => {}} rotulo="Filtrar atividades" />);
  assert.match(html, /aria-label="Filtrar atividades"/);
  assert.match(html, /aria-pressed="true"[^>]*>Atrasadas/);
  assert.match(html, /aria-pressed="false"[^>]*>Todos/);
});

test('Kpi apresenta título, valor e observação', () => {
  const html = renderToStaticMarkup(<Kpi rotulo="Atividades" valor={8} nota="Esta semana" alerta />);
  assert.match(html, /Atividades/);
  assert.match(html, /class="kpiV alerta">8/);
  assert.match(html, /Esta semana/);
});

test('Vazio apresenta mensagem sem esconder o conteúdo', () => {
  assert.match(renderToStaticMarkup(<Vazio>Nenhuma atividade</Vazio>), /Nenhuma atividade/);
});

test('Selo mantém a cor informada e aplica estilo forte opcional', () => {
  const html = renderToStaticMarkup(<Selo valor="Concluído" forte cores={{ Concluído: ['#112233', '#ffffff'] }} />);
  assert.match(html, /class="sf"/);
  assert.match(html, /background:#112233/);
  assert.match(html, /color:#ffffff/);
});

// Esses testes cobrem renderização/semântica sem montar os providers ou conectar ao SharePoint.
// Interações reais de clique e navegação serão cobertas na etapa E2E, posteriormente.


test('Kanban do PMO renderiza as quatro colunas e o cartão selecionável', () => {
  const atividade = {
    codigo: '1.0', nome: 'Configurar ambiente', fase: 'Execução', equipe: 'Systech', duracao: 2,
    descricao: '', marco: false, inicio: '2026-05-13', termino: '2026-05-15',
    baselineInicio: '2026-05-13', baselineTermino: '2026-05-15',
    status: 'Planejado', percentual: 0, pai: '', observacao: '',
  } as Atividade;
  const projeto = { codigo: 'CLIENTE-VCF' } as Projeto;
  const html = renderToStaticMarkup(<KanbanAtividades
    itens={[{ projeto, atividade }]} hoje="2026-05-14" selecionada="" aoSelecionar={() => {}}
  />);
  assert.match(html, /Kanban das atividades do PMO/);
  for (const coluna of ['Não iniciada', 'Em andamento', 'Bloqueada', 'Concluída']) {
    assert.ok(html.includes(coluna), `Coluna não encontrada: ${coluna}`);
  }
  assert.match(html, /Configurar ambiente/);
  assert.match(html, /CLIENTE-VCF/);
  assert.match(html, /aria-pressed="false"/);
});
