import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { LinkReuniao } from '../../src/components/projeto/LinkReuniao';
import type { Atividade } from '../../src/types/models';

const atividade = (inicio: string) => ({
  codigo: '1.1', nome: 'Instalação', reuniaoUrl: 'https://teams.microsoft.com/meet/abc', reuniaoInicio: inicio,
} as Atividade);

test('link de reunião futura continua acessível no Gantt e no editor', () => {
  const html = renderToStaticMarkup(<LinkReuniao atividade={atividade('2099-01-01T10:00')} classe="teams" texto="Teams" />);
  assert.match(html, /href="https:\/\/teams\.microsoft\.com/);
  assert.match(html, /target="_blank"/);
  assert.ok(!html.includes('Horário encerrado'));
});

test('reunião antiga tem apenas selo informativo, sem link ou botão clicável', () => {
  const html = renderToStaticMarkup(<LinkReuniao atividade={atividade('2000-01-01T10:00')} classe="teams" texto="Teams" />);
  assert.ok(!html.includes('href='));
  assert.match(html, /Horário encerrado/);
  assert.match(html, /class="teams passada"/);
});

