import type { BadgeStatus } from '../../components/common';

export type Contract = {
  id: number;
  codigo: string;
  fornecedor: string;
  filial: string;
  inicio: string;
  vencimento: string;
  status: BadgeStatus;
  arquivo: string;
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
    codigo: 'CTR-0001',
    fornecedor: 'Fornecedor Alpha',
    filial: 'Matriz São Paulo',
    inicio: '01/01/2026',
    vencimento: '31/12/2026',
    status: 'aprovado',
    arquivo: 'contrato-alpha-2026.pdf',
  },
  {
    id: 2,
    codigo: 'CTR-0002',
    fornecedor: 'Mobilidade Prime',
    filial: 'Filial Itajaí',
    inicio: '15/02/2026',
    vencimento: '14/02/2027',
    status: 'em_andamento',
    arquivo: 'mobilidade-prime-frota.pdf',
  },
  {
    id: 3,
    codigo: 'CTR-0003',
    fornecedor: 'Transporte Executivo BR',
    filial: 'Filial Curitiba',
    inicio: '10/09/2025',
    vencimento: '10/09/2026',
    status: 'pendente',
    arquivo: 'executivo-br-intermunicipal.pdf',
  },
  {
    id: 4,
    codigo: 'CTR-0004',
    fornecedor: 'Logística Nova Rota',
    filial: 'Filial Porto Alegre',
    inicio: '01/11/2025',
    vencimento: '31/10/2026',
    status: 'aprovado',
    arquivo: 'nova-rota-operacional.pdf',
  },
  {
    id: 5,
    codigo: 'CTR-0005',
    fornecedor: 'Fleet Serviços Integrados',
    filial: 'Filial Rio de Janeiro',
    inicio: '01/03/2026',
    vencimento: '28/02/2027',
    status: 'em_andamento',
    arquivo: 'fleet-servicos-integrados.pdf',
  },
];

