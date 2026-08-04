import type { BadgeStatus } from '../../components/common';

export type RequestStatus = 'P' | 'A' | 'R' | 'C';
export type RideStatus = 'I' | 'F' | 'C';

export type RideRequest = {
  id: number;
  requester: string;
  supplier: string;
  createdAt: string;
  rideAt: string;
  estimatedDistanceKm: number;
  rideType: string;
  origin: string;
  destination: string;
  estimatedValue: string;
  reason: string;
  costCenters: number;
  passengers: number;
  status: RequestStatus;
};

export type RideHistory = {
  id: number;
  requestId: number;
  driver: string;
  supplier: string;
  vehiclePlate: string;
  vehicleType: string;
  startedAt: string;
  finishedAt: string | null;
  distanceKm: number;
  finalValue: string;
  extraExpenses: string;
  status: RideStatus;
};

export type Employee = {
  id: number;
  name: string;
  branch: string | null;
  supplier: string | null;
  searaCode: string | null;
  email: string;
  role: string | null;
  cpf: string | null;
  available: boolean;
  activatedAt: string;
  deactivatedAt: string | null;
  profiles: string[];
  status: BadgeStatus;
};

export type Branch = {
  id: number;
  name: string;
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

export const formatCpf = (cpf: string | null) => {
  if (!cpf) return 'Não informado';

  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

export const rideRequests: RideRequest[] = [
  {
    id: 1042,
    requester: 'Marina Oliveira',
    supplier: 'Mobilidade Prime',
    createdAt: '28/05/2026 08:15',
    rideAt: '28/05/2026 14:30',
    estimatedDistanceKm: 18.6,
    rideType: 'Executiva',
    origin: 'Seara Itajaí',
    destination: 'Aeroporto Navegantes',
    estimatedValue: 'R$ 148,90',
    reason: 'Reunião externa',
    costCenters: 2,
    passengers: 3,
    status: 'A',
  },
  {
    id: 1041,
    requester: 'Rafael Mendes',
    supplier: 'Fornecedor Alpha',
    createdAt: '28/05/2026 07:40',
    rideAt: '28/05/2026 11:00',
    estimatedDistanceKm: 7.2,
    rideType: 'Operacional',
    origin: 'CD Jundiaí',
    destination: 'Filial Campinas',
    estimatedValue: 'R$ 72,30',
    reason: 'Transferência operacional',
    costCenters: 1,
    passengers: 1,
    status: 'P',
  },
  {
    id: 1040,
    requester: 'Bianca Rocha',
    supplier: 'Transporte Executivo BR',
    createdAt: '27/05/2026 16:10',
    rideAt: '29/05/2026 09:20',
    estimatedDistanceKm: 124.4,
    rideType: 'Intermunicipal',
    origin: 'São Paulo - Matriz',
    destination: 'Filial Sorocaba',
    estimatedValue: 'R$ 642,00',
    reason: 'Visita técnica',
    costCenters: 3,
    passengers: 4,
    status: 'A',
  },
  {
    id: 1039,
    requester: 'André Lima',
    supplier: 'Logística Nova Rota',
    createdAt: '27/05/2026 13:55',
    rideAt: '27/05/2026 18:00',
    estimatedDistanceKm: 31.8,
    rideType: 'Rota fixa',
    origin: 'CD Recife',
    destination: 'Filial Olinda',
    estimatedValue: 'R$ 211,40',
    reason: 'Rota de apoio',
    costCenters: 1,
    passengers: 2,
    status: 'C',
  },
  {
    id: 1038,
    requester: 'Clara Martins',
    supplier: 'Fleet Serviços Integrados',
    createdAt: '26/05/2026 15:22',
    rideAt: '30/05/2026 06:45',
    estimatedDistanceKm: 52.5,
    rideType: 'Frota dedicada',
    origin: 'Filial Curitiba',
    destination: 'Aeroporto Afonso Pena',
    estimatedValue: 'R$ 308,75',
    reason: 'Viagem corporativa',
    costCenters: 2,
    passengers: 2,
    status: 'P',
  },
  {
    id: 1037,
    requester: 'Jonas Paulo Teixeira',
    supplier: 'Mobilidade Prime',
    createdAt: '25/05/2026 10:12',
    rideAt: '25/05/2026 17:30',
    estimatedDistanceKm: 14.1,
    rideType: 'Executiva',
    origin: 'Seara Itajaí',
    destination: 'Hotel Centro',
    estimatedValue: 'R$ 119,80',
    reason: 'Recepção de fornecedor',
    costCenters: 1,
    passengers: 1,
    status: 'R',
  },
];

export const rideHistory: RideHistory[] = [
  {
    id: 8021,
    requestId: 1036,
    driver: 'Carlos Henrique',
    supplier: 'Mobilidade Prime',
    vehiclePlate: 'RTA4B21',
    vehicleType: 'Sedan executivo',
    startedAt: '28/05/2026 07:10',
    finishedAt: null,
    distanceKm: 12.4,
    finalValue: 'R$ 98,60',
    extraExpenses: 'R$ 0,00',
    status: 'I',
  },
  {
    id: 8020,
    requestId: 1035,
    driver: 'Aline Souza',
    supplier: 'Fornecedor Alpha',
    vehiclePlate: 'FRT9D02',
    vehicleType: 'Van',
    startedAt: '27/05/2026 18:30',
    finishedAt: '27/05/2026 20:05',
    distanceKm: 42.8,
    finalValue: 'R$ 356,20',
    extraExpenses: 'R$ 24,00',
    status: 'F',
  },
  {
    id: 8019,
    requestId: 1034,
    driver: 'Paulo Nascimento',
    supplier: 'Fleet Serviços Integrados',
    vehiclePlate: 'FLT2A77',
    vehicleType: 'SUV',
    startedAt: '27/05/2026 09:00',
    finishedAt: '27/05/2026 10:12',
    distanceKm: 25.3,
    finalValue: 'R$ 184,90',
    extraExpenses: 'R$ 12,50',
    status: 'F',
  },
  {
    id: 8018,
    requestId: 1033,
    driver: 'Renato Lopes',
    supplier: 'Logística Nova Rota',
    vehiclePlate: 'LNR8C14',
    vehicleType: 'Utilitário',
    startedAt: '26/05/2026 13:45',
    finishedAt: null,
    distanceKm: 0,
    finalValue: 'R$ 0,00',
    extraExpenses: 'R$ 0,00',
    status: 'C',
  },
  {
    id: 8017,
    requestId: 1032,
    driver: 'Fernanda Mota',
    supplier: 'Transporte Executivo BR',
    vehiclePlate: 'TEB7F91',
    vehicleType: 'Sedan executivo',
    startedAt: '26/05/2026 06:20',
    finishedAt: '26/05/2026 08:50',
    distanceKm: 96.7,
    finalValue: 'R$ 517,40',
    extraExpenses: 'R$ 38,00',
    status: 'F',
  },
  {
    id: 8016,
    requestId: 1031,
    driver: 'Mateus Rocha',
    supplier: 'Mobilidade Prime',
    vehiclePlate: 'MOB1E30',
    vehicleType: 'Hatch',
    startedAt: '25/05/2026 16:05',
    finishedAt: '25/05/2026 16:48',
    distanceKm: 13.8,
    finalValue: 'R$ 102,10',
    extraExpenses: 'R$ 0,00',
    status: 'F',
  },
];

export const employees: Employee[] = [
  {
    id: 501,
    name: 'Marina Oliveira',
    branch: 'Seara Itajaí',
    supplier: null,
    searaCode: 'SEARA-10293',
    email: 'marina.oliveira@seara.com',
    role: 'Coordenadora de Operações',
    cpf: '12345678901',
    available: true,
    activatedAt: '02/01/2026',
    deactivatedAt: null,
    profiles: ['Solicitante', 'Aprovador'],
    status: 'aprovado',
  },
  {
    id: 502,
    name: 'Rafael Mendes',
    branch: 'CD Jundiaí',
    supplier: null,
    searaCode: 'SEARA-10440',
    email: 'rafael.mendes@seara.com',
    role: 'Analista de Logística',
    cpf: '98765432100',
    available: true,
    activatedAt: '15/01/2026',
    deactivatedAt: null,
    profiles: ['Solicitante'],
    status: 'aprovado',
  },
  {
    id: 503,
    name: 'Carlos Henrique',
    branch: null,
    supplier: 'Mobilidade Prime',
    searaCode: null,
    email: 'carlos.henrique@mobilidadeprime.com',
    role: 'Motorista',
    cpf: '11122233344',
    available: true,
    activatedAt: '01/02/2026',
    deactivatedAt: null,
    profiles: ['Motorista'],
    status: 'aprovado',
  },
  {
    id: 504,
    name: 'Bianca Rocha',
    branch: 'São Paulo - Matriz',
    supplier: null,
    searaCode: 'SEARA-10712',
    email: 'bianca.rocha@seara.com',
    role: 'Gerente Regional',
    cpf: '22233344455',
    available: false,
    activatedAt: '20/11/2025',
    deactivatedAt: null,
    profiles: ['Aprovador'],
    status: 'em_andamento',
  },
  {
    id: 505,
    name: 'Aline Souza',
    branch: null,
    supplier: 'Fornecedor Alpha',
    searaCode: null,
    email: 'aline.souza@alpha.com',
    role: 'Motorista',
    cpf: '33344455566',
    available: true,
    activatedAt: '05/03/2026',
    deactivatedAt: null,
    profiles: ['Motorista'],
    status: 'aprovado',
  },
  {
    id: 506,
    name: 'Eduardo Nunes',
    branch: 'Filial Curitiba',
    supplier: null,
    searaCode: 'SEARA-09874',
    email: 'eduardo.nunes@seara.com',
    role: 'Assistente Administrativo',
    cpf: '44455566677',
    available: false,
    activatedAt: '12/08/2025',
    deactivatedAt: '10/04/2026',
    profiles: ['Solicitante'],
    status: 'cancelado',
  },
];

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
