import { useState } from 'react';
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
import { StatCard, Table, TableToolbar, type ColumnDef } from '../../components/common';
import { priceAuditTableData, type PriceAuditTableRow } from './dashboardsData';
import styles from './Dashboards.module.css';

const doubleBarChartData = [
  { name: 'VIEX', estimado: 45, cobrado: 52 },
  { name: 'CARS COMPANY', estimado: 30, cobrado: 28 },
  { name: 'EXPRESS', estimado: 60, cobrado: 68 },
  { name: 'FRETADO', estimado: 80, cobrado: 82 },
];

const deviationTrendData = [
  { name: 'Semana 1', desvio: 2.1 },
  { name: 'Semana 2', desvio: 4.8 },
  { name: 'Semana 3', desvio: 3.2 },
  { name: 'Semana 4', desvio: 6.5 },
  { name: 'Semana 5', desvio: 5.0 },
];

const columns: ColumnDef<PriceAuditTableRow>[] = [
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
  { key: 'fornecedor', header: 'Fornecedor', sortable: true },
  { key: 'distanciaEstimada', header: 'Distância estimada' },
  { key: 'distanciaPercorrida', header: 'Distância percorrida' },
  {
    key: 'desvios',
    header: 'Desvio',
    sortable: true,
    render: (val) => <span style={{ color: '#d97706', fontWeight: 600 }}>{String(val)}</span>,
  },
  {
    key: 'preco',
    header: 'Preço',
    sortable: true,
    render: (val) => <strong className={styles.primaryText}>{String(val)}</strong>,
  },
];

export const PriceAuditView = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const priceAuditFilterSections = [
    {
      title: 'Fornecedor',
      options: [
        { label: 'Viex', value: 'fornecedor:Viex' },
        { label: 'Fretado', value: 'fornecedor:Fretado' },
        { label: 'Express', value: 'fornecedor:Express' },
        { label: 'Cars Company', value: 'fornecedor:Cars Company' },
      ],
    },
  ];

  const filteredData = priceAuditTableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.some((filter) => {
      const [key, val] = filter.split(':');
      if (key === 'fornecedor') return item.fornecedor === val;
      return true;
    });
  });

  return (
    <div className={styles.page}>
      {}
      <TableToolbar
        filterSections={priceAuditFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      {}
      <section className={styles.statsGrid}>
        <StatCard title="Sobrepreço total" value="R$ 54" />
        <StatCard title="Corridas com desvio alto" value="23" />
        <StatCard title="Maior desvio do período" value="10%" />
        <StatCard title="Fornecedores em risco" value="64" />
      </section>

      {}
      <section className={styles.chartsGrid}>
        {}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Conformidade de quilometragem</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doubleBarChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="estimado" name="KM estimado" fill="#00a3ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cobrado" name="KM cobrado" fill="#70d6ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução de desvios médios (%)</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deviationTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Desvio médio']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="desvio" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#d97706' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {}
      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhum registro de auditoria encontrado."
        />
      </section>
    </div>
  );
};
