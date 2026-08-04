import { useState } from 'react';
import styles from './Home.module.css';
import { Table, StatusBadge, StatCard, TableToolbar, useToast, type ColumnDef, type DateRangeFilterValue, type FilterSection, type TableAction } from '../../components/common';
import type { BadgeStatus } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';

type Solicitacao = {
  id: number;
  data: string;
  solicitante: string;
  valor: string;
  distancia: string;
  motivo: string;
  status: BadgeStatus;
};

const mockData: Solicitacao[] = [
  { id: 1,  data: '13/03/2026', solicitante: 'Maria Julia',        valor: 'R$ 119,99', distancia: '54km',  motivo: 'Viagem a negócios',         status: 'pendente'  },
  { id: 2,  data: '11/04/2026', solicitante: 'Brenda Carvalho',    valor: 'R$ 435,54', distancia: '125km', motivo: 'Mudança de filial',          status: 'pendente'  },
  { id: 3,  data: '05/04/2009', solicitante: 'Clara Leão',         valor: 'R$ 45,54',  distancia: '12km',  motivo: 'Comprar remédios',           status: 'pendente'  },
  { id: 4,  data: '05/04/2026', solicitante: 'Juliana Cardoso',    valor: 'R$ 85,90',  distancia: '32km',  motivo: 'Viagem a negócios',          status: 'rejeitado' },
  { id: 5,  data: '04/04/2026', solicitante: 'Matheus Silva',      valor: 'R$ 232,84', distancia: '85km',  motivo: 'Emergência em outra filial', status: 'pendente'  },
  { id: 6,  data: '02/04/2026', solicitante: 'Lara Jean',          valor: 'R$ 35,90',  distancia: '13km',  motivo: 'Volta para casa',            status: 'rejeitado' },
  { id: 7,  data: '02/04/2026', solicitante: 'Marcelo Modolo',     valor: 'R$ 74,99',  distancia: '12km',  motivo: 'Comprar remédios',           status: 'pendente'  },
  { id: 8,  data: '02/04/2026', solicitante: 'Peter Parker',       valor: 'R$ 97,85',  distancia: '22km',  motivo: 'Volta para casa',            status: 'rejeitado' },
  { id: 9,  data: '01/04/2026', solicitante: 'Juliano Floss',      valor: 'R$ 55,54',  distancia: '20km',  motivo: 'Ida ao supermercado',        status: 'pendente'  },
  { id: 10, data: '31/03/2026', solicitante: 'Ana Paula',          valor: 'R$ 88,00',  distancia: '40km',  motivo: 'Reunião externa',            status: 'aprovado'  },
  { id: 11, data: '30/03/2026', solicitante: 'Carlos Henrique',    valor: 'R$ 210,00', distancia: '95km',  motivo: 'Viagem a negócios',          status: 'aprovado'  },
  { id: 12, data: '29/03/2026', solicitante: 'Fernanda Lima',      valor: 'R$ 67,30',  distancia: '28km',  motivo: 'Comprar remédios',           status: 'pendente'  },
];

const PAGE_SIZE = 5;

const columns: ColumnDef<Solicitacao>[] = [
  { key: 'data',       header: 'Data', sortable: true },
  {
    key: 'solicitante',
    header: 'Solicitante',
    sortable: true,
    render: (_, row) => <strong style={{ fontWeight: 600 }}>{row.solicitante}</strong>,
  },
  { key: 'valor',     header: 'Valor aproximado', sortable: true },
  { key: 'distancia', header: 'Distância Estimada', sortable: true },
  { key: 'motivo',    header: 'Motivo', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
];

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Pendente', value: 'status:pendente' },
      { label: 'Aprovado', value: 'status:aprovado' },
      { label: 'Rejeitado', value: 'status:rejeitado' },
    ],
  },
  {
    title: 'Motivo',
    options: [
      { label: 'Viagem a negócios', value: 'motivo:Viagem a negócios' },
      { label: 'Comprar remédios', value: 'motivo:Comprar remédios' },
      { label: 'Volta para casa', value: 'motivo:Volta para casa' },
      { label: 'Mudança de filial', value: 'motivo:Mudança de filial' },
    ],
  },
  {
    title: 'Distância',
    options: [
      { label: 'Até 20km', value: 'distancia:ate-20' },
      { label: '21km a 60km', value: 'distancia:21-60' },
      { label: 'Acima de 60km', value: 'distancia:acima-60' },
    ],
  },
];

const actions: TableAction<Solicitacao>[] = [
  {
    icon: <RedirecionarIcon width={18} height={18} />,
    label: 'Ver detalhes',
    onClick: (row) => console.log('Ver detalhes', row.id),
  },
];

const parsePtBrDate = (date: string) => {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const parseIsoDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const matchesDateRange = (date: string, range: DateRangeFilterValue) => {
  if (!range.from && !range.to) return true;

  const itemDate = parsePtBrDate(date);
  const from = range.from ? parseIsoDate(range.from) : null;
  const to = range.to ? parseIsoDate(range.to) : null;

  if (from && itemDate < from) return false;
  if (to && itemDate > to) return false;

  return true;
};

const getDistanceValue = (distancia: string) => Number(distancia.replace(/\D/g, ''));

const matchesDistanceFilter = (distancia: string, filters: string[]) => {
  if (filters.length === 0) return true;

  const distance = getDistanceValue(distancia);

  return filters.some((filter) => {
    if (filter === 'ate-20') return distance <= 20;
    if (filter === '21-60') return distance >= 21 && distance <= 60;
    if (filter === 'acima-60') return distance > 60;
    return false;
  });
};

export const Home = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>({ from: '', to: '' });
  const { showToast } = useToast();

  const statusFilters = selectedFilters
    .filter((filter) => filter.startsWith('status:'))
    .map((filter) => filter.replace('status:', ''));
  const motivoFilters = selectedFilters
    .filter((filter) => filter.startsWith('motivo:'))
    .map((filter) => filter.replace('motivo:', ''));
  const distanciaFilters = selectedFilters
    .filter((filter) => filter.startsWith('distancia:'))
    .map((filter) => filter.replace('distancia:', ''));

  const filteredData = mockData.filter((item) => {
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
    const matchesMotivo = motivoFilters.length === 0 || motivoFilters.includes(item.motivo);
    const matchesDistance = matchesDistanceFilter(item.distancia, distanciaFilters);
    const matchesDate = matchesDateRange(item.data, dateRange);

    return matchesStatus && matchesMotivo && matchesDistance && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <StatCard
          title="Gasto total"
          value="R$ 20.000"
          trend={{ value: 8.5, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard
          title="Preço médio"
          value="R$ 229"
          trend={{ value: 10, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard
          title="Top centro de custo"
          value="CT-13313"
          trend={{ value: 1.5, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard
          title="Maior preço"
          value="R$ 600"
        />
      </div>
      <TableToolbar
        onSearch={(q) => {
          if (q.length > 2) {
            showToast({ type: 'info', title: 'Busca aplicada', description: `Buscando por "${q}"` });
          }
        }}
        onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'O arquivo será preparado em instantes.' })}
        filterSections={filterSections}
        selectedFilters={selectedFilters}
        dateRange={dateRange}
        onDateRangeChange={(value) => {
          setDateRange(value);
          setCurrentPage(1);
        }}
        onFilterChange={(values) => {
          setSelectedFilters(values);
          setCurrentPage(1);
        }}
        onFilterApply={() => showToast({ type: 'success', title: 'Filtro aplicado', description: 'A tabela foi atualizada.' })}
        onFilterClear={() => {
          setDateRange({ from: '', to: '' });
          setCurrentPage(1);
          showToast({ type: 'info', title: 'Filtros limpos' });
        }}
      />
      <Table
        columns={columns}
        data={pageData}
        keyExtractor={(r) => r.id}
        actions={actions}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};
