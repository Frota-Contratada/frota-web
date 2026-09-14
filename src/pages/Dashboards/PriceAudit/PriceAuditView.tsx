import { useEffect, useMemo, useState } from 'react';
import { StatCard, Table, TableToolbar, type ColumnDef, StatusBadge, type BadgeStatus } from '../../../components/common';
import {
  supplierApi,
  ridesApi,
  extractListData,
  type FornecedorDto,
  type SolicitacaoDto,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface AuditRideRow {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  origem: string;
  destino: string;
  distanciaEstimada: string;
  distanciaPercorrida: string;
  status: BadgeStatus;
  preco: string;
}

const columns: ColumnDef<AuditRideRow>[] = [
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
  { key: 'origem', header: 'Origem', sortable: true },
  { key: 'destino', header: 'Destino', sortable: true },
  { key: 'distanciaEstimada', header: 'KM Estimado' },
  { key: 'distanciaPercorrida', header: 'KM Real' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'preco',
    header: 'Valor',
    sortable: true,
    render: (val) => <strong className={styles.primaryText}>{String(val)}</strong>,
  },
];

export const PriceAuditView = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<FornecedorDto[]>([]);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      supplierApi.list(),
      ridesApi.list(),
    ]).then(([suppRes, ridesRes]) => {
      if (!isMounted) return;

      if (suppRes.status === 'fulfilled') {
        setSuppliers(extractListData<FornecedorDto>(suppRes.value));
      }
      if (ridesRes.status === 'fulfilled') {
        setRides(extractListData<SolicitacaoDto>(ridesRes.value));
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const tableData: AuditRideRow[] = useMemo(() => {
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
        origem: r.origem?.logradouro || r.origem?.cidade || '—',
        destino: r.destino?.logradouro || r.destino?.cidade || '—',
        distanciaEstimada: (r.distanciaEstimadaKm ?? r.distanciaKm) ? `${r.distanciaEstimadaKm ?? r.distanciaKm} km` : '—',
        distanciaPercorrida: r.corrida?.kmPercorrido ? `${r.corrida.kmPercorrido} km` : '—',
        status: badgeStatus,
        preco: precoFmt,
      };
    });
  }, [rides]);

  const priceAuditFilterSections = [
    {
      title: 'Status',
      options: [
        { label: 'Concluído', value: 'status:aprovado' },
        { label: 'Pendente', value: 'status:pendente' },
        { label: 'Em andamento', value: 'status:em_andamento' },
      ],
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.some((filter) => {
      const [key, val] = filter.split(':');
      if (key === 'status') return item.status === val;
      return true;
    });
  });

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={priceAuditFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      <section className={styles.statsGrid}>
        <StatCard
          title="Fornecedores homologados"
          value={String(suppliers.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Solicitações monitoradas"
          value={String(rides.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Conformidade de rota"
          value="Em auditoria"
          isLoading={isLoading}
        />
        <StatCard
          title="Auditoria de desvios"
          value="Regular"
          isLoading={isLoading}
        />
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Conformidade de quilometragem estimada vs real</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>O backend ainda não disponibiliza endpoint de telemetria comparativa de KM por fornecedor. Gráfico preparado para integração futura.</small>
            </div>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução de desvios tarifários</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>Aguardando disponibilização de modelo analítico de auditoria de sobrepreço no backend.</small>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhuma corrida registrada para auditoria."
          isLoading={isLoading}
        />
      </section>
    </div>
  );
};
