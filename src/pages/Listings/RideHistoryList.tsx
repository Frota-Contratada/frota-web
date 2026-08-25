import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { type RideHistory, type RideStatus } from './listingsData';
import { ridesApi, extractListData, type SolicitacaoDto } from '../../services';
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<RideHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    ridesApi.getViagens()
      .then((res) => {
        if (!isMounted) return;
        const apiData = extractListData<SolicitacaoDto>(res);
        const mapped: RideHistory[] = apiData.map((s, idx) => {
          const rawStatus = (s.corrida?.status || s.status || 'FINALIZADA').toUpperCase();
          let status: RideStatus = 'F';
          if (rawStatus.includes('INIC') || rawStatus.includes('ANDAMENTO') || s.emAndamento) status = 'I';
          else if (rawStatus.includes('CANCEL')) status = 'C';

          const driverName = s.corrida?.motoristaNome || '—';
          const supplierName = s.fornecedorNome || (s.fornecedorId ? `Fornecedor #${s.fornecedorId}` : '—');
          const plate = s.corrida?.placaVeiculo || '—';
          const vehicleName = s.tipoVeiculo?.nome || s.tipoCorrida?.nome || 'Veículo Padrão';
          const startTime = s.corrida?.dataInicio
            ? new Date(s.corrida.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : s.dataCorrida
            ? new Date(s.dataCorrida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '—';
          const finishTime = s.corrida?.dataFim
            ? new Date(s.corrida.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : null;
          const distance = s.corrida?.kmPercorrido ?? s.distanciaEstimadaKm ?? s.distanciaKm ?? 0;
          const totalVal = s.corrida?.valorFinal ?? s.valorEstimado ?? 0;
          const formattedVal = totalVal ? `R$ ${Number(totalVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';

          return {
            id: s.corrida?.id || s.id || idx + 1,
            requestId: s.id || idx + 1,
            driver: driverName,
            supplier: supplierName,
            vehiclePlate: plate,
            vehicleType: vehicleName,
            startedAt: startTime,
            finishedAt: finishTime,
            distanceKm: distance,
            finalValue: formattedVal,
            extraExpenses: '—',
            status,
          };
        });
        setHistoryList(mapped);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar histórico de viagens';
        showToast({ type: 'error', title: message });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const filteredRides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const vehicleFilters = selectedFilters.filter((filter) => filter.startsWith('veiculo:')).map((filter) => filter.replace('veiculo:', ''));

    return historyList.filter((ride) => {
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
  }, [historyList, query, selectedFilters]);

  const activeRides = historyList.filter((ride) => ride.status === 'I').length;
  const finishedRides = historyList.filter((ride) => ride.status === 'F').length;
  const totalKm = historyList.reduce((total, ride) => total + ride.distanceKm, 0);
  const ridesWithExpenses = historyList.filter((ride) => ride.extraExpenses !== 'R$ 0,00').length;
  const totalPages = Math.max(1, Math.ceil(filteredRides.length / PAGE_SIZE));
  const pageData = filteredRides.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<RideHistory>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar corrida',
      onClick: (row) => navigate(`/corridas/historico/${row.id}`),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo do histórico de corridas">
        <StatCard title="Em andamento" value={String(activeRides)} isLoading={isLoading} />
        <StatCard title="Finalizadas" value={String(finishedRides)} isLoading={isLoading} />
        <StatCard title="KM percorridos" value={totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} isLoading={isLoading} />
        <StatCard title="Com despesas" value={String(ridesWithExpenses)} isLoading={isLoading} />
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
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
