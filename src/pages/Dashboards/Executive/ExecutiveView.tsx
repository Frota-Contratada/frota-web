import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
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
  dashboardApi,
  extractListData,
  type SolicitacaoDto,
  type FornecedorBigNumbers,
  type ContratoBigNumbers,
  type DashboardExecutivoDto,
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

const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const PIE_COLORS = ['#2C2C9E', '#0052cc', '#00a3ff', '#70d6ff', '#f59e0b', '#10b981', '#6366f1'];

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
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardExecutivoDto | null>(null);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [supplierBigNumbers, setSupplierBigNumbers] = useState<FornecedorBigNumbers | null>(null);
  const [contractBigNumbers, setContractBigNumbers] = useState<ContratoBigNumbers | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      dashboardApi.getExecutivo(),
      ridesApi.list(),
      supplierApi.getAdminBigNumbers().catch(() => supplierApi.getFilialBigNumbers()),
      contractApi.getAdminBigNumbers().catch(() => contractApi.getFilialBigNumbers()),
    ]).then(([dashRes, ridesRes, suppRes, contRes]) => {
      if (!isMounted) return;

      if (dashRes.status === 'fulfilled' && dashRes.value?.response) {
        setDashboardData(dashRes.value.response);
      }
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
      const precoFmt = valorCalculado != null && !isNaN(Number(valorCalculado))
        ? `R$ ${Number(valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      return {
        id: r.id,
        data: r.dataCorrida ? new Date(r.dataCorrida).toLocaleDateString('pt-BR') : '—',
        solicitante: r.solicitanteNome || (r.passageiros?.[0]?.nome ?? 'Colaborador'),
        email: r.passageiros?.[0]?.cpf ? `CPF: ${r.passageiros[0].cpf}` : '—',
        destino: r.destino?.cidade ? `${r.destino.cidade} (${r.destino.logradouro || ''})` : (r.destino?.logradouro || '—'),
        status: badgeStatus,
        distanciaEstimada: (r.distanciaEstimadaKm ?? r.distanciaKm) ? `${r.distanciaEstimadaKm ?? r.distanciaKm} km` : '—',
        distanciaPercorrida: r.corrida?.kmPercorrido ? `${r.corrida.kmPercorrido} km` : '—',
        preco: precoFmt,
      };
    });
  }, [rides]);

  const monthlyChartData = useMemo(() => {
    if (dashboardData?.gastoMensal && dashboardData.gastoMensal.length > 0) {
      return dashboardData.gastoMensal.map((g) => ({
        name: g.mes,
        valor: Math.round(g.gasto),
      }));
    }
    if (rides.length === 0) return [];
    const map: Record<string, number> = {};
    rides.forEach((r) => {
      const dateStr = r.dataCorrida || r.dataCriacao || r.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const monthKey = MONTH_NAMES[date.getMonth()];
      const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
      map[monthKey] = (map[monthKey] || 0) + (isNaN(val) ? 0 : val);
    });

    return Object.entries(map).map(([name, valor]) => ({
      name,
      valor: Math.round(valor),
    }));
  }, [dashboardData, rides]);

  const supplierPieData = useMemo(() => {
    if (dashboardData?.gastoPorFornecedor?.fornecedores && dashboardData.gastoPorFornecedor.fornecedores.length > 0) {
      return dashboardData.gastoPorFornecedor.fornecedores.map((f, idx) => ({
        name: f.fornecedor,
        value: Math.round(f.gasto),
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }));
    }
    if (rides.length === 0) return [];
    const map: Record<string, number> = {};
    rides.forEach((r) => {
      const supplierName = r.fornecedorNome || (r.fornecedorId ? `Fornecedor #${r.fornecedorId}` : 'Geral');
      const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
      map[supplierName] = (map[supplierName] || 0) + (isNaN(val) ? 0 : val);
    });

    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value: Math.round(value),
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [dashboardData, rides]);

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

  const filteredTableData = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusFilters = selectedFilters
      .filter((f) => f.startsWith('status:'))
      .map((f) => f.replace('status:', ''));

    return tableData.filter((item) => {
      const matchesQuery =
        !q ||
        item.solicitante.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.destino.toLowerCase().includes(q);

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);

      return matchesQuery && matchesStatus;
    });
  }, [tableData, query, selectedFilters]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredTableData.length / PAGE_SIZE));
  const pageData = filteredTableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const completedCount = dashboardData?.bigNumbers?.corridasConcluidas?.valor ?? rides.filter((r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'CONCLUIDA' || s === 'FINALIZADA';
  }).length;

  const totalCorridasCount = dashboardData?.bigNumbers?.totalCorridas?.valor ?? rides.length;

  return (
    <div className={styles.page}>
      <TableToolbar
        onSearch={(val) => {
          setQuery(val);
          setCurrentPage(1);
        }}
        filterSections={executiveFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={(vals) => {
          setSelectedFilters(vals);
          setCurrentPage(1);
        }}
        onFilterClear={() => {
          setSelectedFilters([]);
          setCurrentPage(1);
        }}
      />

      <section className={styles.statsGrid}>
        <StatCard
          title="Total de solicitações"
          value={String(totalCorridasCount)}
          isLoading={isLoading}
        />
        <StatCard
          title="Corridas concluídas"
          value={String(completedCount)}
          isLoading={isLoading}
        />
        <StatCard
          title="Fornecedores ativos"
          value={String(supplierBigNumbers?.fornecedoresAtivos ?? 0)}
          isLoading={isLoading}
        />
        <StatCard
          title="Contratos vigentes"
          value={String(contractBigNumbers?.validos ?? 0)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gasto total mensal</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execColorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2C2C9E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2C2C9E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Gasto']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#2C2C9E" strokeWidth={3} fillOpacity={1} fill="url(#execColorGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhum dado de corrida registrado para consolidar gastos mensais</span>
              </div>
            )}
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gasto por fornecedor</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {supplierPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {supplierPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Valor']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhum dado de corrida registrado para rateio por fornecedor</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={pageData}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhuma corrida registrada na visão executiva."
          isLoading={isLoading}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
      </section>
    </div>
  );
};
