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
  collaborator?: string;
  vehiclePlate: string;
  vehicleType: string;
  startedAt: string;
  finishedAt: string | null;
  rideDate?: string;
  distanceKm: number;
  finalValue: string;
  extraExpenses: string;
  status: RideStatus;
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
