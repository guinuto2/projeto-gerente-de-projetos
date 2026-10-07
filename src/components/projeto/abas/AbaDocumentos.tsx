import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import type { Arquivo, PastaDocumentos, Projeto } from '../../../types/models';
import { Confirmacao } from '../../ui/Confirmacao';
import { usePortal } from '../../../state/PortalContext';
import { usePapel } from '../../../state/PapelContext';
import { useToast } from '../../../state/ToastContext';
import { config } from '../../../config/config';
import { COR_EXTENSAO } from '../../../lib/constantes';
import { dm, extensao } from '../../../lib/datas';
import { Carregando } from '../../ui/Carregando';
import { Mensagem } from '../../ui/Mensagem';

/** Pastas do projeto na biblioteca do SharePoint, com upload direto. */
export function AbaDocumentos({ projeto }: { projeto: Projeto }) {
  const { fonte, enviarDocumento, excluirDocumento } = usePortal();
  const [excluir, setExcluir] = useState<null | { pasta: string; arquivo: Arquivo; ocupado: boolean; erro: string }>(null);
  const toast = useToast();
  const { pode } = usePapel();
  const [pastas, setPastas] = useState<PastaDocumentos[] | null>(null);
  const [erro, setErro] = useState('');
  const piloto = fonte.modo === 'piloto';

  const carregar = useCallback(() => {
    fonte.documentos(projeto.codigo).then(setPastas).catch(e => setErro((e as Error).message));
  }, [fonte, projeto.codigo]);

  // lê ao abrir a aba; depois de enviar/excluir e no botão "Recarregar"
  useEffect(carregar, [carregar]);

  const enviar = async (pasta: string, e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      toast(`Enviando ${arquivo.name}…`);
      await enviarDocumento(projeto.codigo, pasta, arquivo);
      toast('Arquivo enviado para o SharePoint.');
      carregar();
    } catch (err) { toast((err as Error).message); }
  };

  const confirmarExclusao = async () => {
    if (!excluir) return;
    setExcluir({ ...excluir, ocupado: true, erro: '' });
    try {
      await excluirDocumento(projeto.codigo, excluir.pasta, excluir.arquivo);
      toast(`${excluir.arquivo.nome} enviado para a lixeira do SharePoint.`);
      setExcluir(null); carregar();
    } catch (e) { setExcluir({ ...excluir, ocupado: false, erro: (e as Error).message }); }
  };

  if (erro) return <Mensagem tipo="erro">{erro}</Mensagem>;
  if (!pastas) return <Carregando texto="Buscando documentos na biblioteca…" />;
  return (
    <>
      {piloto && (
        <Mensagem tipo="info" className="mb">
          No piloto a lista de arquivos é ilustrativa. Conectado, esta aba lê as pastas de <b>{config.biblioteca}/{projeto.codigo}</b> e cada arquivo abre no Office Online.
        </Mensagem>
      )}
      {!piloto && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button type="button" className="btn pq" onClick={() => { setPastas(null); carregar(); }}>↻ Recarregar lista</button>
      </div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: piloto ? 14 : 0 }}>
        {pastas.map(f => (
          <div key={f.pasta} className="pasta">
            <div className="pastaCab">
              <span>📁 {f.pasta} <span className="sub" style={{ fontWeight: 400 }}>· {f.arquivos.length} arquivo(s)</span></span>
              <span style={{ display: 'flex', gap: 8 }}>
                {f.url && <a className="btn pq" href={f.url} target="_blank" rel="noopener noreferrer">Abrir pasta ↗</a>}
                {pode('enviarDocumento') && <label className="btn pq" style={{ cursor: 'pointer' }}>Enviar arquivo<input type="file" hidden onChange={e => enviar(f.pasta, e)} /></label>}
              </span>
            </div>
            {f.arquivos.map(a => {
              const x = extensao(a.nome);
              const conteudo = <>
                <span className="ext" style={{ background: COR_EXTENSAO[x] || '#6B7685' }}>{x.toUpperCase()}</span>
                <span>{a.nome}</span>
                <span className="meta">{a.autor} · {dm(a.modificado)}</span>
              </>;
              return a.url
                ? <div key={a.nome} className="arqLinha">
                    <a className="arq" href={a.url} target="_blank" rel="noopener noreferrer">{conteudo}</a>
                    {pode('editarProjeto') && <button type="button" className="rm" title={`Excluir ${a.nome}`} aria-label={`Excluir ${a.nome}`}
                      onClick={() => setExcluir({ pasta: f.pasta, arquivo: a, ocupado: false, erro: '' })}>×</button>}
                  </div>
                : <button key={a.nome} type="button" className="arq" style={{ width: '100%', background: 'none', border: 0, borderTop: '1px solid var(--borda2)', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
                    onClick={() => toast('No piloto os arquivos são ilustrativos. Conectado ao SharePoint, o arquivo abre no Office Online.')}>{conteudo}</button>;
            })}
            {!f.arquivos.length && <div className="arq sub">Pasta vazia.</div>}
          </div>
        ))}
      </div>
      {excluir && (
        <Confirmacao titulo={`Excluir ${excluir.arquivo.nome}?`} rotuloConfirmar="Excluir documento" ocupado={excluir.ocupado} erro={excluir.erro}
          aoCancelar={() => setExcluir(null)} aoConfirmar={confirmarExclusao}>
          <p className="sub" style={{ fontSize: 14 }}>O arquivo sai da pasta {excluir.pasta} e vai para a lixeira do SharePoint (pode ser restaurado por até 93 dias). A exclusão fica registrada no histórico do projeto.</p>
        </Confirmacao>
      )}
    </>
  );
}
