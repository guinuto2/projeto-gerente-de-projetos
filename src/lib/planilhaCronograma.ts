/** Exporta o cronograma do projeto mantendo as colunas atuais, com layout baseado no TRF1 e paleta/logo do Modelo-PaP. */
import type { Atividade, Dados, Projeto, StatusAtividade } from '../types/models';
import { dma } from './datas';
import { macro } from './calculos';
import { base64ParaBytes, MODELO_PAP_LOGO_BASE64 } from './modeloPapLogo';
import { ESTILO, gerarXlsx, type Celula } from './xlsx';

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
];
const CABECALHO = [
  'Mês', 'Datas', 'Horário (BSB)', 'Fase / Foco Estratégico',
  'Atividades', 'Responsável', 'Partes Envolvidas', 'Status',
];

/** Somente datas ISO válidas participam do agrupamento e da ordenação mensal. */
function dataValida(valor?: string): string {
  const data = (valor || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return '';
  const instante = new Date(`${data}T00:00:00Z`);
  return Number.isFinite(instante.getTime()) && instante.toISOString().slice(0, 10) === data ? data : '';
}

/** O campo de datas do modelo passa a exibir início e término, sem perder nenhum dos dois. */
function periodoAtividade(a: Atividade): string {
  const inicio = dataValida(a.inicio);
  const termino = dataValida(a.termino);
  if (inicio && termino && inicio !== termino) return `${dma(inicio)} – ${dma(termino)}`;
  return dma(inicio || termino);
}

function horarioReuniao(a: Atividade): string {
  // Atividades sem horário explícito não recebem um horário inventado.
  const m = a.reuniaoInicio?.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
  if (!m) return '—';
  return m[2] === '00' ? `${Number(m[1])}h` : `${Number(m[1])}h ${m[2]}m`;
}

function areaTecnica(a: Atividade, d: Dados, p: Projeto): string {
  if (!a.responsavel?.trim()) return '—';
  const email = a.responsavel.trim().toLocaleLowerCase('pt-BR');
  const pessoa = p.equipe.find(m => m.email.toLocaleLowerCase('pt-BR') === email)
    || d.tecnicos.find(t => t.email.toLocaleLowerCase('pt-BR') === email);
  return pessoa?.nome || a.responsavel;
}

function estiloStatus(status: StatusAtividade): number {
  switch (status) {
    case 'Concluído': return ESTILO.trfConcluido;
    case 'Em andamento': return ESTILO.trfAndamento;
    case 'Bloqueado': return ESTILO.trfBloqueado;
    case 'Planejado': return ESTILO.trfPlanejado;
    case 'Cancelado': return ESTILO.trfCancelado;
    case 'A confirmar': return ESTILO.trfAConfirmar;
  }
}

/** Forma uma chave mês/ano para não misturar meses homônimos de anos diferentes. */
function chaveMes(a: Atividade): string {
  const data = dataValida(a.inicio) || dataValida(a.termino);
  return data ? data.slice(0, 7) : 'sem-data';
}

export function planilhaCronograma(d: Dados, p: Projeto, hoje: string): Blob {
  const atividades = [...macro(d, p.codigo)].sort((a, b) => {
    const aData = dataValida(a.inicio) || dataValida(a.termino) || '9999';
    const bData = dataValida(b.inicio) || dataValida(b.termino) || '9999';
    return aData.localeCompare(bData) || a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true });
  });
  const anos = new Set(atividades.map(a => chaveMes(a).slice(0, 4)).filter(a => /^\d{4}$/.test(a)));
  const maisDeUmAno = anos.size > 1;
  // Mantém as colunas e reserva a área à direita para a logo, sem mudar larguras.
  const mesclas = ['A1:F1', 'A2:F2'];
  const alturasLinhas: Record<number, number> = { 1: 34, 2: 25, 3: 11, 4: 30 };
  const linhas: Celula[][] = [
    [{ v: `Cronograma · ${p.codigo} · ${p.nome}`, s: ESTILO.titulo }],
    [{ v: `${p.cliente || 'Cliente não informado'}  ·  Gerente: ${p.gerente || '—'}  ·  ${dma(hoje)}`, s: ESTILO.subtitulo }],
    [],
    CABECALHO.map(v => ({ v, s: ESTILO.trfCabecalho })),
  ];

  let grupoAnterior = '';
  let primeiraLinhaGrupo = 0;
  const fecharGrupo = (ultimaLinha: number) => {
    if (primeiraLinhaGrupo && ultimaLinha > primeiraLinhaGrupo) {
      mesclas.push(`A${primeiraLinhaGrupo}:A${ultimaLinha}`);
    }
  };

  for (const [i, a] of atividades.entries()) {
    const grupo = chaveMes(a);
    const novaSecao = grupo !== grupoAnterior;
    const linhaAtual = linhas.length + 1;
    if (novaSecao) {
      fecharGrupo(linhaAtual - 1);
      primeiraLinhaGrupo = linhaAtual;
      grupoAnterior = grupo;
    }
    const mes = grupo === 'sem-data' ? 'A DEFINIR' :
      `${MESES[Number(grupo.slice(5, 7)) - 1]}${maisDeUmAno ? `/${grupo.slice(0, 4)}` : ''}`;
    const zebra = i % 2 === 1;
    const estilo = (normal: number, alternado: number) => zebra ? alternado : normal;
    const linha: Celula[] = [
      { v: novaSecao ? mes : null, s: ESTILO.trfMes },
      { v: periodoAtividade(a), s: estilo(ESTILO.trfData, ESTILO.trfDataZebra) },
      { v: horarioReuniao(a), s: estilo(ESTILO.trfHora, ESTILO.trfHoraZebra) },
      { v: a.fase, s: estilo(ESTILO.trfFase, ESTILO.trfFaseZebra) },
      { v: a.nome, s: estilo(ESTILO.trfAtividade, ESTILO.trfAtividadeZebra) },
      { v: areaTecnica(a, d, p), s: estilo(ESTILO.trfArea, ESTILO.trfAreaZebra) },
      { v: a.equipe || '—', s: estilo(ESTILO.trfPartes, ESTILO.trfPartesZebra) },
      { v: a.status, s: estiloStatus(a.status) },
    ];
    linhas.push(linha);
    // Atividades longas são quebradas automaticamente e recebem altura apropriada.
    alturasLinhas[linhaAtual] = Math.min(72, Math.max(28, Math.ceil(linha[4].v!.toString().length / 75) * 17));
  }
  fecharGrupo(linhas.length);

  return gerarXlsx({
    nomeAba: 'Cronograma',
    larguras: [17, 29, 17, 29, 84, 25, 30, 19],
    linhas, mesclas, alturasLinhas,
    congelarLinhas: 4,
    imagens: [{
      nomeArquivo: 'logo-modelo-pap.png',
      tipoMime: 'image/png',
      dados: base64ParaBytes(MODELO_PAP_LOGO_BASE64),
      deCol: 6,
      deLinha: 0,
      ateCol: 8,
      ateLinha: 1,
      offsetX: 4,
      offsetY: 11,
      offsetX2: 0,
      offsetY2: 20,
    }],
    // Não aplicar autofiltro: a coluna de meses usa mesclagens como na planilha-base.
  });
}
