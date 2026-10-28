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
  type DateRangeFilterValue,
  type FilterSection,
} from '../../../components/common';
import {
  ridesApi,
  supplierApi,
  contractApi,
  dashboardApi,
  branchApi,
  costCenterApi,
  extractListData,
  fetchAllPages,
  type SolicitacaoDto,
  type FornecedorBigNumbers,
  type ContratoBigNumbers,
  type DashboardExecutivoDto,
  type FilialDto,
  type CentroCustoDto,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface ExecRideRow {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  destino: string;
  status: BadgeStatus;
  statusLabel?: string;
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
    render: (_, row) => <StatusBadge status={row.status} label={row.statusLabel} />,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardExecutivoDto | null>(null);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [branches, setBranches] = useState<FilialDto[]>([]);
  const [costCenters, setCostCenters] = useState<CentroCustoDto[]>([]);
  const [supplierBigNumbers, setSupplierBigNumbers] = useState<FornecedorBigNumbers | null>(null);
  const [contractBigNumbers, setContractBigNumbers] = useState<ContratoBigNumbers | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>({ from: '', to: '' });

  const selectedFilialId = useMemo(() => {
    const found = selectedFilters.find((f) => f.startsWith('filial:'));
    return found ? Number(found.replace('filial:', '')) : undefined;
  }, [selectedFilters]);

  const selectedCentroCustoId = useMemo(() => {
    const found = selectedFilters.find((f) => f.startsWith('centroCusto:'));
    return found ? Number(found.replace('centroCusto:', '')) : undefined;
  }, [selectedFilters]);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      fetchAllPages<FilialDto>((page) => branchApi.list({ page, limit: 100 }), 5),
      selectedFilialId
        ? fetchAllPages<CentroCustoDto>((page) => costCenterApi.list({ filialId: selectedFilialId, page, limit: 100 }))
        : costCenterApi.list(),
      supplierApi.getBigNumbers(),
      contractApi.getBigNumbers(),
    ]).then(([branchRes, ccRes, suppRes, contRes]) => {
      if (!isMounted) return;
      if (branchRes.status === 'fulfilled') {
        setBranches(extractListData<FilialDto>(branchRes.value));
      }
      if (ccRes.status === 'fulfilled') {
        setCostCenters(extractListData<CentroCustoDto>(ccRes.value));
      }
      if (suppRes.status === 'fulfilled' && suppRes.value?.response) {
        setSupplierBigNumbers(suppRes.value.response);
      }
      if (contRes.status === 'fulfilled' && contRes.value?.response) {
        setContractBigNumbers(contRes.value.response);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedFilialId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const backendQuery: Record<string, string | number> = {};
    if (dateRange.from) backendQuery.startDate = dateRange.from;
    if (dateRange.to) backendQuery.endDate = dateRange.to;
    if (selectedFilialId) backendQuery.filial = selectedFilialId;
    if (selectedCentroCustoId) backendQuery.centroCusto = selectedCentroCustoId;

    const ridesQuery: Record<string, string | number> = {};
    if (dateRange.from) ridesQuery.startDate = dateRange.from;
    if (dateRange.to) ridesQuery.endDate = dateRange.to;

    Promise.allSettled([
      dashboardApi.getExecutivo(backendQuery),
      ridesApi.list(ridesQuery),
    ]).then(([dashRes, ridesRes]) => {
      if (!isMounted) return;

      if (dashRes.status === 'fulfilled' && dashRes.value?.response) {
        setDashboardData(dashRes.value.response);
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
  }, [dateRange, selectedFilialId, selectedCentroCustoId]);

  const handleFilterChange = (nextFilters: string[]) => {
    const prevFilials = selectedFilters.filter((f) => f.startsWith('filial:'));
    const nextFilials = nextFilters.filter((f) => f.startsWith('filial:'));
    const prevCCs = selectedFilters.filter((f) => f.startsWith('centroCusto:'));
    const nextCCs = nextFilters.filter((f) => f.startsWith('centroCusto:'));

    let normalized = [...nextFilters];
    if (nextFilials.length > 1) {
      const newlyAdded = nextFilials.find((f) => !prevFilials.includes(f)) ?? nextFilials[nextFilials.length - 1];
      normalized = normalized.filter((f) => !f.startsWith('filial:') || f === newlyAdded);
    }
    if (nextCCs.length > 1) {
      const newlyAdded = nextCCs.find((f) => !prevCCs.includes(f)) ?? nextCCs[nextCCs.length - 1];
      normalized = normalized.filter((f) => !f.startsWith('centroCusto:') || f === newlyAdded);
    }

    setSelectedFilters(normalized);
    setCurrentPage(1);
  };

  const tableData: ExecRideRow[] = useMemo(() => {
    if (dashboardData?.corridas) {
      return dashboardData.corridas.map((c, idx) => {
        const rawStatus = (c.status || '').toUpperCase();
        let badgeStatus: BadgeStatus = 'em_andamento';
        let statusLabel = c.status || 'Em andamento';

        if (rawStatus === 'F' || rawStatus === 'CONCLUIDO' || rawStatus === 'CONCLUIDA' || rawStatus === 'FINALIZADA' || rawStatus.includes('CONCLU')) {
          badgeStatus = 'aprovado';
          statusLabel = 'Concluída';
        } else if (rawStatus === 'C' || rawStatus.includes('CANCEL')) {
          badgeStatus = 'cancelado';
          statusLabel = 'Cancelada';
        } else if (rawStatus === 'R' || rawStatus.includes('RECUS') || rawStatus.includes('REPROV')) {
          badgeStatus = 'cancelado';
          statusLabel = 'Recusada';
        } else if (rawStatus === 'I' || rawStatus.includes('ANDAMENTO')) {
          badgeStatus = 'em_andamento';
          statusLabel = 'Em andamento';
        } else if (rawStatus === 'A' || rawStatus === 'AGENDADA' || rawStatus.includes('AGEND') || rawStatus.includes('APROV')) {
          badgeStatus = 'pendente';
          statusLabel = rawStatus.includes('AGEND') || rawStatus === 'A' ? 'Agendada' : 'Aprovada';
        } else if (rawStatus === 'P' || rawStatus.includes('PEND') || rawStatus.includes('AGUARD')) {
          badgeStatus = 'pendente';
          statusLabel = 'Pendente';
        }

        const precoNum = Number(c.preco ?? 0);
        const precoFmt = precoNum > 0 ? `R$ ${precoNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
        const distEst = Number(c.distanciaEstimada ?? 0);
        const distReal = Number(c.distanciaPercorrida ?? 0);

        return {
          id: (c as any).id ?? idx + 1,
          data: c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—',
          solicitante: c.solicitanteNome || 'Colaborador',
          email: c.solicitanteEmail || '—',
          destino: c.destino || '—',
          status: badgeStatus,
          statusLabel,
          distanciaEstimada: distEst > 0 ? `${distEst} km` : '—',
          distanciaPercorrida: distReal > 0 ? `${distReal} km` : '—',
          preco: precoFmt,
        };
      });
    }

    return rides.map((r, idx) => {
      const rawStatus = (r.status || '').toUpperCase();
      const corridaStatus = (r.corrida?.status || '').toUpperCase();
      let badgeStatus: BadgeStatus = 'em_andamento';
      let statusLabel = 'Em andamento';

      if (corridaStatus === 'F' || rawStatus === 'CONCLUIDA' || rawStatus === 'FINALIZADA') {
        badgeStatus = 'aprovado';
        statusLabel = 'Concluída';
      } else if (rawStatus === 'C' || corridaStatus === 'C' || rawStatus.includes('CANCEL')) {
        badgeStatus = 'cancelado';
        statusLabel = 'Cancelada';
      } else if (rawStatus === 'R' || rawStatus.includes('RECUS') || rawStatus.includes('REPROV')) {
        badgeStatus = 'cancelado';
        statusLabel = 'Recusada';
      } else if (corridaStatus === 'I' || rawStatus.includes('ANDAMENTO')) {
        badgeStatus = 'em_andamento';
        statusLabel = 'Em andamento';
      } else if (rawStatus === 'A' || rawStatus.includes('APROV') || corridaStatus === 'A') {
        badgeStatus = 'pendente';
        statusLabel = corridaStatus === 'A' ? 'Agendada' : 'Aprovada';
      } else if (rawStatus === 'P' || rawStatus.includes('PEND') || rawStatus.includes('AGUARD')) {
        badgeStatus = 'pendente';
        statusLabel = 'Pendente';
      }

      const valorCalculado = r.corrida?.valorFinal ?? r.valorEstimado;
      const precoFmt = valorCalculado != null && !isNaN(Number(valorCalculado))
        ? `R$ ${Number(valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      return {
        id: r.id ?? idx + 1,
        data: r.dataCorrida ? new Date(r.dataCorrida).toLocaleDateString('pt-BR') : '—',
        solicitante: r.solicitanteNome || (r.passageiros?.[0]?.nome ?? 'Colaborador'),
        email: r.passageiros?.[0]?.cpf ? `CPF: ${r.passageiros[0].cpf}` : '—',
        destino: r.destino?.cidade ? `${r.destino.cidade} (${r.destino.logradouro || ''})` : (r.destino?.logradouro || '—'),
        status: badgeStatus,
        statusLabel,
        distanciaEstimada: (r.distanciaEstimadaKm ?? r.distanciaKm) ? `${r.distanciaEstimadaKm ?? r.distanciaKm} km` : '—',
        distanciaPercorrida: r.corrida?.kmPercorrido ? `${r.corrida.kmPercorrido} km` : '—',
        preco: precoFmt,
      };
    });
  }, [dashboardData?.corridas, rides]);

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

  const executiveFilterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      {
        title: 'Status',
        options: [
          { label: 'Concluída', value: 'status:aprovado' },
          { label: 'Agendada / Pendente', value: 'status:pendente' },
          { label: 'Em andamento', value: 'status:em_andamento' },
          { label: 'Cancelada', value: 'status:cancelado' },
        ],
      },
    ];

    if (branches.length > 0) {
      sections.push({
        title: 'Filial',
        options: branches.map((b) => ({
          label: b.nome || `Filial #${b.id}`,
          value: `filial:${b.id}`,
        })),
      });
    }

    if (costCenters.length > 0) {
      sections.push({
        title: 'Centro de custo',
        options: costCenters.map((cc) => {
          const code = cc.numero ?? cc.id;
          return {
            label: cc.nome ? `${code} - ${cc.nome}` : `CC-${code}`,
            value: `centroCusto:${code}`,
          };
        }),
      });
    }

    return sections;
  }, [branches, costCenters]);

  const filteredTableData = useMemo(() => {
    const statusFilters = selectedFilters
      .filter((f) => f.startsWith('status:'))
      .map((f) => f.replace('status:', ''));

    return tableData.filter((item) => {
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
      return matchesStatus;
    });
  }, [tableData, selectedFilters]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredTableData.length / PAGE_SIZE));

  const completedCount = dashboardData?.bigNumbers?.corridasConcluidas?.valor ?? rides.filter((r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'CONCLUIDA' || s === 'FINALIZADA';
  }).length;

  const totalCorridasCount = dashboardData?.bigNumbers?.totalCorridas?.valor ?? rides.length;

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={executiveFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setCurrentPage(1);
        }}
        onFilterClear={() => {
          setSelectedFilters([]);
          setDateRange({ from: '', to: '' });
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
          data={filteredTableData}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhuma corrida registrada na visão executiva."
          isLoading={isLoading}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            pageSize: PAGE_SIZE,
          }}
        />
      </section>
    </div>
  );
};
