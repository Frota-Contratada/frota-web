import type { BadgeStatus } from '../../components/common';

export type Supplier = {
  id: number;
  name: string;
  document: string;
  filePath: string | null;
  activatedAt: string;
  deactivatedAt: string | null;
  linkedBranches: number;
  linkedContracts: number;
  vehicles: number;
  status: BadgeStatus;
};

export const suppliers: Supplier[] = [
  {
    id: 1,
    name: 'Mobilidade Prime',
    document: '35211434000115',
    filePath: 'fornecedores/mobilidade-prime.pdf',
    activatedAt: '15/02/2026',
    deactivatedAt: null,
    linkedBranches: 4,
    linkedContracts: 2,
    vehicles: 18,
    status: 'aprovado',
  },
  {
    id: 2,
    name: 'Fornecedor Alpha',
    document: '02914460028241',
    filePath: 'fornecedores/alpha.pdf',
    activatedAt: '01/01/2026',
    deactivatedAt: null,
    linkedBranches: 6,
    linkedContracts: 3,
    vehicles: 24,
    status: 'aprovado',
  },
  {
    id: 3,
    name: 'Transporte Executivo BR',
    document: '11894222000190',
    filePath: null,
    activatedAt: '10/09/2025',
    deactivatedAt: null,
    linkedBranches: 2,
    linkedContracts: 1,
    vehicles: 9,
    status: 'pendente',
  },
  {
    id: 4,
    name: 'Logística Nova Rota',
    document: '45678912000133',
    filePath: 'fornecedores/nova-rota.pdf',
    activatedAt: '01/11/2025',
    deactivatedAt: null,
    linkedBranches: 3,
    linkedContracts: 1,
    vehicles: 14,
    status: 'em_andamento',
  },
  {
    id: 5,
    name: 'Fleet Serviços Integrados',
    document: '73125888000155',
    filePath: 'fornecedores/fleet-servicos.pdf',
    activatedAt: '01/03/2026',
    deactivatedAt: null,
    linkedBranches: 5,
    linkedContracts: 2,
    vehicles: 31,
    status: 'aprovado',
  },
  {
    id: 6,
    name: 'Rota Sul Transportes',
    document: '09055123000174',
    filePath: 'fornecedores/rota-sul.pdf',
    activatedAt: '21/06/2025',
    deactivatedAt: '08/03/2026',
    linkedBranches: 1,
    linkedContracts: 0,
    vehicles: 0,
    status: 'cancelado',
  },
];

export const formatDocument = (document: string) => {
  if (document.length === 14) {
    return document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  if (document.length === 11) {
    return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  return document;
};
