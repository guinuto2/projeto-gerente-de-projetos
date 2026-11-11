import type { Atividade } from '../../types/models';
import type { ItemSemana } from '../../lib/semana';
import { vencida } from '../../lib/semana';
import { dm } from '../../lib/datas';

const COLUNAS = [
  { id: 'planejadas', titulo: 'Não iniciada' },
  { id: 'andamento', titulo: 'Em andamento' },
  { id: 'bloqueadas', titulo: 'Bloqueada' },
  { id: 'concluidas', titulo: 'Concluída' }
] as const;

type Coluna = typeof COLUNAS[number]['id'];

/** Grupos visuais: o status só muda pelo formulário de atualização existente. */
export function colunaKanban(a: Atividade): Coluna {
  if (a.status === 'Concluído') return 'concluidas';
  if (a.status === 'Bloqueado' || a.impedimento) return 'bloqueadas';
  if (a.status === 'Em andamento') return 'andamento';
  return 'planejadas'; // Planejado e A confirmar
}

interface Props {
  itens: ItemSemana[];
  hoje: string;
  selecionada: string;
  aoSelecionar: (item: ItemSemana) => void;
}

const identidade = (item: ItemSemana) => `${item.projeto.codigo}|${item.atividade.codigo}`;

/** PMO: quadro visual somente de consulta. A edição permanece na mesma tela de Atualizar status. */
export function KanbanAtividades({ itens, hoje, selecionada, aoSelecionar }: Props) {
  const grupos = COLUNAS.map(coluna => ({
    ...coluna,
    atividades: itens.filter(i => colunaKanban(i.atividade) === coluna.id)
      .sort((a, b) => Number(vencida(b.atividade, hoje)) - Number(vencida(a.atividade, hoje)) ||
        (a.atividade.termino || '9999').localeCompare(b.atividade.termino || '9999'))
  }));

  return (
    <section className="kanbanArea" aria-label="Kanban das atividades do PMO">
      <div className="linha kanbanResumo">
        <div>
          <h2 className="h2">Quadro de atividades <span className="cnt">{itens.length}</span></h2>
          <p className="sub">Projetos ativos · Selecione uma atividade para visualizar os detalhes e atualizar o status.</p>
        </div>
      </div>
      <div className="kanbanGrade">
        {grupos.map(grupo => (
          <div key={grupo.id} className={`kanbanColuna kanban-${grupo.id}`}>
            <div className="kanbanTopo">
              <h3>{grupo.titulo}</h3>
              <span className="cnt" aria-label={`${grupo.atividades.length} atividades`}>{grupo.atividades.length}</span>
            </div>
            <div className="kanbanCartoes">
              {grupo.atividades.map(i => {
                const a = i.atividade;
                const atrasada = vencida(a, hoje);
                const selecionado = identidade(i) === selecionada;
                return (
                  <button key={identidade(i)} type="button"
                    className={`kanbanCartao ${selecionado ? 'on' : ''}`}
                    aria-pressed={selecionado}
                    onClick={() => aoSelecionar(i)}>
                    <span className="kanbanCodigo">{i.projeto.codigo} · {a.codigo}{a.pai ? ' · Subatividade' : ''}</span>
                    <span className="kanbanNome">{a.nome}</span>
                    <span className="kanbanDados">
                      <span>Prevista: {dm(a.termino)}</span>
                      <span>{a.percentual}%</span>
                    </span>
                    {(atrasada || a.status === 'A confirmar' || (a.impedimento && a.status !== 'Bloqueado')) && (
                      <span className="kanbanEtiquetas">
                        {atrasada && <span className="kanbanEtiqueta atraso">Atrasada</span>}
                        {a.status === 'A confirmar' && <span className="kanbanEtiqueta">A confirmar</span>}
                        {a.impedimento && a.status !== 'Bloqueado' && <span className="kanbanEtiqueta bloqueio">Impedimento</span>}
                      </span>
                    )}
                  </button>
                );
              })}
              {!grupo.atividades.length && <p className="kanbanVazia">Nenhuma atividade</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
