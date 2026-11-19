/**
 * Gerador mínimo de planilha .xlsx (Office Open XML) com estilos, sem dependências.
 * Um .xlsx é um zip de arquivos XML; aqui o zip é montado sem compressão (método "store").
 */

// ---------------------------------------------------------------- zip (store)
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) c = TABELA_CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipStore(arquivos: { nome: string; dados: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const partes: Uint8Array[] = [], central: Uint8Array[] = [];
  let deslocamento = 0;
  for (const a of arquivos) {
    const nome = enc.encode(a.nome), crc = crc32(a.dados), tam = a.dados.length;
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint32(14, crc, true); local.setUint32(18, tam, true); local.setUint32(22, tam, true); local.setUint16(26, nome.length, true);
    const cab = new Uint8Array(local.buffer);
    partes.push(cab, nome, a.dados);
    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true); dir.setUint16(4, 20, true); dir.setUint16(6, 20, true); dir.setUint16(8, 0x0800, true);
    dir.setUint32(16, crc, true); dir.setUint32(20, tam, true); dir.setUint32(24, tam, true); dir.setUint16(28, nome.length, true);
    dir.setUint32(42, deslocamento, true);
    central.push(new Uint8Array(dir.buffer), nome);
    deslocamento += cab.length + nome.length + tam;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamCentral, true); fim.setUint32(16, deslocamento, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)] as BlobPart[],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ---------------------------------------------------------------- planilha
/** Estilos disponíveis (índices em styles.xml). */
export const ESTILO = {
  normal: 0, titulo: 1, subtitulo: 2, cabecalho: 3, fase: 4, texto: 5,
  textoZebra: 6, data: 7, dataZebra: 8, codigo: 9, codigoZebra: 10,
  // Cronograma: mesmas colunas, com paleta do Modelo-PaP.
  trfCabecalho: 11, trfMes: 12, trfData: 13, trfDataZebra: 14,
  trfHora: 15, trfHoraZebra: 16, trfFase: 17, trfFaseZebra: 18,
  trfAtividade: 19, trfAtividadeZebra: 20, trfArea: 21, trfAreaZebra: 22,
  trfPartes: 23, trfPartesZebra: 24,
  trfConcluido: 25, trfAndamento: 26, trfBloqueado: 27,
  trfPlanejado: 28, trfCancelado: 29, trfAConfirmar: 30,
} as const;

export type Celula = { v: string | number | null; s?: number; data?: boolean };
export interface ImagemPlanilha {
  nomeArquivo: string;
  /** No momento, a exportação usa PNG. */
  tipoMime: 'image/png';
  dados: Uint8Array;
  /** Âncoras zero-based no grid do Excel. */
  deCol: number;
  deLinha: number;
  ateCol: number;
  ateLinha: number;
  offsetX?: number;
  offsetY?: number;
  offsetX2?: number;
  offsetY2?: number;
}
export interface Planilha {
  nomeAba: string;
  larguras: number[];
  linhas: Celula[][];
  /** Altura individual por linha (em pontos); não muda os demais formatos de exportação. */
  alturasLinhas?: Record<number, number>;
  mesclas?: string[];          // ex.: "A1:D1"
  congelarLinhas?: number;     // linhas fixas no topo
  filtro?: string;             // ex.: "A4:D40"
  imagens?: ImagemPlanilha[];
}

const xml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const coluna = (i: number) => { let s = ''; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
/** Image anchors use positive EMU offsets within a cell. */
const emu = (px: number) => Math.round(Math.max(0, px) * 9525);

/** 'aaaa-mm-dd' → número de série do Excel. */
export const serialExcel = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5);
};

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="6">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="16"/><color rgb="FF7A1E15"/><name val="Calibri"/></font>
<font><i/><sz val="10"/><color rgb="FF575A5F"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF202020"/><name val="Calibri"/></font>
<font><sz val="10"/><color rgb="FF575A5F"/><name val="Consolas"/></font>
</fonts>
<fills count="11">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF7A1E15"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF1EAE8"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF8F6F5"/><bgColor indexed="64"/></patternFill></fill>
<!-- Paleta do Modelo-PaP -->
<fill><patternFill patternType="solid"><fgColor rgb="FF7A1E15"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF00B050"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF1EAE8"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE5E5E5"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="31">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<!-- Índices 11 a 30: estilos compatíveis com as oito colunas do cronograma, usando a paleta do Modelo-PaP. -->
<xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="8" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="10" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function planilhaXml(p: Planilha): string {
  const linhas = p.linhas.map((l, r) => `<row r="${r + 1}"${p.alturasLinhas?.[r + 1] ? ` ht="${p.alturasLinhas[r + 1]}" customHeight="1"` : ''}>${l.map((c, i) => {
    const ref = `${coluna(i)}${r + 1}`, s = c.s ? ` s="${c.s}"` : '';
    if (c.v === null || c.v === '') return `<c r="${ref}"${s}/>`;
    if (typeof c.v === 'number') return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xml(c.v)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const fixo = p.congelarLinhas
    ? `<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${p.congelarLinhas}" topLeftCell="A${p.congelarLinhas + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${fixo}<sheetFormatPr defaultRowHeight="18"/>
<cols>${p.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${linhas}</sheetData>
${p.filtro ? `<autoFilter ref="${p.filtro}"/>` : ''}
${p.mesclas?.length ? `<mergeCells count="${p.mesclas.length}">${p.mesclas.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
${p.imagens?.length ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`;
}

function drawingXml(imagens: ImagemPlanilha[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${imagens.map((img, i) => `
<xdr:twoCellAnchor editAs="oneCell">
  <xdr:from>
    <xdr:col>${img.deCol}</xdr:col>
    <xdr:colOff>${emu(img.offsetX ?? 0)}</xdr:colOff>
    <xdr:row>${img.deLinha}</xdr:row>
    <xdr:rowOff>${emu(img.offsetY ?? 0)}</xdr:rowOff>
  </xdr:from>
  <xdr:to>
    <xdr:col>${img.ateCol}</xdr:col>
    <xdr:colOff>${emu(img.offsetX2 ?? 0)}</xdr:colOff>
    <xdr:row>${img.ateLinha}</xdr:row>
    <xdr:rowOff>${emu(img.offsetY2 ?? 0)}</xdr:rowOff>
  </xdr:to>
  <xdr:pic>
    <xdr:nvPicPr>
      <xdr:cNvPr id="${i + 1}" name="${xml(img.nomeArquivo)}"/>
      <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
    </xdr:nvPicPr>
    <xdr:blipFill>
      <a:blip r:embed="rId${i + 1}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </xdr:blipFill>
    <xdr:spPr>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </xdr:spPr>
  </xdr:pic>
  <xdr:clientData/>
</xdr:twoCellAnchor>`).join('')}
</xdr:wsDr>`;
}

function drawingRelsXml(imagens: ImagemPlanilha[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${imagens.map((img, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${xml(img.nomeArquivo)}"/>`).join('')}
</Relationships>`;
}

/** Monta o .xlsx com uma aba. */
export function gerarXlsx(p: Planilha): Blob {
  const enc = new TextEncoder();
  const f = (nome: string, conteudo: string) => ({ nome, dados: enc.encode(conteudo) });
  const aba = xml(p.nomeAba.slice(0, 31));
  const arquivos = [
    f('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
${p.imagens?.length ? '<Default Extension="png" ContentType="image/png"/>' : ''}
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${p.imagens?.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}
</Types>`),
    f('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    f('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${aba}" sheetId="1" r:id="rId1"/></sheets>
${p.filtro ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${aba}'!$${p.filtro.replace(':', ':$').replace(/([A-Z]+)(\d+)/g, '$1$$$2')}</definedName></definedNames>` : ''}
</workbook>`),
    f('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    f('xl/styles.xml', STYLES),
    f('xl/worksheets/sheet1.xml', planilhaXml(p)),
  ] as { nome: string; dados: Uint8Array }[];

  if (p.imagens?.length) {
    arquivos.push(
      f('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`),
      f('xl/drawings/drawing1.xml', drawingXml(p.imagens)),
      f('xl/drawings/_rels/drawing1.xml.rels', drawingRelsXml(p.imagens)),
      ...p.imagens.map(img => ({ nome: `xl/media/${img.nomeArquivo}`, dados: img.dados })),
    );
  }
  return zipStore(arquivos);
}

export function baixarArquivo(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
