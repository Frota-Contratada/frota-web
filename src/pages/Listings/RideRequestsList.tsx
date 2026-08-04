import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { rideRequests, type RequestStatus, type RideRequest } from './listingsData';
import styles from './Listings.module.css';

const PAGE_SIZE = 5;

const requestStatusLabel: Record<RequestStatus, string> = {
  P: 'Pendente',
  A: 'Aprovada',
  R: 'Recusada',
  C: 'Cancelada',
};

const requestStatusClass: Record<RequestStatus, string> = {
  P: styles.warning,
  A: styles.success,
  R: styles.danger,
  C: styles.danger,
};

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Pendente', value: 'status:P' },
      { label: 'Aprovada', value: 'status:A' },
      { label: 'Recusada', value: 'status:R' },
      { label: 'Cancelada', value: 'status:C' },
    ],
  },
  {
    title: 'Tipo de corrida',
    options: [
      { label: 'Executiva', value: 'tipo:Executiva' },
      { label: 'Operacional', value: 'tipo:Operacional' },
      { label: 'Intermunicipal', value: 'tipo:Intermunicipal' },
      { label: 'Rota fixa', value: 'tipo:Rota fixa' },
      { label: 'Frota dedicada', value: 'tipo:Frota dedicada' },
    ],
  },
];

const columns: ColumnDef<RideRequest>[] = [
  {
    key: 'id',
    header: 'Solicitação',
    sortable: true,
    render: (_, row) => <strong className={styles.primaryText}>#{row.id}</strong>,
  },
  { key: 'requester', header: 'Solicitante', sortable: true },
  { key: 'supplier', header: 'Fornecedor', sortable: true },
  { key: 'rideAt', header: 'Data da corrida', sortable: true },
  { key: 'rideType', header: 'Tipo', sortable: true },
  {
    key: 'route',
    header: 'Rota',
    render: (_, row) => <span className={styles.mutedText}>{row.origin} → {row.destination}</span>,
  },
  { key: 'estimatedDistanceKm', header: 'KM estimado', sortable: true, render: (_, row) => `${row.estimatedDistanceKm.toLocaleString('pt-BR')} km` },
  { key: 'estimatedValue', header: 'Valor estimado', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <span className={`${styles.statusPill} ${requestStatusClass[row.status]}`}>{requestStatusLabel[row.status]}</span>,
  },
];

export const RideRequestsList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const typeFilters = selectedFilters.filter((filter) => filter.startsWith('tipo:')).map((filter) => filter.replace('tipo:', ''));

    return rideRequests.filter((request) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        String(request.id).includes(normalizedQuery) ||
        request.requester.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        request.supplier.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        request.origin.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        request.destination.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(request.status);
      const matchesType = typeFilters.length === 0 || typeFilters.includes(request.rideType);

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [query, selectedFilters]);

  const pendingRequests = rideRequests.filter((request) => request.status === 'P').length;
  const approvedRequests = rideRequests.filter((request) => request.status === 'A').length;
  const totalPassengers = rideRequests.reduce((total, request) => total + request.passengers, 0);
  const totalDistance = rideRequests.reduce((total, request) => total + request.estimatedDistanceKm, 0);
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const pageData = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<RideRequest>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Revisar solicitação',
      onClick: (row) => navigate(`/corridas/solicitacoes/${row.id}/revisar`),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo de solicitações de corridas">
        <StatCard title="Solicitações abertas" value={String(pendingRequests)} />
        <StatCard title="Aprovadas" value={String(approvedRequests)} trend={{ value: 7.5, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="Passageiros" value={String(totalPassengers)} />
        <StatCard title="KM estimados" value={totalDistance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de solicitações será preparada em instantes.' })}
          rightActions={<Button onClick={() => navigate('/corridas/solicitacoes/nova')}>Cadastrar solicitação</Button>}
          filterSections={filterSections}
          selectedFilters={selectedFilters}
          onFilterChange={(values) => {
            setSelectedFilters(values);
            setCurrentPage(1);
          }}
          onFilterApply={() => showToast({ type: 'success', title: 'Filtro aplicado', description: 'A tabela foi atualizada.' })}
          onFilterClear={() => {
            setSelectedFilters([]);
            setCurrentPage(1);
            showToast({ type: 'info', title: 'Filtros limpos' });
          }}
        />

        <Table
          columns={columns}
          data={pageData}
          keyExtractor={(request) => request.id}
          actions={actions}
          emptyMessage="Nenhuma solicitação encontrada."
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
