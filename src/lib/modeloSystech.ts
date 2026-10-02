/**
 * Modelo de projeto padrão Systech: cronograma em 5 fases (EAP por fase: 1.x Iniciação … 5.x Encerramento)
 * e riscos recorrentes em projetos de infraestrutura. Ajuste à vontade: é um ponto de partida.
 */
import type { Fase, Nivel } from '../types/models';

export interface AtividadeModelo { codigo: string; nome: string; fase: Fase; equipe: string; dias: number; marco?: boolean; paralela?: boolean }
export interface RiscoModelo { codigo: string; descricao: string; probabilidade: Nivel; impacto: Nivel; mitigacao: string; responsavel: string }

export const CRONOGRAMA_SYSTECH: AtividadeModelo[] = [
  { codigo: '1.1', nome: 'Reunião de kickoff interna', fase: 'Iniciação', equipe: 'Systech', dias: 1 },
  { codigo: '1.2', nome: 'Kickoff com o cliente e alinhamento de escopo', fase: 'Iniciação', equipe: 'Systech e Cliente', dias: 1 },
  { codigo: '1.3', nome: 'Termo de abertura assinado', fase: 'Iniciação', equipe: 'Systech e Cliente', dias: 1, marco: true },

  { codigo: '2.1', nome: 'Levantamento técnico do ambiente (assessment)', fase: 'Planejamento', equipe: 'Systech', dias: 3 },
  { codigo: '2.2', nome: 'Desenho da solução e documento de arquitetura', fase: 'Planejamento', equipe: 'Systech', dias: 3 },
  { codigo: '2.3', nome: 'Cronograma detalhado, matriz RACI e plano de comunicação', fase: 'Planejamento', equipe: 'Systech', dias: 1 },
  { codigo: '2.4', nome: 'Plano de implantação e plano de rollback', fase: 'Planejamento', equipe: 'Systech', dias: 2 },
  { codigo: '2.5', nome: 'Aprovação da linha de base com o cliente', fase: 'Planejamento', equipe: 'Systech e Cliente', dias: 1, marco: true },

  { codigo: '3.1', nome: 'Preparação do ambiente e pré-requisitos (rede, acessos, licenças)', fase: 'Execução', equipe: 'Cliente', dias: 2 },
  { codigo: '3.2', nome: 'Implantação e configuração da solução', fase: 'Execução', equipe: 'Systech', dias: 5 },
  { codigo: '3.3', nome: 'Migração e integração com o ambiente do cliente', fase: 'Execução', equipe: 'Systech e Cliente', dias: 3 },
  { codigo: '3.4', nome: 'Testes de aceite e validação funcional', fase: 'Execução', equipe: 'Systech e Cliente', dias: 2, marco: true },

  { codigo: '4.1', nome: 'Status report semanal ao cliente', fase: 'Monitoramento', equipe: 'Systech', dias: 0, paralela: true },
  { codigo: '4.2', nome: 'Controle de riscos, pendências e mudanças', fase: 'Monitoramento', equipe: 'Systech', dias: 0, paralela: true },

  { codigo: '5.1', nome: 'Documentação as-built', fase: 'Encerramento', equipe: 'Systech', dias: 2 },
  { codigo: '5.2', nome: 'Repasse de conhecimento (handover) para a operação', fase: 'Encerramento', equipe: 'Systech e Cliente', dias: 1 },
  { codigo: '5.3', nome: 'Termo de aceite final', fase: 'Encerramento', equipe: 'Systech e Cliente', dias: 1, marco: true },
  { codigo: '5.4', nome: 'Lições aprendidas e encerramento interno', fase: 'Encerramento', equipe: 'Systech', dias: 1 }
];

export const RISCOS_SYSTECH: RiscoModelo[] = [
  { codigo: 'R-1', descricao: 'Atraso na liberação de acessos, credenciais ou VPN pelo cliente', probabilidade: 'Médio', impacto: 'Alto', mitigacao: 'Checklist de acessos entregue no kickoff, com prazo e responsável', responsavel: 'GP' },
  { codigo: 'R-2', descricao: 'Janelas de manutenção não aprovadas a tempo', probabilidade: 'Médio', impacto: 'Alto', mitigacao: 'Calendário de janelas acordado na aprovação da linha de base', responsavel: 'GP' },
  { codigo: 'R-3', descricao: 'Incompatibilidade de versões, firmware ou hardware', probabilidade: 'Baixo', impacto: 'Alto', mitigacao: 'Validar a matriz de compatibilidade do fabricante no assessment', responsavel: 'Arquiteto' },
  { codigo: 'R-4', descricao: 'Atraso na entrega de hardware ou licenças pelo fabricante', probabilidade: 'Médio', impacto: 'Médio', mitigacao: 'Confirmar prazos de entrega antes de fechar o cronograma', responsavel: 'GP' },
  { codigo: 'R-5', descricao: 'Indisponibilidade de recursos técnicos da Systech ou do cliente', probabilidade: 'Médio', impacto: 'Médio', mitigacao: 'Alocação confirmada na RACI e substituto definido', responsavel: 'PMO' },
  { codigo: 'R-6', descricao: 'Mudança de escopo sem controle formal', probabilidade: 'Médio', impacto: 'Alto', mitigacao: 'Toda alteração passa por solicitação de mudança aprovada', responsavel: 'GP' },
  { codigo: 'R-7', descricao: 'Falha durante a implantação com impacto em produção', probabilidade: 'Baixo', impacto: 'Alto', mitigacao: 'Backup antes de cada janela e plano de rollback testado', responsavel: 'Arquiteto' },
  { codigo: 'R-8', descricao: 'Dependência de terceiros do cliente (rede, segurança, aplicação)', probabilidade: 'Médio', impacto: 'Médio', mitigacao: 'Mapear terceiros no kickoff e incluí-los no plano de comunicação', responsavel: 'GP' }
];
