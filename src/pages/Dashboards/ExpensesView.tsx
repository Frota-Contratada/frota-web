import { useState } from 'react';
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
import { StatCard, Table, TableToolbar, type ColumnDef } from '../../components/common';
import { expensesTableData, type ExpensesTableRow } from './dashboardsData';
import styles from './Dashboards.module.css';

const costCenterChartData = [
  { name: 'RH', valor: 80 },
  { name: 'Qualidade', valor: 25 },
  { name: 'Jurídico', valor: 78 },
  { name: 'Financeiro', valor: 45 },
  { name: 'Engenharia', valor: 90 },
];

const monthlyExpensesData = [
  { name: 'Jan', valor: 12000 },
  { name: 'Fev', valor: 15000 },
  { name: 'Mar', valor: 18000 },
  { name: 'Abr', valor: 14000 },
  { name: 'Mai', valor: 20000 },
  { name: 'Jun', valor: 17000 },
];

const columns: ColumnDef<ExpensesTableRow>[] = [
  {
    key: 'centroCusto',
    header: 'Centro de custo',
    sortable: true,
    render: (val) => <strong className={styles.primaryText}>{String(val)}</strong>,
  },
  { key: 'responsavel', header: 'Responsável', sortable: true },
  {
    key: 'valor',
    header: 'Valor total',
    sortable: true,
    render: (val) => <strong>{String(val)}</strong>,
  },
];

export const ExpensesView = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const expensesFilterSections = [
    {
      title: 'Centro de Custo',
      options: [
        { label: 'CT-410203', value: 'cc:CT-410203' },
        { label: 'CT-122132', value: 'cc:CT-122132' },
        { label: 'CT-672652', value: 'cc:CT-672652' },
        { label: 'CT-096443', value: 'cc:CT-096443' },
        { label: 'CT-875426', value: 'cc:CT-875426' },
      ],
    },
  ];

  const filteredData = expensesTableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.some((filter) => {
      const [key, val] = filter.split(':');
      if (key === 'cc') return item.centroCusto === val;
      return true;
    });
  });

  return (
    <div className={styles.page}>
      {}
      <TableToolbar
        filterSections={expensesFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      {}
      <section className={styles.statsGrid}>
        <StatCard title="Gasto total" value="R$ 20.000" />
        <StatCard title="Preço médio" value="R$ 229" />
        <StatCard title="Top centro de custo" value="CT-13313" />
        <StatCard title="Maior preço" value="R$ 600" />
      </section>

      {}
      <section className={styles.chartsGrid}>
        {}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Maiores gastos por centro de custo</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={costCenterChartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Participação']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="valor" fill="#0052cc" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Evolução mensal de gastos</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
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
                  tickFormatter={(val) => `R$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Gasto']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#00a3ff" strokeWidth={3} fillOpacity={1} fill="url(#expensesGrad)" />
              </AreaChart>
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
          emptyMessage="Nenhum gasto encontrado."
        />
      </section>
    </div>
  );
};
