import test from 'node:test';
import assert from 'node:assert/strict';
import { planilhaCronograma } from '../../src/lib/planilhaCronograma';
import { dadosTeste, atividadeTeste, projetoTeste } from '../helpers/fixtures';

/** Lê as entradas do ZIP sem compressão emitido pelo gerador da aplicação. */
async function arquivosXlsx(blob: Blob): Promise<Record<string, string>> {
  const bytes = Buffer.from(await blob.arrayBuffer());
  const arquivos: Record<string, string> = {};
  let p = 0;
  while (p + 30 <= bytes.length && bytes.readUInt32LE(p) === 0x04034b50) {
    const metodo = bytes.readUInt16LE(p + 8);
    assert.equal(metodo, 0, 'O gerador do portal usa entradas ZIP sem compressão');
    const tamanho = bytes.readUInt32LE(p + 18);
    const nomeTam = bytes.readUInt16LE(p + 26);
    const extraTam = bytes.readUInt16LE(p + 28);
    const nome = bytes.subarray(p + 30, p + 30 + nomeTam).toString('utf8');
    const inicio = p + 30 + nomeTam + extraTam;
    arquivos[nome] = bytes.subarray(inicio, inicio + tamanho).toString('utf8');
    p = inicio + tamanho;
  }
  return arquivos;
}

test('exportação usa as oito colunas e a estrutura visual do cronograma com paleta/logo do Modelo-PaP', async () => {
  const p = projetoTeste();
  const d = dadosTeste(p, [
    atividadeTeste({ codigo: '1.0', inicio: '2026-05-13', termino: '2026-05-15', status: 'Concluído', responsavel: 'gerente@systech.com.br', reuniaoInicio: '2026-05-13T14:30' }),
    atividadeTeste({ codigo: '1.1', inicio: '2026-05-16', termino: '2026-05-20', status: 'Bloqueado' }),
    atividadeTeste({ codigo: '1.2', inicio: '2026-06-02', termino: '2026-06-02', status: 'Em andamento' }),
  ]);
  const excel = await arquivosXlsx(planilhaCronograma(d, p, '2026-11-17'));
  const planilha = excel['xl/worksheets/sheet1.xml'];
  const estilos = excel['xl/styles.xml'];
  assert.match(planilha, /Mês/);
  assert.match(planilha, /Horário \(BSB\)/);
  assert.match(planilha, /Fase \/ Foco Estratégico/);
  assert.match(planilha, /Atividades/);
  assert.match(planilha, /Responsável/);
  assert.match(planilha, /Partes Envolvidas/);
  assert.match(planilha, /13\/05\/2026 – 15\/05\/2026/);
  assert.match(planilha, /14h 30m/);
  assert.match(planilha, /Interno/); // responsável resolvido pela equipe do projeto
  assert.match(planilha, /Systech\/Cliente/);
  // O Excel exibe somente o nome da atividade, sem prefixo numérico/código.
  assert.match(planilha, /Instalar solução/);
  assert.doesNotMatch(planilha, /1\.0 ·/);
  assert.doesNotMatch(planilha, /1\.1 ·/);
  assert.doesNotMatch(planilha, /1\.2 ·/);
  assert.match(planilha, /<mergeCell ref="A1:F1"\/>/);
  assert.match(planilha, /<mergeCell ref="A2:F2"\/>/);
  assert.match(planilha, /<mergeCell ref="A5:A6"\/>/);
  assert.match(planilha, /<c r="H5" s="25" t="inlineStr">/); // Concluído (verde)
  assert.match(planilha, /<c r="H6" s="27" t="inlineStr">/); // Bloqueado (vermelho)
  assert.match(planilha, /<c r="H7" s="26" t="inlineStr">/); // Em andamento (amarelo)
  assert.match(estilos, /FF7A1E15/); // bordô do Modelo-PaP
  assert.match(estilos, /FF00B050/); // verde do status concluído
  assert.match(estilos, /FFFFC000/); // amarelo do status em andamento
  assert.ok(excel['xl/drawings/drawing1.xml']);
  assert.ok(excel['xl/drawings/_rels/drawing1.xml.rels']);
  assert.ok(excel['xl/worksheets/_rels/sheet1.xml.rels']);
  assert.ok(excel['xl/media/logo-modelo-pap.png'] !== undefined);
  assert.match(planilha, /<drawing r:id="rId1"\/>/);
  assert.match(excel['xl/drawings/drawing1.xml'], /logo-modelo-pap\.png/);
  assert.match(planilha, /ySplit="4"/);
});

test('cronograma plurianual separa os meses por ano e ordena a data, sem inventar horários', async () => {
  const p = projetoTeste();
  const atividades = [
    atividadeTeste({ codigo: '3.1', inicio: '2027-01-04', termino: '2027-01-06', status: 'Planejado' }),
    atividadeTeste({ codigo: '3.0', inicio: '2026-12-28', termino: '2027-01-05', status: 'A confirmar', responsavel: '' }),
  ];
  const xml = (await arquivosXlsx(planilhaCronograma(dadosTeste(p, atividades), p, '2026-11-17')))['xl/worksheets/sheet1.xml'];
  assert.match(xml, /DEZEMBRO\/2026/);
  assert.match(xml, /JANEIRO\/2027/);
  assert.ok(xml.indexOf('DEZEMBRO/2026') < xml.indexOf('JANEIRO/2027'));
  assert.match(xml, /28\/12\/2026 – 05\/01\/2027/);
  assert.match(xml, /<c r="C5" s="15" t="inlineStr"><is><t xml:space="preserve">—<\/t><\/is><\/c>/);
  assert.deepEqual(atividades.map(a => a.codigo), ['3.1', '3.0']); // entrada não alterada
});

test('sem atividades exporta cabeçalho válido e sem mesclas mensais falsas', async () => {
  const p = projetoTeste();
  const xml = (await arquivosXlsx(planilhaCronograma(dadosTeste(p), p, '2026-11-17')))['xl/worksheets/sheet1.xml'];
  assert.match(xml, /<mergeCell ref="A1:F1"\/>/);
  assert.match(xml, /<mergeCell ref="A2:F2"\/>/);
  assert.doesNotMatch(xml, /<mergeCell ref="A5:/);
});


test('xlsx com logo respeita a ordem dos elementos OOXML e âncoras válidas', async () => {
  const p = projetoTeste();
  const excel = await arquivosXlsx(planilhaCronograma(dadosTeste(p, [atividadeTeste()]), p, '2026-11-18'));
  const planilha = excel['xl/worksheets/sheet1.xml'];
  const desenho = excel['xl/drawings/drawing1.xml'];
  const ordem = ['</sheetData>', '</mergeCells>', '<pageMargins', '<pageSetup', '<drawing r:id="rId1"/>'];
  const indices = ordem.map(elemento => planilha.indexOf(elemento));
  assert.ok(indices.every(indice => indice >= 0), 'Todos os elementos obrigatórios estão presentes');
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b), 'Drawing deve ficar depois de pageMargins e pageSetup');
  assert.equal((planilha.match(/<col min=/g) || []).length, 8, 'Manter exatamente as oito colunas do cronograma');
  for (const [, valor] of desenho.matchAll(/<xdr:(?:colOff|rowOff)>(-?\d+)<\/xdr:(?:colOff|rowOff)>/g)) {
    assert.ok(Number(valor) >= 0, 'Não usar deslocamento negativo em âncoras de imagem');
  }
  assert.match(desenho, /<xdr:pic>/);
  assert.match(excel['[Content_Types].xml'], /Extension="png" ContentType="image\/png"/);
  assert.match(excel['xl/worksheets/_rels/sheet1.xml.rels'], /Target="\.\.\/drawings\/drawing1\.xml"/);
  assert.match(excel['xl/drawings/_rels/drawing1.xml.rels'], /Target="\.\.\/media\/logo-modelo-pap\.png"/);
});
