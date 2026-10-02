import type { FormProjeto } from './formulario';
import { TIPOS_PROJETO } from '../../lib/constantes';
import { arquitetos } from '../../lib/pessoas';

type Campo = keyof Omit<FormProjeto, 'atividades' | 'riscos' | 'equipe'>;
interface Props { form: FormProjeto; mudar: (c: Campo, v: string) => void; edicao?: boolean }

export function PassoDadosGerais({ form, mudar, edicao = false }: Props) {
  const campo = (c: Campo, rotulo: string, extra: { type?: string; placeholder?: string; span?: boolean; bloqueado?: boolean } = {}) => (
    <label className="campo" style={extra.span ? { gridColumn: 'span 2' } : undefined}>{rotulo}
      <input className="ctl" type={extra.type || 'text'} placeholder={extra.placeholder} value={form[c]} disabled={extra.bloqueado}
        title={extra.bloqueado ? 'O código identifica o projeto e não pode ser alterado' : undefined} onChange={e => mudar(c, e.target.value)} />
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
          <select className="ctl" value={form.arquiteto} onChange={e => mudar('arquiteto', e.target.value)}>
            <option value="">— selecione —</option>
            {arquitetos().map(a => <option key={a.email} value={a.nome}>{a.nome} · {a.email}</option>)}
            {/* mantém o valor atual de projetos antigos, mesmo que não esteja no cadastro */}
            {form.arquiteto && !arquitetos().some(a => a.nome === form.arquiteto) && <option value={form.arquiteto}>{form.arquiteto} (fora do cadastro)</option>}
          </select>
          <span className="dica">Técnicos cadastrados no sistema</span>
        </label>
        {campo('inicio', 'Início previsto *', { type: 'date' })}
        {campo('termino', edicao ? 'Término previsto *' : 'Término previsto *', { type: 'date' })}
      </div>
      <label className="campo">Objetivo do projeto *
        <textarea className="ctl" rows={3} placeholder="O que o projeto entrega e para quê." value={form.objetivo} onChange={e => mudar('objetivo', e.target.value)} />
      </label>
    </>
  );
}
