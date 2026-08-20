import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { type RequestStatus, type RideRequest } from './listingsData';
import { ridesApi, extractListData, type SolicitacaoDto } from '../../services';
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
  const [requestsList, setRequestsList] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    ridesApi.list()
      .then((res) => {
        if (!isMounted) return;
        const apiData = extractListData<SolicitacaoDto>(res);
        const mapped: RideRequest[] = apiData.map((s) => {
          const rawStatus = (s.status || 'PENDENTE').toUpperCase();
          let status: RequestStatus = 'P';
          if (rawStatus.includes('APROV')) status = 'A';
          else if (rawStatus.includes('RECUS') || rawStatus.includes('REPROV')) status = 'R';
          else if (rawStatus.includes('CANCEL')) status = 'C';

          const costCentersCount = s.centrosCusto?.length ?? 1;
          const costCenterName = s.centrosCusto?.[0]?.centroCustoNome
            ? `CC-${s.centrosCusto[0].centroCustoId} (${s.centrosCusto[0].centroCustoNome})`
            : s.centrosCusto?.[0]?.centroCustoId
            ? `CC-${s.centrosCusto[0].centroCustoId}`
            : '—';

          const totalPassengers = s.passageiros?.length || 1;
          const rideDistance = s.distanciaEstimadaKm ?? s.distanciaKm ?? 0;
          const rideValue = s.valorEstimado
            ? `R$ ${Number(s.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'R$ 0,00';

          return {
            id: s.id,
            requester: s.solicitanteNome || 'Solicitante',
            supplier: s.fornecedorNome || (s.fornecedorId ? `Fornecedor #${s.fornecedorId}` : '—'),
            createdAt: s.dataCriacao || s.createdAt || new Date().toISOString(),
            rideAt: s.dataCorrida ? new Date(s.dataCorrida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            rideType: s.tipoCorrida?.nome || '—',
            origin: s.origem?.logradouro ? `${s.origem.logradouro}${s.origem.numero ? `, ${s.origem.numero}` : ''}` : 'Origem',
            destination: s.destino?.logradouro ? `${s.destino.logradouro}${s.destino.numero ? `, ${s.destino.numero}` : ''}` : 'Destino',
            passengers: totalPassengers,
            costCenter: costCenterName,
            costCenters: costCentersCount,
            reason: s.motivoSolicitacao?.nome || s.motivo?.nome || '—',
            estimatedDistanceKm: rideDistance,
            estimatedValue: rideValue,
            status,
          };
        });
        setRequestsList(mapped);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar solicitações';
        showToast({ type: 'error', title: message });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const typeFilters = selectedFilters.filter((filter) => filter.startsWith('tipo:')).map((filter) => filter.replace('tipo:', ''));

    return requestsList.filter((request) => {
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
  }, [requestsList, query, selectedFilters]);

  const pendingRequests = requestsList.filter((request) => request.status === 'P').length;
  const approvedRequests = requestsList.filter((request) => request.status === 'A').length;
  const totalPassengers = requestsList.reduce((total, request) => total + request.passengers, 0);
  const totalDistance = requestsList.reduce((total, request) => total + request.estimatedDistanceKm, 0);
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
        <StatCard title="Solicitações abertas" value={String(pendingRequests)} isLoading={isLoading} />
        <StatCard title="Aprovadas" value={String(approvedRequests)} trend={{ value: 7.5, direction: 'up', label: 'vs. mês anterior' }} isLoading={isLoading} />
        <StatCard title="Passageiros" value={String(totalPassengers)} isLoading={isLoading} />
        <StatCard title="KM estimados" value={totalDistance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} isLoading={isLoading} />
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
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
