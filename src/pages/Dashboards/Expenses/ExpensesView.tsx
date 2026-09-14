import { useEffect, useMemo, useState } from 'react';
import { StatCard, Table, TableToolbar, type ColumnDef, StatusBadge } from '../../../components/common';
import {
  costCenterApi,
  ridesApi,
  extractListData,
  type CentroCustoDto,
  type SolicitacaoDto,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface ExpensesRow {
  id: number;
  centroCusto: string;
  nome: string;
  aprovador: string;
  ativo: boolean;
}

const columns: ColumnDef<ExpensesRow>[] = [
  {
    key: 'centroCusto',
    header: 'Centro de Custo',
    sortable: true,
    render: (val) => <strong className={styles.primaryText}>{String(val)}</strong>,
  },
  { key: 'nome', header: 'Nome do Centro', sortable: true },
  { key: 'aprovador', header: 'Aprovador Vinculado', sortable: true },
  {
    key: 'ativo',
    header: 'Status',
    sortable: true,
    render: (val) => <StatusBadge status={val ? 'aprovado' : 'cancelado'} />,
  },
];

export const ExpensesView = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<CentroCustoDto[]>([]);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      costCenterApi.list(),
      ridesApi.list(),
    ]).then(([ccRes, ridesRes]) => {
      if (!isMounted) return;

      if (ccRes.status === 'fulfilled') {
        setCostCenters(extractListData<CentroCustoDto>(ccRes.value));
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

  const tableData: ExpensesRow[] = useMemo(() => {
    return costCenters.map((cc) => ({
      id: cc.numero,
      centroCusto: `CC-${cc.numero}`,
      nome: cc.nome,
      aprovador: cc.temAprovador ? 'Vinculado' : 'Pendente',
      ativo: cc.ativo !== false,
    }));
  }, [costCenters]);

  const expensesFilterSections = [
    {
      title: 'Status',
      options: [
        { label: 'Ativo', value: 'status:ativo' },
        { label: 'Inativo', value: 'status:inativo' },
      ],
    },
    {
      title: 'Aprovador',
      options: [
        { label: 'Com aprovador', value: 'aprovador:Vinculado' },
        { label: 'Sem aprovador', value: 'aprovador:Pendente' },
      ],
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    const statusFilters = selectedFilters.filter(f => f.startsWith('status:')).map(f => f.replace('status:', ''));
    const aprovadorFilters = selectedFilters.filter(f => f.startsWith('aprovador:')).map(f => f.replace('aprovador:', ''));

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.ativo ? 'ativo' : 'inativo');
    const matchesAprovador = aprovadorFilters.length === 0 || aprovadorFilters.includes(item.aprovador);

    return matchesStatus && matchesAprovador;
  });

  const totalSpent = rides.reduce((sum, r) => {
    const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const ccsWithApprover = costCenters.filter((c) => c.temAprovador).length;

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={expensesFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      <section className={styles.statsGrid}>
        <StatCard
          title="Centros de custo cadastrados"
          value={String(costCenters.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Com aprovador atribuído"
          value={String(ccsWithApprover)}
          isLoading={isLoading}
        />
        <StatCard
          title="Total estimado de viagens"
          value={totalSpent > 0 ? `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
          isLoading={isLoading}
        />
        <StatCard
          title="Solicitações alocadas"
          value={String(rides.length)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gastos agregados por centro de custo</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>O backend ainda não possui endpoint de agregação contábil por centro de custo. Gráfico preparado para integração futura.</small>
            </div>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução mensal de despesas</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center', padding: '1rem', background: 'var(--color-surface, #f9fafb)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <span style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Métrica Analítica em Preparação</span>
              <small>Aguardando disponibilização de série temporal de liquidação financeira no backend.</small>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhum centro de custo registrado."
          isLoading={isLoading}
        />
      </section>
    </div>
  );
};
