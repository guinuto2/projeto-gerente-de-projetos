import { NavLink } from 'react-router-dom';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { config } from '../../config/config';
import { usePapel } from '../../state/PapelContext';
import { useEffect } from 'react';
import { DESCRICAO_PAPEL, PAPEIS, SIGLA_PAPEL, type Papel } from '../../lib/permissoes';

export function Cabecalho() {
  const { fonte, usuario, sincronizando, atualizadoEm, atualizar, restaurarPiloto } = usePortal();
  const toast = useToast();
  const { papel, trocar, pode } = usePapel();
  const sigla = SIGLA_PAPEL[papel];
  // o título da aba do navegador acompanha o perfil
  useEffect(() => { document.title = `${sigla} Systech · Escritório de Projetos`; }, [sigla]);
  const piloto = fonte.modo === 'piloto';
  const biblioteca = fonte.linkBiblioteca();
  const classe = ({ isActive }: { isActive: boolean }) => (isActive ? 'ativo' : '');

  const restaurar = async () => {
    if (!confirm('Desfazer todas as alterações feitas no modo piloto neste navegador?')) return;
    await restaurarPiloto();
    toast('Dados do piloto restaurados.');
  };

  return (
    <header className="header">
      <div className="headerIn">
        <NavLink className="logo" to="/"><div className="marca" title={`Perfil: ${papel}`}>{sigla}</div><div className="logoTxt">Systech · Escritório de Projetos</div></NavLink>
        <nav className="nav" aria-label="Portal">
          <NavLink to="/" end className={classe}>Portfólio</NavLink>
          {pode('criarProjeto') && <NavLink to="/novo" className={classe}>Novo projeto</NavLink>}
          {biblioteca && <a href={biblioteca} target="_blank" rel="noopener noreferrer">Documentos no SharePoint ↗</a>}
        </nav>
        <label className="papel" title={DESCRICAO_PAPEL[papel]}>Perfil (teste)
          <select value={papel} onChange={e => { const p = e.target.value as Papel; trocar(p); toast(`Perfil ${p}: ${DESCRICAO_PAPEL[p].toLowerCase()}.`); }}>
            {PAPEIS.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        <div className="conexao">
          <span className={`pontoCx ${piloto ? '' : 'on'}`} />
          {piloto ? 'Modo piloto · sem conexão' : `SharePoint · ${usuario}`}
          {!piloto && (
            <>
              <span className="sync" title={`Os dados são relidos do SharePoint a cada ${config.sincronizarSegundos} segundos`}>
                {sincronizando ? 'atualizando…' : `atualizado às ${atualizadoEm}`}
              </span>
              <button className="btnCx" type="button" disabled={sincronizando} onClick={() => atualizar(true)} title="Buscar agora as alterações feitas no SharePoint">↻ Atualizar</button>
              <button className="btnCx" type="button" onClick={() => fonte.sair()}>Sair</button>
            </>
          )}
          {piloto && <button className="btnCx" type="button" onClick={restaurar} title="Desfaz as alterações feitas neste navegador">Restaurar piloto</button>}
        </div>
      </div>
    </header>
  );
}
