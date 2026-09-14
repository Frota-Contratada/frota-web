import { useEffect, useMemo, useState } from 'react';
import {
  StatCard,
  Table,
  TableToolbar,
  StatusBadge,
  type ColumnDef,
  type BadgeStatus,
} from '../../../components/common';
import {
  ridesApi,
  supplierApi,
  contractApi,
  extractListData,
  type SolicitacaoDto,
  type FornecedorBigNumbers,
  type ContratoBigNumbers,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface ExecRideRow {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  destino: string;
  status: BadgeStatus;
  distanciaEstimada: string;
  distanciaPercorrida: string;
  preco: string;
}

const columns: ColumnDef<ExecRideRow>[] = [
  { key: 'data', header: 'Data', sortable: true },
  {
    key: 'solicitante',
    header: 'Solicitante',
    sortable: true,
    render: (_, row) => (
      <div className={styles.userInfo}>
        <span className={styles.userName}>{row.solicitante}</span>
        <span className={styles.userEmail}>{row.email}</span>
      </div>
    ),
  },
  { key: 'destino', header: 'Destino', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
  { key: 'distanciaEstimada', header: 'Distância estimada' },
  { key: 'distanciaPercorrida', header: 'Distância percorrida' },
  {
    key: 'preco',
    header: 'Preço',
    sortable: true,
    render: (value) => <strong className={styles.primaryText}>{String(value)}</strong>,
  },
];

export const ExecutiveView = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [supplierBigNumbers, setSupplierBigNumbers] = useState<FornecedorBigNumbers | null>(null);
  const [contractBigNumbers, setContractBigNumbers] = useState<ContratoBigNumbers | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      ridesApi.list(),
      supplierApi.getAdminBigNumbers().catch(() => supplierApi.getFilialBigNumbers()),
      contractApi.getAdminBigNumbers().catch(() => contractApi.getFilialBigNumbers()),
    ]).then(([ridesRes, suppRes, contRes]) => {
      if (!isMounted) return;

      if (ridesRes.status === 'fulfilled') {
        setRides(extractListData<SolicitacaoDto>(ridesRes.value));
      }
      if (suppRes.status === 'fulfilled' && suppRes.value?.response) {
        setSupplierBigNumbers(suppRes.value.response);
      }
      if (contRes.status === 'fulfilled' && contRes.value?.response) {
        setContractBigNumbers(contRes.value.response);
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const tableData: ExecRideRow[] = useMemo(() => {
    return rides.map((r) => {
      const rawStatus = (r.status || '').toUpperCase();
      let badgeStatus: BadgeStatus = 'em_andamento';
      if (rawStatus === 'CONCLUIDA' || rawStatus === 'FINALIZADA') badgeStatus = 'aprovado';
      else if (rawStatus === 'CANCELADA' || rawStatus === 'RECUSADA') badgeStatus = 'cancelado';
      else if (rawStatus === 'PENDENTE' || rawStatus === 'AGUARDANDO_APROVACAO') badgeStatus = 'pendente';

      const valorCalculado = r.corrida?.valorFinal ?? r.valorEstimado;
      const precoFmt = valorCalculado
        ? `R$ ${Number(valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      return {
        id: r.id,
        data: r.dataCorrida ? new Date(r.dataCorrida).toLocaleDateString('pt-BR') : '—',
        solicitante: r.solicitanteNome || 'Colaborador',
        email: '—',
        destino: r.destino?.logradouro || r.destino?.cidade || '—',
        status: badgeStatus,
        distanciaEstimada: (r.distanciaEstimadaKm ?? r.distanciaKm) ? `${r.distanciaEstimadaKm ?? r.distanciaKm} km` : '—',
        distanciaPercorrida: r.corrida?.kmPercorrido ? `${r.corrida.kmPercorrido} km` : '—',
        preco: precoFmt,
      };
    });
  }, [rides]);

  const executiveFilterSections = [
    {
      title: 'Status',
      options: [
        { label: 'Concluído', value: 'status:aprovado' },
        { label: 'Pendente', value: 'status:pendente' },
        { label: 'Em andamento', value: 'status:em_andamento' },
        { label: 'Cancelado', value: 'status:cancelado' },
      ],
    },
  ];

  const filteredTableData = tableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.some((filter) => {
      const [key, val] = filter.split(':');
      if (key === 'status') return item.status === val;
      return true;
    });
  });

  const completedCount = rides.filter((r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'CONCLUIDA' || s === 'FINALIZADA';
  }).length;

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={executiveFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      <section className={styles.statsGrid}>
        <StatCard
          title="Total de solicitações"
          value={String(rides.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Corridas concluídas"
          value={String(completedCount)}
          isLoading={isLoading}
        />
        <StatCard
          title="Fornecedores ativos"
          value={String(supplierBigNumbers?.fornecedoresAtivos ?? '—')}
          isLoading={isLoading}
        />
        <StatCard
          title="Contratos vigentes"
          value={String(contractBigNumbers?.validos ?? '—')}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gasto temporal consolidado</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>O backend atual não disponibiliza endpoint de série temporal agregada de gastos. Interface pronta para integração futura.</small>
            </div>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Rateio de gastos por fornecedor</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>Aguardando disponibilização de endpoint de conciliação financeira por fornecedor no backend.</small>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={filteredTableData}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhuma corrida registrada na visão executiva."
          isLoading={isLoading}
        />
      </section>
    </div>
  );
};
