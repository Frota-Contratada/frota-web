import type { BadgeStatus } from '../../components/common';

export type Contract = {
  id: number;
  codigo: string;
  fornecedor: string;
  tipo: string;
  inicio: string;
  vencimento: string;
  valorMensal: string;
  responsavel: string;
  status: BadgeStatus;
  arquivo: string;
  escopo: string;
  sla: string;
  reajuste: string;
};

export const suppliers = [
  'Fornecedor Alpha',
  'Mobilidade Prime',
  'Transporte Executivo BR',
  'Logística Nova Rota',
  'Fleet Serviços Integrados',
];

export const contracts: Contract[] = [
  {
    id: 1,
    codigo: 'CTR-2026-001',
    fornecedor: 'Fornecedor Alpha',
    tipo: 'Transporte executivo',
    inicio: '01/01/2026',
    vencimento: '31/12/2026',
    valorMensal: 'R$ 42.800',
    responsavel: 'Marina Costa',
    status: 'aprovado',
    arquivo: 'contrato-alpha-2026.pdf',
    escopo: 'Atendimento de corridas executivas em horário comercial e plantões previamente acordados.',
    sla: '95% das corridas iniciadas em até 15 minutos após confirmação.',
    reajuste: 'IPCA acumulado a cada 12 meses, limitado a 8%.',
  },
  {
    id: 2,
    codigo: 'CTR-2026-014',
    fornecedor: 'Mobilidade Prime',
    tipo: 'Frota dedicada',
    inicio: '15/02/2026',
    vencimento: '14/02/2027',
    valorMensal: 'R$ 68.400',
    responsavel: 'Rafael Mendes',
    status: 'em_andamento',
    arquivo: 'mobilidade-prime-frota.pdf',
    escopo: 'Disponibilização de veículos dedicados para filiais regionais com motorista credenciado.',
    sla: 'Disponibilidade mínima de 98% dos veículos contratados por mês.',
    reajuste: 'Revisão semestral vinculada ao combustível e manutenção preventiva.',
  },
  {
    id: 3,
    codigo: 'CTR-2025-087',
    fornecedor: 'Transporte Executivo BR',
    tipo: 'Viagens intermunicipais',
    inicio: '10/09/2025',
    vencimento: '10/09/2026',
    valorMensal: 'R$ 31.250',
    responsavel: 'Bianca Rocha',
    status: 'pendente',
    arquivo: 'executivo-br-intermunicipal.pdf',
    escopo: 'Rotas intermunicipais sob demanda para colaboradores autorizados.',
    sla: 'Confirmação da viagem em até 2 horas úteis após abertura da solicitação.',
    reajuste: 'Negociação anual conforme volume realizado no período.',
  },
  {
    id: 4,
    codigo: 'CTR-2025-102',
    fornecedor: 'Logística Nova Rota',
    tipo: 'Transporte operacional',
    inicio: '01/11/2025',
    vencimento: '31/10/2026',
    valorMensal: 'R$ 54.900',
    responsavel: 'André Lima',
    status: 'aprovado',
    arquivo: 'nova-rota-operacional.pdf',
    escopo: 'Atendimento de deslocamentos operacionais entre centros de distribuição e filiais.',
    sla: '90% das solicitações atendidas dentro da janela operacional combinada.',
    reajuste: 'IGP-M anual, com revisão extraordinária mediante variação de combustível acima de 12%.',
  },
  {
    id: 5,
    codigo: 'CTR-2026-022',
    fornecedor: 'Fleet Serviços Integrados',
    tipo: 'Gestão de frota',
    inicio: '01/03/2026',
    vencimento: '28/02/2027',
    valorMensal: 'R$ 76.300',
    responsavel: 'Clara Martins',
    status: 'em_andamento',
    arquivo: 'fleet-servicos-integrados.pdf',
    escopo: 'Gestão operacional, manutenção preventiva e monitoramento da frota terceirizada.',
    sla: 'Relatórios mensais entregues até o 5º dia útil e incidentes críticos tratados em até 4 horas.',
    reajuste: 'Reajuste anual por IPCA com gatilho de renegociação por expansão de escopo.',
  },
];
