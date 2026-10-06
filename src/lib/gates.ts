import type { Fase, Gate, Projeto } from '../types/models';
import { FASES, GATE_DA_FASE } from './constantes';

const ORDEM: Fase[] = ['Iniciação', 'Planejamento', 'Execução', 'Encerramento'];

/** Situação inicial coerente com a fase atual do projeto. */
function situacaoInicial(p: Projeto, fase: Fase): Gate['situacao'] {
  if (p.situacaoCadastro === 'Encerrado') return 'Aprovado';
  const atual = FASES.indexOf(p.fase === 'Monitoramento' ? 'Encerramento' : p.fase);
  const daFase = FASES.indexOf(fase);
  if (daFase < atual) return 'Aprovado';
  if (fase === 'Iniciação' && p.situacaoCadastro === 'Em aprovação') return 'Aguardando aprovação';
  return 'Pendente';
}

/** Gates G1–G4 que o projeto ainda não tem (todo projeto precisa dos quatro). */
export function gatesFaltantes(p: Projeto): Gate[] {
  return ORDEM
    .filter(f => !p.fases.some(g => g.gate === GATE_DA_FASE[f]!.gate))
    .map(f => ({ fase: f, gate: GATE_DA_FASE[f]!.gate, nome: GATE_DA_FASE[f]!.nome, situacao: situacaoInicial(p, f), data: '', info: '' }));
}
