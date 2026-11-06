import type { Atividade, Projeto } from '../../../types/models';
import { SELO_STATUS } from '../../../lib/constantes';
import { dia, diasUteis, dma } from '../../../lib/datas';
import { Selo } from '../../ui/Selo';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const comDia = (s?: string) => { const d = s ? dia(s) : null; return d ? `${dma(s!)} (${SEMANA[d.getDay()]})` : '—'; };

/** Informações da atividade, só para leitura (patrocinador; PMO e técnico antes de liberar a edição). */
export function VisaoAtividade({ projeto, a, filhos, lista = [], mostrarLancamento = false }: { projeto: Projeto; a: Atividade; filhos: Atividade[]; lista?: Atividade[]; mostrarLancamento?: boolean }) {
  const preReqs = (a.predecessoras || []).map(c => lista.find(x => x.codigo === c)).filter((x): x is Atividade => !!x);
  const faltam = preReqs.filter(x => x.status !== 'Concluído');
  const resp = a.responsavel ? projeto.equipe.find(m => m.email.toLowerCase() === a.responsavel!.toLowerCase())?.nome || a.responsavel : '';
  const mudou = a.baselineInicio && (a.baselineInicio !== a.inicio || a.baselineTermino !== a.termino);
  const linha = (rotulo: string, valor: React.ReactNode) => (
    <div className="visaoLinha"><span>{rotulo}</span><div>{valor || '—'}</div></div>
  );
  return (
    <div className="visao">
      <div className="visaoTopo">
        <Selo valor={a.status} cores={SELO_STATUS} />
        <span className="mono" style={{ fontSize: 13 }}>{a.percentual}% concluído</span>
        {a.marco && <span className="stp tagVinho">Marco</span>}
        {a.impedimento && <span className="stp tagErro">Impedimento</span>}
        {a.pai && a.lancada === false && <span className="stp tagAviso">Não lançada para o técnico</span>}
        {faltam.length > 0 && a.status !== 'Concluído' && <span className="stp tagErro">Aguarda pré-requisito</span>}
      </div>
      <div className="barraProg"><i style={{ width: `${Math.min(100, a.percentual)}%` }} /></div>
      <div className="visaoGrade">
        {linha('Fase', a.fase)}
        {linha('Equipe', a.equipe)}
        {linha('Responsável', resp)}
        {a.pai && linha('Subatividade de', a.pai)}
        {a.pai && mostrarLancamento && linha('Lançada para o técnico', a.lancada === false ? 'Não — em preparação' : 'Sim')}
        {linha('Início previsto', comDia(a.inicio))}
        {linha('Término previsto', comDia(a.termino))}
        {a.inicio && a.termino && linha('Duração', `${diasUteis(a.inicio, a.termino)} dia(s) útil(eis)`)}
        {mudou && linha('Baseline', `${dma(a.baselineInicio)} a ${dma(a.baselineTermino)}`)}
        {a.dataReal && linha('Data real', comDia(a.dataReal))}
        {a.dependeRdm && linha('RDM', a.numeroRdm || 'depende de RDM')}
        {a.causaAtraso && linha('Causa do atraso', a.causaAtraso)}
        {(a.horasPlanejadas !== undefined || a.horasRealizadas !== undefined) && linha('Horas (realizadas/planejadas)', `${a.horasRealizadas ?? 0}/${a.horasPlanejadas ?? '—'} h`)}
      </div>
      {preReqs.length > 0 && (
        <div>
          <div className="sub">Pré-requisitos</div>
          <ul className="ul" style={{ marginTop: 4 }}>{preReqs.map(x => (
            <li key={x.codigo} style={{ color: x.status === 'Concluído' ? 'var(--txt-ok)' : 'var(--txt-erro)' }}>
              {x.status === 'Concluído' ? '✓' : '○'} {x.codigo} · {x.nome} — {x.status}
            </li>
          ))}</ul>
          {faltam.length > 0 && a.status !== 'Concluído' && <p className="sub" style={{ marginTop: 4 }}>Só pode ser iniciada depois que {faltam.length === 1 ? 'esta estiver concluída' : 'estas estiverem concluídas'}.</p>}
        </div>
      )}
      {a.descricao && <div><div className="sub">Descrição</div><div className="visaoTexto">{a.descricao}</div></div>}
      {a.observacao && <div><div className="sub">Próximo passo / observação</div><div className="visaoTexto">{a.observacao}</div></div>}
      {filhos.length > 0 && (
        <div>
          <div className="sub">Subatividades</div>
          <ul className="ul" style={{ marginTop: 4 }}>{filhos.map(f => <li key={f.codigo}>{f.codigo} · {f.nome} — {f.status}, {f.percentual}%</li>)}</ul>
        </div>
      )}
      {a.dataUltimaAtualizacao && <div className="sub">Última atualização em {dma(a.dataUltimaAtualizacao)}{a.atualizadoPor ? ` por ${a.atualizadoPor}` : ''}.</div>}
    </div>
  );
}
