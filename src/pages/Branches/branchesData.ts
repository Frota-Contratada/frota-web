import type { BadgeStatus } from '../../components/common';

export type Branch = {
  id: number;
  name: string;
  cnpj?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  costCenters: number;
  suppliers: number;
  requests: number;
  activatedAt: string;
  deactivatedAt: string | null;
  status: BadgeStatus;
};

export const branches: Branch[] = [
  {
    id: 301,
    name: 'Seara Itajaí',
    address: 'Av. Marginal Oeste, 1200',
    neighborhood: 'Cordeiros',
    city: 'Itajaí',
    state: 'SC',
    zipCode: '88310-000',
    costCenters: 8,
    suppliers: 3,
    requests: 42,
    activatedAt: '01/01/2026',
    deactivatedAt: null,
    status: 'aprovado',
  },
  {
    id: 302,
    name: 'CD Jundiaí',
    address: 'Rod. Anhanguera, km 59',
    neighborhood: 'Distrito Industrial',
    city: 'Jundiaí',
    state: 'SP',
    zipCode: '13213-000',
    costCenters: 12,
    suppliers: 4,
    requests: 58,
    activatedAt: '01/01/2026',
    deactivatedAt: null,
    status: 'aprovado',
  },
  {
    id: 303,
    name: 'São Paulo - Matriz',
    address: 'Av. das Nações Unidas, 14401',
    neighborhood: 'Vila Gertrudes',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04794-000',
    costCenters: 18,
    suppliers: 5,
    requests: 73,
    activatedAt: '01/01/2026',
    deactivatedAt: null,
    status: 'aprovado',
  },
  {
    id: 304,
    name: 'Filial Curitiba',
    address: 'Rua João Bettega, 5200',
    neighborhood: 'CIC',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '81350-000',
    costCenters: 7,
    suppliers: 2,
    requests: 29,
    activatedAt: '10/02/2026',
    deactivatedAt: null,
    status: 'em_andamento',
  },
  {
    id: 305,
    name: 'CD Recife',
    address: 'BR-101 Sul, 900',
    neighborhood: 'Prazeres',
    city: 'Jaboatão dos Guararapes',
    state: 'PE',
    zipCode: '54335-000',
    costCenters: 6,
    suppliers: 2,
    requests: 18,
    activatedAt: '05/03/2026',
    deactivatedAt: null,
    status: 'pendente',
  },
  {
    id: 306,
    name: 'Filial Olinda',
    address: 'Av. Presidente Kennedy, 2100',
    neighborhood: 'Peixinhos',
    city: 'Olinda',
    state: 'PE',
    zipCode: '53230-000',
    costCenters: 3,
    suppliers: 1,
    requests: 7,
    activatedAt: '15/07/2025',
    deactivatedAt: '30/04/2026',
    status: 'cancelado',
  },
];
