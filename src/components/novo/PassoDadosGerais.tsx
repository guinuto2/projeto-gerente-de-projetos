import type { FormProjeto } from './formulario';
import { CODIGO_PADRAO, clienteParecido, normalizarCodigo } from '../../lib/validacoes';
import { MODELOS_FATURAMENTO, REGRA_FATURAMENTO, TIPOS_PROJETO } from '../../lib/constantes';
import { ativos, gerentesParaCadastro, tecnicoPorNome, tecnicosParaCadastro } from '../../lib/pessoas';
import { usePortal } from '../../state/PortalContext';

type Campo = keyof Omit<FormProjeto, 'atividades' | 'riscos' | 'equipe' | 'tarefasModelo'>;
interface Props { form: FormProjeto; mudar: (c: Campo, v: string) => void; edicao?: boolean; aoEscolherArquiteto?: (nome: string, email: string) => void; dataMinima?: string;
  /** pessoa do app escolhida num campo (ex.: gerente): o cadastro a coloca na equipe com a função e o e-mail */
  aoEscolherPessoa?: (funcao: string, nome: string, email: string) => void }

export function PassoDadosGerais({ form, mudar, edicao = false, aoEscolherArquiteto, dataMinima, aoEscolherPessoa }: Props) {
  const { dados, pessoasApp } = usePortal();
  // parceiros já usados em outros projetos (sugestões do campo)
  const parceiros = Array.from(new Set(dados.projetos.map(p => p.parceiro).filter((x): x is string => !!x))).sort();
  const tecnicos = tecnicosParaCadastro(ativos(dados.tecnicos || []), pessoasApp);
  // Gerente é escolhido somente entre os profissionais ativos com Função = Gerente
  // (ou Gerente de projeto) no Portal Tecnicos, sem fallback para PMOs ou técnicos.
  const gerentesDisponiveis = gerentesParaCadastro(dados.tecnicos || []);
  // clientes já usados: sugestões e aviso de nome parecido (ex.: "TRF 1" e "TRF1")
  const clientes = Array.from(new Set(dados.projetos.map(p => p.cliente).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const parecido = form.cliente.trim() ? clienteParecido(form.cliente, clientes) : null;
  const antesDeHoje = (v: string) => !!dataMinima && !!v && v < dataMinima;
  const campo = (c: Campo, rotulo: string, extra: { type?: string; placeholder?: string; span?: boolean; bloqueado?: boolean; min?: string } = {}) => (
    <label className="campo" style={extra.span ? { gridColumn: 'span 2' } : undefined}>{rotulo}
      <input className={`ctl ${extra.type === 'date' && c !== 'dataAssinatura' && antesDeHoje(form[c] as string) ? 'erro' : ''}`} type={extra.type || 'text'} placeholder={extra.placeholder}
        value={form[c]} disabled={extra.bloqueado} min={extra.min}
        title={extra.bloqueado ? 'O código identifica o projeto e não pode ser alterado' : undefined} onChange={e => mudar(c, e.target.value)} />
      {extra.type === 'date' && c !== 'dataAssinatura' && antesDeHoje(form[c] as string) && <span className="dica" style={{ color: '#9A2E12' }}>Não pode ser antes de hoje ({dataMinima!.split('-').reverse().join('/')}).</span>}
    </label>
  );
  return (
    <>
      <div className="fg3">
        <label className="campo">Código do projeto *
          <input className={`ctl ${form.codigo && !edicao && !CODIGO_PADRAO.test(form.codigo) ? 'erro' : ''}`} placeholder="ex.: TRF2-VCF" value={form.codigo} disabled={edicao}
            title={edicao ? 'O código identifica o projeto e não pode ser alterado' : undefined} onChange={e => mudar('codigo', normalizarCodigo(e.target.value))} />
          {!edicao && <span className="dica" style={form.codigo && !CODIGO_PADRAO.test(form.codigo) ? { color: '#9A2E12' } : undefined}>Padrão CLIENTE-SIGLA, em maiúsculas (ex.: TRF1-VCF).</span>}
        </label>
        {campo('nome', 'Nome do projeto *', { span: true })}
        <label className="campo">Cliente *
          <input className="ctl" list="clientes-usados" value={form.cliente} onChange={e => mudar('cliente', e.target.value)} />
          <datalist id="clientes-usados">{clientes.map(c => <option key={c} value={c} />)}</datalist>
          {parecido && <span className="dica" style={{ color: '#8A5A00' }}>Parecido com “{parecido}”, já usado em outro projeto. <button type="button" className="linkBtn" onClick={() => mudar('cliente', parecido)}>Usar esse nome</button></span>}
        </label>
        <label className="campo">Tipo
          <select className="ctl" value={form.tipo} onChange={e => mudar('tipo', e.target.value)}>
            {TIPOS_PROJETO.map(t => <option key={t}>{t}</option>)}
            {/* projeto antigo com tipo que saiu da lista: mantém o valor até ser trocado */}
            {form.tipo && !TIPOS_PROJETO.includes(form.tipo) && <option value={form.tipo}>{form.tipo} (fora da lista)</option>}
          </select>
        </label>
        {campo('contrato', 'Contrato / pedido')}
        {campo('dataAssinatura', 'Assinatura do contrato', { type: 'date' })}
        <label className="campo">Modelo de faturamento *
          <select className={`ctl ${!form.modeloFaturamento ? 'vazioObrig' : ''}`} value={form.modeloFaturamento} onChange={e => mudar('modeloFaturamento', e.target.value)}>
            <option value="">Selecione</option>
            {MODELOS_FATURAMENTO.map(m => <option key={m}>{m}</option>)}
          </select>
          {form.modeloFaturamento && <span className="dica">{REGRA_FATURAMENTO[form.modeloFaturamento]}</span>}
        </label>
        <label className="campo">Parceiro (terceirização)
          <input className="ctl" list="parceiros-conhecidos" value={form.parceiro} placeholder="Deixe vazio se a execução for própria"
            onChange={e => mudar('parceiro', e.target.value)} />
          <datalist id="parceiros-conhecidos">{parceiros.map(x => <option key={x} value={x} />)}</datalist>
          <span className="dica">Empresa que vai executar o trabalho, quando a Systech terceirizar.</span>
        </label>
        <label className="campo">Gerente de projeto *
          <select className={`ctl ${!form.gerente ? 'vazioObrig' : ''}`} value={form.gerente}
            onChange={e => {
              const nome = e.target.value;
              const pessoa = gerentesDisponiveis.find(p => p.nome === nome);
              mudar('gerente', nome);
              aoEscolherPessoa?.('Gerente de projeto', pessoa?.nome || '', pessoa?.email || '');
            }}>
            <option value="">— selecione —</option>
            {gerentesDisponiveis.map(p => <option key={p.email || p.nome} value={p.nome} disabled={p.nome === form.arquiteto}>{p.nome}</option>)}
            {/* Em projetos antigos, exibe o gerente já salvo, mas não permite escolhê-lo novamente. */}
            {edicao && form.gerente && !gerentesDisponiveis.some(p => p.nome === form.gerente) &&
              <option value={form.gerente} disabled>{form.gerente} (não cadastrado como Gerente)</option>}
          </select>
          {!gerentesDisponiveis.length && <span className="dica">Nenhum gerente ativo encontrado. Cadastre ou atualize a função para Gerente de projeto na lista Portal Tecnicos.</span>}
        </label>
        <label className="campo">Arquiteto
          <select className="ctl" value={form.arquiteto} onChange={e => {
            const nome = e.target.value;
            const t = tecnicoPorNome(tecnicos, nome);
            if (aoEscolherArquiteto) aoEscolherArquiteto(nome, t?.email || ''); else mudar('arquiteto', nome);
            aoEscolherPessoa?.('Arquiteto', t?.nome || '', t?.email || '');
          }}>
            <option value="">— selecione —</option>
            {tecnicos.map(a => <option key={a.email || a.nome} value={a.nome} disabled={a.nome === form.gerente}>{a.nome}</option>)}
            {/* mantém o valor atual de projetos antigos, mesmo que não esteja na tabela */}
            {form.arquiteto && !tecnicoPorNome(tecnicos, form.arquiteto) && <option value={form.arquiteto}>{form.arquiteto} (fora da tabela)</option>}
          </select>
        </label>
        {campo('inicio', 'Início previsto *', { type: 'date', min: dataMinima })}
        {campo('termino', 'Término previsto *', { type: 'date', min: form.inicio || dataMinima })}
      </div>
      <label className="campo">Objetivo do projeto *
        <textarea className="ctl" rows={3} placeholder="O que o projeto entrega e para quê." value={form.objetivo} onChange={e => mudar('objetivo', e.target.value)} />
      </label>
    </>
  );
}
