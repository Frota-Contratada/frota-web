import type { BadgeStatus } from '../../components/common';

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
