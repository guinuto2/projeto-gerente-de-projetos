import type { FormProjeto } from './formulario';
import { TIPOS_PROJETO } from '../../lib/constantes';
import { ativos, tecnicoPorNome } from '../../lib/pessoas';
import { usePortal } from '../../state/PortalContext';

type Campo = keyof Omit<FormProjeto, 'atividades' | 'riscos' | 'equipe'>;
interface Props { form: FormProjeto; mudar: (c: Campo, v: string) => void; edicao?: boolean; aoEscolherArquiteto?: (nome: string, email: string) => void; dataMinima?: string }

export function PassoDadosGerais({ form, mudar, edicao = false, aoEscolherArquiteto, dataMinima }: Props) {
  const { dados } = usePortal();
  const tecnicos = ativos(dados.tecnicos || []);
  const antesDeHoje = (v: string) => !!dataMinima && !!v && v < dataMinima;
  const campo = (c: Campo, rotulo: string, extra: { type?: string; placeholder?: string; span?: boolean; bloqueado?: boolean; min?: string } = {}) => (
    <label className="campo" style={extra.span ? { gridColumn: 'span 2' } : undefined}>{rotulo}
      <input className={`ctl ${extra.type === 'date' && antesDeHoje(form[c] as string) ? 'erro' : ''}`} type={extra.type || 'text'} placeholder={extra.placeholder}
        value={form[c]} disabled={extra.bloqueado} min={extra.min}
        title={extra.bloqueado ? 'O código identifica o projeto e não pode ser alterado' : undefined} onChange={e => mudar(c, e.target.value)} />
      {extra.type === 'date' && antesDeHoje(form[c] as string) && <span className="dica" style={{ color: '#9A2E12' }}>Não pode ser antes de hoje ({dataMinima!.split('-').reverse().join('/')}).</span>}
    </label>
  );
  return (
    <>
      <div className="fg3">
        {campo('codigo', 'Código do projeto *', { placeholder: 'ex.: TRF2-VCF', bloqueado: edicao })}
        {campo('nome', 'Nome do projeto *', { span: true })}
        {campo('cliente', 'Cliente *')}
        <label className="campo">Tipo
          <select className="ctl" value={form.tipo} onChange={e => mudar('tipo', e.target.value)}>
            {TIPOS_PROJETO.map(t => <option key={t}>{t}</option>)}
            {/* projeto antigo com tipo que saiu da lista: mantém o valor até ser trocado */}
            {form.tipo && !TIPOS_PROJETO.includes(form.tipo) && <option value={form.tipo}>{form.tipo} (fora da lista)</option>}
          </select>
        </label>
        {campo('contrato', 'Contrato / pedido')}
        {campo('gerente', 'Gerente de projeto *')}
        <label className="campo">Arquiteto
          <select className="ctl" value={form.arquiteto} onChange={e => {
            const t = tecnicoPorNome(tecnicos, e.target.value);
            if (aoEscolherArquiteto) aoEscolherArquiteto(e.target.value, t?.email || ''); else mudar('arquiteto', e.target.value);
          }}>
            <option value="">— selecione —</option>
            {tecnicos.map(a => <option key={a.email || a.nome} value={a.nome}>{a.nome}</option>)}
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
