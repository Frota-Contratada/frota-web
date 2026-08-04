import { useMemo, useState } from 'react';
import { StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { rideHistory, type RideHistory, type RideStatus } from './listingsData';
import styles from './Listings.module.css';

const PAGE_SIZE = 5;

const rideStatusLabel: Record<RideStatus, string> = {
  I: 'Iniciada',
  F: 'Finalizada',
  C: 'Cancelada',
};

const rideStatusClass: Record<RideStatus, string> = {
  I: styles.info,
  F: styles.success,
  C: styles.danger,
};

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Iniciada', value: 'status:I' },
      { label: 'Finalizada', value: 'status:F' },
      { label: 'Cancelada', value: 'status:C' },
    ],
  },
  {
    title: 'Tipo de veículo',
    options: [
      { label: 'Sedan executivo', value: 'veiculo:Sedan executivo' },
      { label: 'Van', value: 'veiculo:Van' },
      { label: 'SUV', value: 'veiculo:SUV' },
      { label: 'Utilitário', value: 'veiculo:Utilitário' },
      { label: 'Hatch', value: 'veiculo:Hatch' },
    ],
  },
];

const columns: ColumnDef<RideHistory>[] = [
  {
    key: 'id',
    header: 'Corrida',
    sortable: true,
    render: (_, row) => <strong className={styles.primaryText}>#{row.id}</strong>,
  },
  { key: 'requestId', header: 'Solicitação', sortable: true, render: (_, row) => `#${row.requestId}` },
  { key: 'driver', header: 'Motorista', sortable: true },
  { key: 'supplier', header: 'Fornecedor', sortable: true },
  { key: 'vehiclePlate', header: 'Placa', sortable: true },
  { key: 'startedAt', header: 'Início', sortable: true },
  { key: 'distanceKm', header: 'KM percorrido', sortable: true, render: (_, row) => `${row.distanceKm.toLocaleString('pt-BR')} km` },
  { key: 'finalValue', header: 'Valor final', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <span className={`${styles.statusPill} ${rideStatusClass[row.status]}`}>{rideStatusLabel[row.status]}</span>,
  },
];

export const RideHistoryList = () => {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filteredRides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const vehicleFilters = selectedFilters.filter((filter) => filter.startsWith('veiculo:')).map((filter) => filter.replace('veiculo:', ''));

    return rideHistory.filter((ride) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        String(ride.id).includes(normalizedQuery) ||
        String(ride.requestId).includes(normalizedQuery) ||
        ride.driver.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        ride.supplier.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        ride.vehiclePlate.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(ride.status);
      const matchesVehicle = vehicleFilters.length === 0 || vehicleFilters.includes(ride.vehicleType);

      return matchesQuery && matchesStatus && matchesVehicle;
    });
  }, [query, selectedFilters]);

  const activeRides = rideHistory.filter((ride) => ride.status === 'I').length;
  const finishedRides = rideHistory.filter((ride) => ride.status === 'F').length;
  const totalKm = rideHistory.reduce((total, ride) => total + ride.distanceKm, 0);
  const ridesWithExpenses = rideHistory.filter((ride) => ride.extraExpenses !== 'R$ 0,00').length;
  const totalPages = Math.max(1, Math.ceil(filteredRides.length / PAGE_SIZE));
  const pageData = filteredRides.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<RideHistory>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar corrida',
      onClick: (row) => showToast({ type: 'info', title: `Corrida #${row.id}`, description: 'Tela de visualização será implementada na próxima etapa.' }),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo do histórico de corridas">
        <StatCard title="Em andamento" value={String(activeRides)} />
        <StatCard title="Finalizadas" value={String(finishedRides)} trend={{ value: 5.2, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="KM percorridos" value={totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} />
        <StatCard title="Com despesas" value={String(ridesWithExpenses)} />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'O histórico de corridas será preparado em instantes.' })}
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
          keyExtractor={(ride) => ride.id}
          actions={actions}
          emptyMessage="Nenhuma corrida encontrada."
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
