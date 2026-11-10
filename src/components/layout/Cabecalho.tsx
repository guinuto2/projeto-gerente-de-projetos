import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sino } from './Sino';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { config } from '../../config/config';
import { usePapel } from '../../state/PapelContext';
import { DESCRICAO_PAPEL, SIGLA_PAPEL, type Papel } from '../../lib/permissoes';
import { aplicarTema, temaSalvo, type Tema } from '../../lib/tema';

const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

export function Cabecalho() {
  // celular: o menu fica recolhido atrás do botão ☰ e fecha sozinho ao trocar de página
  const [menuAberto, setMenuAberto] = useState(false);
  const local = useLocation();
  useEffect(() => { setMenuAberto(false); }, [local.pathname]);
  const { fonte, usuario, sincronizando, ocupado, atualizadoEm, atualizar, restaurarPiloto } = usePortal();
  const toast = useToast();
  const { papel, trocar, pode, disponiveis } = usePapel();
  const sigla = SIGLA_PAPEL[papel];
  // o título da aba do navegador acompanha o perfil
  useEffect(() => { document.title = `${sigla} · Central Systech`; }, [sigla]);
  const piloto = fonte.modo === 'piloto';
  const classe = ({ isActive }: { isActive: boolean }) => (isActive ? 'ativo' : '');

  return (
    <header className="header">
      {(ocupado || sincronizando) && <div className="barraCarregando" role="progressbar" aria-label="Carregando" />}
      <div className="headerIn">
        <NavLink className="logo" to="/"><div className="marca" title={`Perfil: ${papel}`}>{sigla}</div><div className="logoTxt">Central Systech</div></NavLink>
        <button type="button" className="menuBtn" aria-label={menuAberto ? 'Fechar o menu' : 'Abrir o menu'} aria-expanded={menuAberto} aria-controls="menu-portal"
          onClick={() => setMenuAberto(v => !v)}>{menuAberto ? '✕' : '☰'}</button>
        <nav id="menu-portal" className={`nav ${menuAberto ? 'aberto' : ''}`} aria-label="Portal">
          <NavLink to="/" end className={classe}>Portfólio</NavLink>
          {pode('criarProjeto') && <NavLink to="/novo" className={classe}>Novo projeto</NavLink>}
          {papel !== 'Cliente' && <NavLink to="/cronogramas" className={classe}>Cronogramas</NavLink>}
          {pode('atualizarAtividade') && <NavLink to="/atualizar" className={classe}>Atualizar status</NavLink>}
          {papel === 'Técnico' && <NavLink to="/wiki" className={classe}>Wiki</NavLink>}
          {(papel === 'PMO' || papel === 'Patrocinador') && <NavLink to="/financeiro" className={classe}>Financeiro</NavLink>}
        </nav>
        {config.dataSimulada && <span className="dataSimulada" title="config.js: dataSimulada">Data simulada · {config.dataSimulada.split('-').reverse().join('/')}</span>}
        {papel !== 'Cliente' && <Sino />}
        <MenuUsuario nome={piloto ? 'Modo piloto' : usuario} piloto={piloto} papel={papel} disponiveis={disponiveis}
          status={piloto ? 'Modo piloto · sem conexão' : sincronizando ? 'SharePoint · atualizando…' : `SharePoint · atualizado às ${atualizadoEm}`}
          sincronizando={sincronizando}
          aoAtualizar={() => atualizar(true)}
          aoTrocarPapel={p => { trocar(p); toast(`Perfil ${p}: ${DESCRICAO_PAPEL[p].toLowerCase()}.`); }}
          aoSair={() => fonte.sair()}
          aoRestaurar={async () => {
            if (!confirm('Desfazer todas as alterações feitas no modo piloto neste navegador?')) return;
            await restaurarPiloto(); toast('Dados do piloto restaurados.');
          }} />
      </div>
    </header>
  );
}

interface MenuProps {
  nome: string; piloto: boolean; papel: Papel; status: string; sincronizando: boolean;
  aoAtualizar: () => void; aoTrocarPapel: (p: Papel) => void; aoSair: () => void; aoRestaurar: () => void;
  disponiveis: Papel[];
}

/** Botão com as iniciais que abre um pequeno menu: Teams, SharePoint, atualizar, modo escuro, perfil e sair. */
function MenuUsuario({ nome, piloto, papel, disponiveis, status, sincronizando, aoAtualizar, aoTrocarPapel, aoSair, aoRestaurar }: MenuProps) {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState<Tema>(temaSalvo);
  const trocarTema = () => { const t: Tema = tema === 'escuro' ? 'claro' : 'escuro'; setTema(t); aplicarTema(t); };
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);
  const urlSharePoint = `https://${config.sharepointHost}${config.sitePath}`;
  return (
    <div className="menuUsuario" ref={caixa}>
      <button type="button" className="btnMenu" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto(a => !a)} title={nome}>
        <span className={`avatar ${piloto ? '' : 'on'}`}>{iniciais(nome)}</span>
        <span className="seta" aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div className="menuCaixa" role="menu">
          <div className="menuTopo">
            <b>{nome}</b>
            <span className="sub"><span className={`pontoCx ${piloto ? '' : 'on'}`} /> {status}</span>
          </div>
          <a role="menuitem" className="menuItem" href="https://teams.microsoft.com/" target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
            <span className="ico ico-teams" aria-hidden="true">T</span>Abrir Teams <span className="ext">↗</span>
          </a>
          <a role="menuitem" className="menuItem" href={urlSharePoint} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
            <span className="ico ico-sp" aria-hidden="true">S</span>Abrir SharePoint <span className="ext">↗</span>
          </a>
          <div className="menuSep" />
          {!piloto && (
            <button role="menuitem" type="button" className="menuItem" disabled={sincronizando} onClick={() => { aoAtualizar(); setAberto(false); }}>
              <span className="ico" aria-hidden="true">↻</span>{sincronizando ? 'Atualizando…' : 'Atualizar dados'}
            </button>
          )}
          <button role="menuitemcheckbox" aria-checked={tema === 'escuro'} type="button" className="menuItem" onClick={trocarTema}>
            <span className="ico" aria-hidden="true">{tema === 'escuro' ? '☾' : '☀'}</span>Modo escuro
            <span className={`interruptor ${tema === 'escuro' ? 'on' : ''}`} aria-hidden="true"><i /></span>
          </button>
          {disponiveis.length > 1 ? (
            <label className="menuItem menuPerfil">
              <span className="ico" aria-hidden="true">◐</span>{piloto ? 'Perfil (piloto)' : 'Perfil'}
              <select value={papel} onChange={e => aoTrocarPapel(e.target.value as Papel)}>{disponiveis.map(p => <option key={p}>{p}</option>)}</select>
            </label>
          ) : (
            <div className="menuItem menuPerfil" title="Perfil atribuído no Entra ID"><span className="ico" aria-hidden="true">◐</span>Perfil<b style={{ marginLeft: 'auto' }}>{papel}</b></div>
          )}
          <div className="menuSep" />
          {piloto
            ? <button role="menuitem" type="button" className="menuItem" onClick={() => { setAberto(false); aoRestaurar(); }}><span className="ico" aria-hidden="true">⟲</span>Restaurar piloto</button>
            : <button role="menuitem" type="button" className="menuItem" onClick={aoSair}><span className="ico" aria-hidden="true">⎋</span>Sair</button>}
        </div>
      )}
    </div>
  );
}
