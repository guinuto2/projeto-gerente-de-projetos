import { useCallback, useEffect, useState } from 'react';
import type { Arquivo, Atividade, Projeto } from '../../types/models';
import { usePortal } from '../../state/PortalContext';
import { useToast } from '../../state/ToastContext';
import { pastaDaFase } from '../../lib/constantes';
import { dm } from '../../lib/datas';

/**
 * Documentos da atividade: vão para a pasta da fase no SharePoint (ex.: "03 · Execução"),
 * com o código da atividade na frente do nome ("3.1.1 - relatorio.pdf") para ficar fácil de achar.
 */
export function DocumentosAtividade({ projeto, a, somenteLeitura = false }: { projeto: Projeto; a: Atividade; somenteLeitura?: boolean }) {
  const { fonte, enviarDocumento } = usePortal();
  const toast = useToast();
  const pasta = pastaDaFase(a.fase);
  const prefixo = `${a.codigo} - `;
  const [arquivos, setArquivos] = useState<Arquivo[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const conectado = fonte.modo === 'sharepoint';
  const carregar = useCallback(() => {
    if (!conectado) { setArquivos([]); return; }
    fonte.documentos(projeto.codigo)
      .then(ps => setArquivos((ps.find(p => p.pasta === pasta)?.arquivos || []).filter(x => x.nome.startsWith(prefixo))))
      .catch(() => setArquivos([]));
  }, [conectado, fonte, projeto.codigo, pasta, prefixo]);
  useEffect(carregar, [carregar]);

  const enviar = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setEnviando(true);
    try {
      for (const f of Array.from(lista)) {
        const nome = f.name.startsWith(prefixo) ? f.name : prefixo + f.name;
        await enviarDocumento(projeto.codigo, pasta, new File([f], nome, { type: f.type }));
      }
      toast(`${lista.length} arquivo(s) enviado(s) para ${pasta}.`);
      carregar();
    } catch (e) { toast((e as Error).message); }
    finally { setEnviando(false); }
  };

  return (
    <div className="campo">Documentos da atividade
      <div className="docsAtv">
        {arquivos === null ? <span className="sub">Buscando…</span>
          : arquivos.length ? arquivos.map(x => (
            <a key={x.nome} className="docAtv" href={x.url} target="_blank" rel="noopener noreferrer">
              <span>{x.nome.slice(prefixo.length)}</span><span className="sub">{dm(x.modificado)}{x.autor ? ` · ${x.autor}` : ''}</span>
            </a>))
          : <span className="sub">{conectado ? 'Nenhum documento desta atividade ainda.' : 'O envio de documentos funciona quando o portal está conectado ao SharePoint.'}</span>}
        {conectado && !somenteLeitura && (
          <label className="btn pq" style={{ cursor: enviando ? 'wait' : 'pointer', alignSelf: 'flex-start' }}>
            {enviando ? 'Enviando…' : '+ Adicionar documentos'}
            <input type="file" multiple hidden disabled={enviando} onChange={e => { enviar(e.target.files); e.target.value = ''; }} />
          </label>
        )}
        {!somenteLeitura && <span className="dica">Vão para a pasta <b>{pasta}</b> do projeto, com “{prefixo}” no início do nome.</span>}
      </div>
    </div>
  );
}
