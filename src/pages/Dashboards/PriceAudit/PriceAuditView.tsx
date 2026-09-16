import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
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
  desvio: string;
  status: BadgeStatus;
  preco: string;
}

const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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
    key: 'desvio',
    header: 'Desvio',
    sortable: true,
    render: (val) => <span style={{ color: '#d97706', fontWeight: 600 }}>{String(val)}</span>,
  },
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
      const precoFmt = valorCalculado != null && !isNaN(Number(valorCalculado))
        ? `R$ ${Number(valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      const kmEstimado = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const kmReal = Number(r.corrida?.kmPercorrido ?? 0);

      let desvioStr = '0%';
      if (kmEstimado > 0 && kmReal > 0) {
        const diff = Math.abs(kmReal - kmEstimado);
        const pct = (diff / kmEstimado) * 100;
        desvioStr = `${pct.toFixed(1)}%`;
      }

      return {
        id: r.id,
        data: r.dataCorrida ? new Date(r.dataCorrida).toLocaleDateString('pt-BR') : '—',
        solicitante: r.solicitanteNome || (r.passageiros?.[0]?.nome ?? 'Colaborador'),
        email: r.passageiros?.[0]?.cpf ? `CPF: ${r.passageiros[0].cpf}` : '—',
        origem: r.origem?.cidade ? `${r.origem.cidade} (${r.origem.logradouro || ''})` : (r.origem?.logradouro || '—'),
        destino: r.destino?.cidade ? `${r.destino.cidade} (${r.destino.logradouro || ''})` : (r.destino?.logradouro || '—'),
        distanciaEstimada: kmEstimado > 0 ? `${kmEstimado} km` : '—',
        distanciaPercorrida: kmReal > 0 ? `${kmReal} km` : '—',
        desvio: desvioStr,
        status: badgeStatus,
        preco: precoFmt,
      };
    });
  }, [rides]);

  const kmComparisonData = useMemo(() => {
    if (rides.length === 0) return [];
    const map: Record<string, { estimado: number; cobrado: number }> = {};

    rides.forEach((r) => {
      const supp = r.fornecedorNome || (r.fornecedorId ? `Fornecedor #${r.fornecedorId}` : 'Geral');
      if (!map[supp]) {
        map[supp] = { estimado: 0, cobrado: 0 };
      }
      const est = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const real = Number(r.corrida?.kmPercorrido ?? r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      map[supp].estimado += isNaN(est) ? 0 : est;
      map[supp].cobrado += isNaN(real) ? 0 : real;
    });

    return Object.entries(map)
      .map(([name, vals]) => ({
        name: name.length > 15 ? `${name.slice(0, 13)}...` : name,
        estimado: Math.round(vals.estimado),
        cobrado: Math.round(vals.cobrado),
      }))
      .slice(0, 5);
  }, [rides]);

  const deviationTrendData = useMemo(() => {
    if (rides.length === 0) return [];
    const map: Record<string, { totalDev: number; count: number }> = {};

    rides.forEach((r) => {
      const dateStr = r.dataCorrida || r.dataCriacao || r.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = MONTH_NAMES[d.getMonth()];

      const kmEstimado = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const kmReal = Number(r.corrida?.kmPercorrido ?? 0);
      if (kmEstimado > 0 && kmReal > 0) {
        const pct = (Math.abs(kmReal - kmEstimado) / kmEstimado) * 100;
        if (!map[key]) map[key] = { totalDev: 0, count: 0 };
        map[key].totalDev += pct;
        map[key].count += 1;
      }
    });

    return Object.entries(map).map(([name, stat]) => ({
      name,
      desvio: Number((stat.totalDev / stat.count).toFixed(1)),
    }));
  }, [rides]);

  const ridesWithKmDeviationCount = useMemo(() => {
    return rides.filter((r) => {
      const est = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const real = Number(r.corrida?.kmPercorrido ?? 0);
      return est > 0 && real > 0 && Math.abs(real - est) > 0.5;
    }).length;
  }, [rides]);

  const maxDeviationObserved = useMemo(() => {
    let max = 0;
    rides.forEach((r) => {
      const est = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const real = Number(r.corrida?.kmPercorrido ?? 0);
      if (est > 0 && real > 0) {
        const pct = (Math.abs(real - est) / est) * 100;
        if (pct > max) max = pct;
      }
    });
    return `${max.toFixed(1)}%`;
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
          title="Corridas com desvio de rota"
          value={String(ridesWithKmDeviationCount)}
          isLoading={isLoading}
        />
        <StatCard
          title="Maior desvio apurado"
          value={maxDeviationObserved}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Conformidade de quilometragem estimada vs cobrada</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {kmComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="estimado" name="KM estimado" fill="#00a3ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cobrado" name="KM cobrado" fill="#70d6ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhuma corrida registrada com fornecedor para comparar quilometragem</span>
              </div>
            )}
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução de desvios médios (%)</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {deviationTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deviationTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Desvio médio']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Line type="monotone" dataKey="desvio" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#d97706' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <span>Nenhum desvio detectado nas corridas concluídas registradas</span>
              </div>
            )}
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
