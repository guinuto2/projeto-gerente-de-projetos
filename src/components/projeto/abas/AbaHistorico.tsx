import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Projeto, RegistroHistorico } from '../../../types/models';
import { usePortal } from '../../../state/PortalContext';
import { Carregando } from '../../ui/Carregando';
import { Chips } from '../../ui/Chips';
import { Mensagem } from '../../ui/Mensagem';
import { Vazio } from '../../ui/Vazio';

const COR_TIPO: Record<string, [string, string]> = {
  Projeto: ['#F6E9EA', '#7E181C'], Atividade: ['#ECEDEF', '#202020'], Subatividade: ['#ECEDEF', '#202020'],
  Risco: ['#FBE3DC', '#9A2E12'], 'Pendência': ['#FFF1D1', '#7A5200'], Gate: ['#E8F5EE', '#145C3C'],
  'Reunião': ['#EEF0FB', '#464EB8'], Documento: ['#E6F3F3', '#03595C']
};
const diaDe = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Histórico de mudanças do projeto: quem fez, quando e o que mudou. */
export function AbaHistorico({ projeto }: { projeto: Projeto }) {
  const { fonte, dados, statusHistorico, reenviarHistorico } = usePortal();
  const [reenviando, setReenviando] = useState(false);
  // assinatura do que está no projeto: o histórico só é relido quando algo do projeto muda
  const versao = JSON.stringify([dados.atividades[projeto.codigo]?.length, dados.riscos[projeto.codigo]?.length, dados.pendencias[projeto.codigo]?.length,
    dados.projetos.find(x => x.codigo === projeto.codigo)]).length + '|' + (dados.atividades[projeto.codigo] || []).map(a => a.status + a.percentual + a.termino).join('');
  const [lista, setLista] = useState<RegistroHistorico[] | null>(null);
  const [erro, setErro] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [busca, setBusca] = useState('');

  const carregar = useCallback(() => {
    fonte.historico(projeto.codigo).then(l => { setLista(l); setErro(''); }).catch(e => setErro((e as Error).message));
  }, [fonte, projeto.codigo]);
  // relê ao abrir e quando algo do projeto muda (ações novas aparecem logo); o registro é gravado logo após a ação
  useEffect(() => { const t = window.setTimeout(carregar, 800); return () => window.clearTimeout(t); }, [carregar, versao]);

  const tipos = useMemo(() => ['Todos', ...Array.from(new Set((lista || []).map(r => r.tipo)))], [lista]);
  const filtrada = (lista || []).filter(r => (tipo === 'Todos' || r.tipo === tipo) &&
    (!busca.trim() || `${r.usuario} ${r.acao} ${r.descricao}`.toLowerCase().includes(busca.trim().toLowerCase())));

  const avisoPendentes = statusHistorico.pendentes > 0 && (
    <Mensagem tipo="erro" className="linha">
      <span><b>{statusHistorico.pendentes} registro(s) do histórico ainda não foram gravados no SharePoint.</b>
        {statusHistorico.erro && <> Motivo: {statusHistorico.erro}.</>} Eles estão guardados neste navegador e serão reenviados.</span>
      <button type="button" className="btn pq" disabled={reenviando} onClick={async () => {
        setReenviando(true);
        try { const r = await reenviarHistorico(); if (!r) carregar(); } finally { setReenviando(false); }
      }}>{reenviando ? 'Gravando…' : 'Tentar gravar agora'}</button>
    </Mensagem>
  );
  if (erro) return <>{avisoPendentes}<Mensagem tipo="erro">{erro}</Mensagem></>;
  if (!lista) return <Carregando texto="Buscando o histórico do projeto…" />;
  if (!lista.length) return <>{avisoPendentes}<Vazio>Nenhuma mudança registrada ainda. A partir de agora, cada alteração feita pelo portal aparece aqui.</Vazio></>;

  let diaAnterior = '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {avisoPendentes}
      <div className="linha" style={{ alignItems: 'flex-end' }}>
        <Chips rotulo="Tipo de mudança" opcoes={tipos} valor={tipo} aoMudar={setTipo}
          formatar={t => `${t} (${t === 'Todos' ? lista.length : lista.filter(r => r.tipo === t).length})`} />
        <input className="ctl" style={{ maxWidth: 280 }} placeholder="Buscar por pessoa ou texto" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar no histórico" />
      </div>
      <div className="hist">
        {filtrada.map((r, i) => {
          const dia = diaDe(r.quando), novoDia = dia !== diaAnterior; diaAnterior = dia;
          const [fundo, cor] = COR_TIPO[r.tipo] || ['#ECEDEF', '#202020'];
          return (
            <div key={i}>
              {novoDia && <div className="histDia">{dia}</div>}
              <div className="histItem">
                <div className="histHora">{horaDe(r.quando)}</div>
                <div>
                  <div className="histTopo">
                    <span className="histTipo" style={{ background: fundo, color: cor, borderColor: fundo }}>{r.tipo}</span>
                    <b>{r.usuario}</b><span>{r.acao.toLowerCase()}</span>
                  </div>
                  <div className="histDesc">{r.descricao}</div>
                </div>
              </div>
            </div>
          );
        })}
        {!filtrada.length && <p className="sub" style={{ padding: '12px 0' }}>Nada encontrado com esse filtro.</p>}
      </div>
    </div>
  );
}
