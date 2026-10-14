import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { StatCard, Table, TableToolbar, type ColumnDef, StatusBadge, type DateRangeFilterValue } from '../../../components/common';
import {
  costCenterApi,
  ridesApi,
  dashboardApi,
  extractListData,
  type CentroCustoDto,
  type SolicitacaoDto,
  type DashboardGastosDto,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface ExpensesRow {
  id: number;
  centroCusto: string;
  nome: string;
  aprovador: string;
  valor?: string;
  ativo: boolean;
}

const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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
    key: 'valor',
    header: 'Gasto Consolidado',
    sortable: true,
    render: (val) => (val && val !== '—' ? <strong>{String(val)}</strong> : '—'),
  },
  {
    key: 'ativo',
    header: 'Status',
    sortable: true,
    render: (val) => <StatusBadge status={val ? 'aprovado' : 'cancelado'} label={val ? 'Ativo' : 'Inativo'} />,
  },
];

export const ExpensesView = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [gastosData, setGastosData] = useState<DashboardGastosDto | null>(null);
  const [costCenters, setCostCenters] = useState<CentroCustoDto[]>([]);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>({ from: '', to: '' });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const backendQuery: Record<string, string | number> = {};
    if (dateRange.from) backendQuery.startDate = dateRange.from;
    if (dateRange.to) backendQuery.endDate = dateRange.to;

    Promise.allSettled([
      dashboardApi.getGastos(backendQuery),
      costCenterApi.list(),
      ridesApi.list(backendQuery),
    ]).then(([gastosRes, ccRes, ridesRes]) => {
      if (!isMounted) return;

      if (gastosRes.status === 'fulfilled' && gastosRes.value?.response) {
        setGastosData(gastosRes.value.response);
      }
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
  }, [dateRange]);

  const tableData: ExpensesRow[] = useMemo(() => {
    if (gastosData?.centrosCusto && gastosData.centrosCusto.length > 0) {
      return gastosData.centrosCusto.map((c, idx) => {
        const idNum = Number(c.centroCustoId ?? idx + 1);
        const valorNum = Number(c.valor ?? 0);
        return {
          id: idNum > 0 ? idNum : idx + 1,
          centroCusto: idNum > 0 ? `CC-${idNum}` : `CC-${idx + 1}`,
          nome: c.centroCusto || 'Centro de Custo',
          aprovador: c.responsavel || 'Vinculado',
          valor: valorNum > 0 ? `R$ ${valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
          ativo: true,
        };
      });
    }

    return costCenters.map((cc, idx) => {
      const num = cc.numero ?? cc.id ?? (cc as any).nCdCentroCusto;
      const idNum = Number(num ?? idx + 1);
      return {
        id: idNum > 0 ? idNum : idx + 1,
        centroCusto: idNum > 0 ? `CC-${idNum}` : `CC-${idx + 1}`,
        nome: cc.nome || 'Centro de Custo',
        aprovador: cc.temAprovador ? 'Vinculado' : 'Pendente',
        valor: '—',
        ativo: cc.ativo !== false,
      };
    });
  }, [gastosData?.centrosCusto, costCenters]);

  const costCenterChartData = useMemo(() => {
    if (gastosData?.maioresGastosCentroCusto && gastosData.maioresGastosCentroCusto.length > 0) {
      return gastosData.maioresGastosCentroCusto.map((c) => ({
        name: c.centroCusto,
        valor: Math.round(c.valor),
      }));
    }
    if (rides.length === 0 && costCenters.length === 0) return [];
    const map: Record<string, number> = {};

    costCenters.forEach((cc) => {
      const num = cc.numero ?? cc.id ?? (cc as any).nCdCentroCusto;
      const idNum = Number(num ?? 0);
      const code = idNum > 0 ? `CC-${idNum}` : 'CC-Geral';
      const label = cc.nome ? (cc.nome.length > 15 ? `${cc.nome.slice(0, 13)}...` : cc.nome) : code;
      map[label] = 0;
    });

    rides.forEach((r) => {
      const ccs = r.centrosCusto || r.CentrosCusto;
      const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
      if (!ccs || ccs.length === 0) {
        map['Geral'] = (map['Geral'] || 0) + (isNaN(val) ? 0 : val);
        return;
      }
      const share = (isNaN(val) ? 0 : val) / ccs.length;
      ccs.forEach((c) => {
        const ccId = Number(c.centroCustoId ?? c.filialId);
        const found = costCenters.find((x) => Number(x.numero ?? x.id ?? (x as any).nCdCentroCusto) === ccId);
        const name = found?.nome
          ? (found.nome.length > 15 ? `${found.nome.slice(0, 13)}...` : found.nome)
          : (ccId > 0 ? `CC-${ccId}` : 'CC-Geral');
        map[name] = (map[name] || 0) + share;
      });
    });

    const entries = Object.entries(map)
      .map(([name, valor]) => ({ name, valor: Math.round(valor) }))
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);

    return entries;
  }, [gastosData, rides, costCenters]);

  const monthlyExpensesData = useMemo(() => {
    if (gastosData?.evolucaoGastos && gastosData.evolucaoGastos.length > 0) {
      return gastosData.evolucaoGastos.map((e) => ({
        name: e.periodo,
        valor: Math.round(e.fornecedores.reduce((acc, f) => acc + (f.valor || 0), 0)),
      }));
    }
    if (rides.length === 0) return [];
    const map: Record<string, number> = {};
    rides.forEach((r) => {
      const dateStr = r.dataCorrida || r.dataCriacao || r.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = MONTH_NAMES[d.getMonth()];
      const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
      map[key] = (map[key] || 0) + (isNaN(val) ? 0 : val);
    });

    return Object.entries(map).map(([name, valor]) => ({
      name,
      valor: Math.round(valor),
    }));
  }, [gastosData, rides]);

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

  const filteredData = useMemo(() => {
    const statusFilters = selectedFilters.filter((f) => f.startsWith('status:')).map((f) => f.replace('status:', ''));
    const aprovadorFilters = selectedFilters.filter((f) => f.startsWith('aprovador:')).map((f) => f.replace('aprovador:', ''));

    return tableData.filter((item) => {
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.ativo ? 'ativo' : 'inativo');
      const matchesAprovador = aprovadorFilters.length === 0 || aprovadorFilters.includes(item.aprovador);

      return matchesStatus && matchesAprovador;
    });
  }, [tableData, selectedFilters]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalSpent = gastosData?.bigNumbers?.gastoTotal?.valor ?? rides.reduce((sum, r) => {
    const val = Number(r.corrida?.valorFinal ?? r.valorEstimado ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const ccsWithApprover = costCenters.filter((c) => c.temAprovador).length;

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={expensesFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={(vals) => {
          setSelectedFilters(vals);
          setCurrentPage(1);
        }}
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
          title="Centros de custo cadastrados"
          value={String(costCenters.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Com aprovador vinculado"
          value={String(ccsWithApprover)}
          isLoading={isLoading}
        />
        <StatCard
          title="Gasto consolidado de viagens"
          value={totalSpent > 0 ? `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
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
              <h3 className={styles.chartTitle}>Maiores gastos por centro de custo</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {costCenterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={costCenterChartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} />
                  <Tooltip
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Gasto Total']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="valor" fill="#0052cc" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhum centro de custo possui corridas registradas no momento</span>
              </div>
            )}
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução mensal de gastos</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {monthlyExpensesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyExpensesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a3ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00a3ff" stopOpacity={0.0} />
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#00a3ff" strokeWidth={3} fillOpacity={1} fill="url(#expensesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhum dado de viagem registrado para compor a série histórica</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={pageData}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhum centro de custo registrado."
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
