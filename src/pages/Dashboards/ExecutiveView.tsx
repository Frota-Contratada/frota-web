import { useState } from 'react';
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
import { StatCard, Table, TableToolbar, StatusBadge, type ColumnDef, type BadgeStatus } from '../../components/common';
import { executiveTableData, type ExecutiveTableRow } from './dashboardsData';
import styles from './Dashboards.module.css';

const lineChartData = [
  { name: 'JAN', valor: 65 },
  { name: 'FEV', valor: 85 },
  { name: 'MAR', valor: 140 },
  { name: 'ABR', valor: 90 },
  { name: 'MAI', valor: 160 },
  { name: 'JUN', valor: 110 },
  { name: 'JUL', valor: 180 },
  { name: 'AGO', valor: 120 },
  { name: 'SET', valor: 190 },
  { name: 'OUT', valor: 130 },
  { name: 'NOV', valor: 175 },
  { name: 'DEZ', valor: 150 },
];

const pieChartData = [
  { name: 'Viex', value: 33000, color: '#0052cc' },
  { name: 'Cars Company', value: 25000, color: '#00a3ff' },
  { name: 'Fretado', value: 18000, color: '#70d6ff' },
];

const statusMap: Record<ExecutiveTableRow['status'], BadgeStatus> = {
  Concluído: 'aprovado',
  Pendente: 'pendente',
  'Em andamento': 'em_andamento',
};

const columns: ColumnDef<ExecutiveTableRow>[] = [
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
    render: (value) => <StatusBadge status={statusMap[value as ExecutiveTableRow['status']]} />,
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

  const executiveFilterSections = [
    {
      title: 'Status',
      options: [
        { label: 'Concluído', value: 'status:Concluído' },
        { label: 'Pendente', value: 'status:Pendente' },
        { label: 'Em andamento', value: 'status:Em andamento' },
      ],
    },
  ];

  const filteredTableData = executiveTableData.filter((item) => {
    if (selectedFilters.length === 0) return true;
    return selectedFilters.some((filter) => {
      const [key, val] = filter.split(':');
      if (key === 'status') return item.status === val;
      return true;
    });
  });

  return (
    <div className={styles.page}>
      {/* Header com botão de filtro */}
      <TableToolbar
        filterSections={executiveFilterSections}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />

      {/* Stats Cards utilizando o componente padrão StatCard */}
      <section className={styles.statsGrid}>
        <StatCard
          title="Total de corridas"
          value="54"
          trend={{ value: 8.5, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard
          title="Corridas concluídas"
          value="43"
          trend={{ value: 10, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard
          title="Corridas emergenciais"
          value="10"
          trend={{ value: 1.5, direction: 'up', label: 'Maior que ontem' }}
        />
        <StatCard title="Top 1 fornecedor por gasto" value="VIEX" />
      </section>

      {/* Grid de Gráficos usando Recharts */}
      <section className={styles.chartsGrid}>
        {/* Gráfico de Área / Linha */}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gasto total</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  tickFormatter={(val) => `$${val}K`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${val}K`, 'Gasto']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#2C2C9E" strokeWidth={3} fillOpacity={1} fill="url(#execColorGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Gráfico de Donut / Pie */}
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <span className={styles.chartEyebrow}>Estatísticas</span>
              <h3 className={styles.chartTitle}>Gasto por Fornecedor</h3>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
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
          </div>
        </article>
      </section>

      {/* Tabela Padrão */}
      <section className={styles.tableSection}>
        <Table
          columns={columns}
          data={filteredTableData}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhuma corrida registrada na visão executiva."
        />
      </section>
    </div>
  );
};
