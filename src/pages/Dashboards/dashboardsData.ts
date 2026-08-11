export type ExecutiveTableRow = {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  destino: string;
  status: 'Concluído' | 'Pendente' | 'Em andamento';
  distanciaEstimada: string;
  distanciaPercorrida: string;
  preco: string;
};

export type ExpensesTableRow = {
  id: number;
  centroCusto: string;
  responsavel: string;
  valor: string;
};

export type PriceAuditTableRow = {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  fornecedor: string;
  distanciaEstimada: string;
  distanciaPercorrida: string;
  desvios: string;
  preco: string;
};

export const executiveTableData: ExecutiveTableRow[] = [
  {
    id: 1,
    data: '13/03/2026',
    solicitante: 'Maria julia',
    email: 'maria.julia@seara.com',
    destino: 'Fórum de Amparo',
    status: 'Concluído',
    distanciaEstimada: '2.4km',
    distanciaPercorrida: '2.4km',
    preco: 'R$202.87',
  },
  {
    id: 2,
    data: '11/04/2026',
    solicitante: 'Brenda Carvalho',
    email: 'brenda.carvalho@seara.com',
    destino: 'Fórum de Amparo',
    status: 'Pendente',
    distanciaEstimada: '15km',
    distanciaPercorrida: '15km',
    preco: 'R$948.55',
  },
  {
    id: 3,
    data: '05/04/2009',
    solicitante: 'Clara Leão',
    email: 'clara.leao@seara.com',
    destino: 'Fábrica de Ração',
    status: 'Concluído',
    distanciaEstimada: '12km',
    distanciaPercorrida: '13km',
    preco: 'R$406.27',
  },
  {
    id: 4,
    data: '05/04/2026',
    solicitante: 'Juliana Cardoso',
    email: 'juliana.cardoso@seara.com',
    destino: 'Campinas (Aeroporto)',
    status: 'Concluído',
    distanciaEstimada: '32km',
    distanciaPercorrida: '37km',
    preco: 'R$601.13',
  },
  {
    id: 5,
    data: '04/04/2026',
    solicitante: 'Matheus Silva',
    email: 'matheus.silva@seara.com',
    destino: 'Cotia',
    status: 'Em andamento',
    distanciaEstimada: '2km',
    distanciaPercorrida: '—',
    preco: 'R$56.28',
  },
];

export const expensesTableData: ExpensesTableRow[] = [
  { id: 1, centroCusto: 'CT-410203', responsavel: 'Marcos Aurélio', valor: 'R$202.87' },
  { id: 2, centroCusto: 'CT-122132', responsavel: 'Joana Pereira', valor: 'R$948.55' },
  { id: 3, centroCusto: 'CT-672652', responsavel: 'Carlos Nóbrega', valor: 'R$406.27' },
  { id: 4, centroCusto: 'CT-096443', responsavel: 'Julio Fernando', valor: 'R$601.13' },
  { id: 5, centroCusto: 'CT-875426', responsavel: 'Matheus Hideki', valor: 'R$56.28' },
];

export const priceAuditTableData: PriceAuditTableRow[] = [
  {
    id: 1,
    data: '13/03/2026',
    solicitante: 'Maria julia',
    email: 'maria.julia@seara.com',
    fornecedor: 'Viex',
    distanciaEstimada: '2.4km',
    distanciaPercorrida: '2.4km',
    desvios: '15%',
    preco: 'R$202.87',
  },
  {
    id: 2,
    data: '11/04/2026',
    solicitante: 'Brenda Carvalho',
    email: 'brenda.carvalho@seara.com',
    fornecedor: 'Fretado',
    distanciaEstimada: '15km',
    distanciaPercorrida: '15km',
    desvios: '10%',
    preco: 'R$948.55',
  },
  {
    id: 3,
    data: '05/04/2009',
    solicitante: 'Clara Leão',
    email: 'clara.leao@seara.com',
    fornecedor: 'Express',
    distanciaEstimada: '12km',
    distanciaPercorrida: '13km',
    desvios: '4%',
    preco: 'R$406.27',
  },
  {
    id: 4,
    data: '05/04/2026',
    solicitante: 'Juliana Cardoso',
    email: 'juliana.cardoso@seara.com',
    fornecedor: 'Cars Company',
    distanciaEstimada: '32km',
    distanciaPercorrida: '37km',
    desvios: '2%',
    preco: 'R$601.13',
  },
];
