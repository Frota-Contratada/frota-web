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
} from 'recharts';
import {
  StatCard,
  Table,
  TableToolbar,
  type ColumnDef,
  StatusBadge,
  type BadgeStatus,
  type DateRangeFilterValue,
  type FilterSection,
} from '../../../components/common';
import {
  supplierApi,
  branchApi,
  costCenterApi,
  ridesApi,
  dashboardApi,
  extractListData,
  fetchAllPages,
  type FornecedorDto,
  type FilialDto,
  type CentroCustoDto,
  type SolicitacaoDto,
  type DashboardAuditoriaDto,
} from '../../../services';
import styles from '../Dashboards.module.css';

export interface AuditRideRow {
  id: number;
  data: string;
  solicitante: string;
  email: string;
  fornecedor: string;
  origem: string;
  destino: string;
  distanciaEstimada: string;
  distanciaPercorrida: string;
  desvio: string;
  status: BadgeStatus;
  statusLabel?: string;
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
    render: (_, row) => <StatusBadge status={row.status} label={row.statusLabel} />,
  },
  {
    key: 'preco',
    header: 'Valor',
    sortable: true,
    render: (val) => <strong className={styles.primaryText}>{String(val)}</strong>,
  },
];

export const PriceAuditView = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [auditoriaData, setAuditoriaData] = useState<DashboardAuditoriaDto | null>(null);
  const [suppliers, setSuppliers] = useState<FornecedorDto[]>([]);
  const [branches, setBranches] = useState<FilialDto[]>([]);
  const [costCenters, setCostCenters] = useState<CentroCustoDto[]>([]);
  const [rides, setRides] = useState<SolicitacaoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      supplierApi.list(),
      fetchAllPages<FilialDto>((page) => branchApi.list({ page, limit: 100 }), 5),
      selectedFilialId
        ? fetchAllPages<CentroCustoDto>((page) => costCenterApi.list({ filialId: selectedFilialId, page, limit: 100 }))
        : costCenterApi.list(),
    ]).then(([suppRes, branchRes, ccRes]) => {
      if (!isMounted) return;
      if (suppRes.status === 'fulfilled') {
        setSuppliers(extractListData<FornecedorDto>(suppRes.value));
      }
      if (branchRes.status === 'fulfilled') {
        setBranches(extractListData<FilialDto>(branchRes.value));
      }
      if (ccRes.status === 'fulfilled') {
        setCostCenters(extractListData<CentroCustoDto>(ccRes.value));
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
      dashboardApi.getAuditoria(backendQuery),
      ridesApi.list(ridesQuery),
    ]).then(([auditRes, ridesRes]) => {
      if (!isMounted) return;

      if (auditRes.status === 'fulfilled' && auditRes.value?.response) {
        setAuditoriaData(auditRes.value.response);
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

  const tableData: AuditRideRow[] = useMemo(() => {
    if (auditoriaData?.corridas) {
      return auditoriaData.corridas.map((c, idx) => {
        const precoNum = Number(c.preco ?? 0);
        const precoFmt = precoNum > 0
          ? `R$ ${precoNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '—';
        const distEst = Number(c.distanciaEstimada ?? 0);
        const distReal = Number(c.distanciaPercorrida ?? 0);
        const desvio = Number(c.desvioPercentual ?? 0);

        let badgeStatus: BadgeStatus = 'aprovado';
        let statusLabel = 'Conforme';
        if (desvio > 20) {
          badgeStatus = 'cancelado';
          statusLabel = 'Desvio Alto';
        } else if (desvio > 5) {
          badgeStatus = 'pendente';
          statusLabel = 'Atenção';
        }

        return {
          id: (c as any).id ?? idx + 1,
          data: c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—',
          solicitante: c.solicitanteNome || 'Colaborador',
          email: c.solicitanteEmail || '—',
          fornecedor: c.fornecedor || 'Geral',
          origem: c.fornecedor ? `Fornecedor: ${c.fornecedor}` : 'Matriz',
          destino: (c as any).destino || 'Destino Corporativo',
          distanciaEstimada: distEst > 0 ? `${distEst} km` : '—',
          distanciaPercorrida: distReal > 0 ? `${distReal} km` : '—',
          desvio: `${desvio >= 0 ? '+' : ''}${desvio.toFixed(1)}%`,
          status: badgeStatus,
          statusLabel,
          preco: precoFmt,
        };
      });
    }

    return rides.map((r, idx) => {
      const kmEstimado = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const kmReal = Number(r.corrida?.kmPercorrido ?? 0);

      let desvioNum = 0;
      let desvioStr = '0%';
      if (kmEstimado > 0 && kmReal > 0) {
        const diff = kmReal - kmEstimado;
        desvioNum = (diff / kmEstimado) * 100;
        desvioStr = `${desvioNum >= 0 ? '+' : ''}${desvioNum.toFixed(1)}%`;
      }

      let badgeStatus: BadgeStatus = 'aprovado';
      let statusLabel = 'Conforme';
      if (Math.abs(desvioNum) > 20) {
        badgeStatus = 'cancelado';
        statusLabel = 'Desvio Alto';
      } else if (Math.abs(desvioNum) > 5) {
        badgeStatus = 'pendente';
        statusLabel = 'Atenção';
      }

      const valorCalculado = r.corrida?.valorFinal ?? r.valorEstimado;
      const precoFmt = valorCalculado != null && !isNaN(Number(valorCalculado))
        ? `R$ ${Number(valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—';

      const suppName = r.fornecedorNome || (r.fornecedorId ? `Fornecedor #${r.fornecedorId}` : 'Geral');

      return {
        id: r.id ?? idx + 1,
        data: r.dataCorrida ? new Date(r.dataCorrida).toLocaleDateString('pt-BR') : '—',
        solicitante: r.solicitanteNome || (r.passageiros?.[0]?.nome ?? 'Colaborador'),
        email: r.passageiros?.[0]?.cpf ? `CPF: ${r.passageiros[0].cpf}` : '—',
        fornecedor: suppName,
        origem: r.origem?.cidade ? `${r.origem.cidade} (${r.origem.logradouro || ''})` : (r.origem?.logradouro || '—'),
        destino: r.destino?.cidade ? `${r.destino.cidade} (${r.destino.logradouro || ''})` : (r.destino?.logradouro || '—'),
        distanciaEstimada: kmEstimado > 0 ? `${kmEstimado} km` : '—',
        distanciaPercorrida: kmReal > 0 ? `${kmReal} km` : '—',
        desvio: desvioStr,
        status: badgeStatus,
        statusLabel,
        preco: precoFmt,
      };
    });
  }, [auditoriaData?.corridas, rides]);

  const kmComparisonData = useMemo(() => {
    if (auditoriaData?.conformidadeQuilometragem && auditoriaData.conformidadeQuilometragem.length > 0) {
      return auditoriaData.conformidadeQuilometragem.map((c) => ({
        name: c.fornecedor.length > 15 ? `${c.fornecedor.slice(0, 13)}...` : c.fornecedor,
        estimado: Math.round(c.kmEstimado),
        cobrado: Math.round(c.kmCobrado),
      }));
    }
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
  }, [auditoriaData, rides]);

  const deviationTrendData = useMemo(() => {
    if (auditoriaData?.maioresDesviosFornecedores && auditoriaData.maioresDesviosFornecedores.length > 0) {
      return auditoriaData.maioresDesviosFornecedores.map((d) => ({
        name: d.fornecedor,
        desvio: Number(d.desvioPercentual.toFixed(1)),
      }));
    }
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
  }, [auditoriaData, rides]);

  const ridesWithKmDeviationCount = useMemo(() => {
    if (auditoriaData?.bigNumbers?.corridasDesvioAlto?.quantidade != null) {
      return auditoriaData.bigNumbers.corridasDesvioAlto.quantidade;
    }
    return rides.filter((r) => {
      const est = Number(r.distanciaEstimadaKm ?? r.distanciaKm ?? 0);
      const real = Number(r.corrida?.kmPercorrido ?? 0);
      return est > 0 && real > 0 && Math.abs(real - est) > 0.5;
    }).length;
  }, [auditoriaData, rides]);

  const maxDeviationObserved = useMemo(() => {
    if (auditoriaData?.bigNumbers?.maiorDesvio?.percentual != null) {
      return `${auditoriaData.bigNumbers.maiorDesvio.percentual.toFixed(1)}%`;
    }
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
  }, [auditoriaData, rides]);

  const priceAuditFilterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      {
        title: 'Conformidade',
        options: [
          { label: 'Conforme', value: 'status:aprovado' },
          { label: 'Atenção (> 5%)', value: 'status:pendente' },
          { label: 'Desvio Alto (> 20%)', value: 'status:cancelado' },
        ],
      },
    ];

    const supplierNames = Array.from(
      new Set([
        ...suppliers.map((s) => s.nome).filter(Boolean),
        ...tableData.map((row) => row.fornecedor).filter((f) => f && f !== 'Geral'),
      ]),
    ) as string[];

    if (supplierNames.length > 0) {
      sections.push({
        title: 'Fornecedor',
        options: supplierNames.map((name) => ({
          label: name,
          value: `fornecedor:${name}`,
        })),
      });
    }

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
  }, [suppliers, tableData, branches, costCenters]);

  const filteredData = useMemo(() => {
    const statusFilters = selectedFilters
      .filter((f) => f.startsWith('status:'))
      .map((f) => f.replace('status:', ''));
    const supplierFilters = selectedFilters
      .filter((f) => f.startsWith('fornecedor:'))
      .map((f) => f.replace('fornecedor:', ''));

    return tableData.filter((item) => {
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
      const matchesSupplier = supplierFilters.length === 0 || supplierFilters.includes(item.fornecedor);
      return matchesStatus && matchesSupplier;
    });
  }, [tableData, selectedFilters]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <TableToolbar
        filterSections={priceAuditFilterSections}
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
          title="Fornecedores homologados"
          value={String(suppliers.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Solicitações monitoradas"
          value={String(auditoriaData?.corridas?.length ?? rides.length)}
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
              <span className={styles.chartEyebrow}>Auditoria</span>
              <h3 className={styles.chartTitle}>Desvio médio de quilometragem por fornecedor (%)</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {deviationTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviationTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Desvio médio']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="desvio" name="Desvio médio (%)" fill="#d97706" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
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
