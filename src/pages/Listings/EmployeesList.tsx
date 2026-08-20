import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { collaboratorApi, driverApi, extractListData, type ColaboradorDto, type MotoristaDto, type ColaboradorBigNumbers } from '../../services';
import { formatCpf, type Employee } from './listingsData';
import styles from './Listings.module.css';

const PAGE_SIZE = 5;

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Ativo', value: 'status:aprovado' },
      { label: 'Indisponível', value: 'status:em_andamento' },
      { label: 'Inativo', value: 'status:cancelado' },
    ],
  },
  {
    title: 'Perfil',
    options: [
      { label: 'Solicitante', value: 'perfil:Solicitante' },
      { label: 'Aprovador', value: 'perfil:Aprovador' },
      { label: 'Motorista', value: 'perfil:Motorista' },
    ],
  },
  {
    title: 'Vínculo',
    options: [
      { label: 'Filial', value: 'vinculo:filial' },
      { label: 'Fornecedor', value: 'vinculo:fornecedor' },
    ],
  },
];

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toLocaleUpperCase('pt-BR');

const columns: ColumnDef<Employee>[] = [
  {
    key: 'avatar',
    header: '',
    width: '64px',
    render: (_, row) => <span className={styles.avatar} aria-label={`Foto de ${row.name}`}>{getInitials(row.name)}</span>,
  },
  {
    key: 'name',
    header: 'Colaborador',
    sortable: true,
    render: (_, row) => (
      <div className={styles.stackedCell}>
        <strong className={styles.primaryText}>{row.name}</strong>
        <span>{row.email}</span>
      </div>
    ),
  },
  { key: 'role', header: 'Cargo', sortable: true, render: (_, row) => row.role ?? 'Não informado' },
  { key: 'supplier', header: 'Fornecedor', sortable: true, render: (_, row) => row.supplier ?? '—' },
  { key: 'cpf', header: 'CPF', sortable: true, render: (_, row) => formatCpf(row.cpf) },
  { key: 'profiles', header: 'Perfis', render: (_, row) => <span className={styles.mutedText}>{row.profiles.join(', ')}</span> },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
];

export const EmployeesList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [bigNumbers, setBigNumbers] = useState<ColaboradorBigNumbers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      collaboratorApi.list(),
      collaboratorApi.getAdminBigNumbers().catch(() => collaboratorApi.getFilialBigNumbers()),
      driverApi.list(),
    ])
      .then(([collabRes, bigNumbersRes, driverRes]) => {
        if (!isMounted) return;

        if (bigNumbersRes.status === 'fulfilled' && bigNumbersRes.value.response) {
          setBigNumbers(bigNumbersRes.value.response);
        }

        const collabs = collabRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabRes.value) : [];
        const driversList = driverRes.status === 'fulfilled' ? extractListData<MotoristaDto>(driverRes.value) : [];

        if (collabs.length > 0) {
          const mapped: Employee[] = collabs.map((c: ColaboradorDto) => ({
            id: c.id,
            name: c.nome,
            email: c.email,
            cpf: c.cpf || null,
            searaCode: c.centroCustoId ? `CC-${c.centroCustoId}` : null,
            role: c.cargo || 'Colaborador',
            branch: c.filialNome || (c.filialId ? `Filial #${c.filialId}` : null),
            supplier: null,
            available: true,
            activatedAt: (c as any).dataAtivacao ? new Date((c as any).dataAtivacao).toLocaleDateString('pt-BR') : '—',
            deactivatedAt: null,
            profiles: c.perfis && c.perfis.length > 0 ? c.perfis.map((p) => p.tipoPerfil) : ['Solicitante'],
            status: 'aprovado',
          }));
          setEmployeesList(mapped);
        } else if (driversList.length > 0) {
          const apiEmployees: Employee[] = driversList.map((m: MotoristaDto) => ({
            id: m.id,
            name: m.nome,
            email: m.email,
            cpf: m.cpf,
            searaCode: null,
            role: 'Motorista',
            branch: null,
            supplier: m.fornecedorNome || (m.fornecedorId ? `Fornecedor #${m.fornecedorId}` : '—'),
            available: true,
            activatedAt: (m as any).dataAtivacao ? new Date((m as any).dataAtivacao).toLocaleDateString('pt-BR') : '—',
            deactivatedAt: null,
            profiles: ['Motorista'],
            status: 'aprovado',
          }));
          setEmployeesList(apiEmployees);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar colaboradores';
        showToast({ type: 'error', title: message });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const profileFilters = selectedFilters.filter((filter) => filter.startsWith('perfil:')).map((filter) => filter.replace('perfil:', ''));
    const linkFilters = selectedFilters.filter((filter) => filter.startsWith('vinculo:')).map((filter) => filter.replace('vinculo:', ''));

    return employeesList.filter((employee) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        employee.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.email.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.role?.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.branch?.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.supplier?.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.cpf?.includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(employee.status);
      const matchesProfile = profileFilters.length === 0 || profileFilters.some((profile) => employee.profiles.includes(profile));
      const matchesLink = linkFilters.length === 0 || linkFilters.some((link) => {
        if (link === 'filial') return Boolean(employee.branch);
        if (link === 'fornecedor') return Boolean(employee.supplier);
        return false;
      });

      return matchesQuery && matchesStatus && matchesProfile && matchesLink;
    });
  }, [employeesList, query, selectedFilters]);

  const activeEmployees = employeesList.filter((employee) => !employee.deactivatedAt).length;
  const drivers = employeesList.filter((employee) => employee.profiles.includes('Motorista')).length;
  const availableEmployees = employeesList.filter((employee) => employee.available).length;
  const supplierUsers = employeesList.filter((employee) => employee.supplier).length;
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const pageData = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<Employee>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar colaborador',
      onClick: (row) => navigate(`/colaboradores/${row.id}`),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo de colaboradores">
        <StatCard
          title="Colaboradores ativos"
          value={String(bigNumbers?.totalColaboradores ?? activeEmployees)}
          trend={{ value: 3.1, direction: 'up', label: 'vs. mês anterior' }}
          isLoading={isLoading}
        />
        <StatCard
          title="Solicitantes"
          value={String(bigNumbers?.totalSolicitantes ?? availableEmployees)}
          isLoading={isLoading}
        />
        <StatCard
          title="Aprovadores"
          value={String(bigNumbers?.aprovadores ?? bigNumbers?.totalAprovadores ?? drivers)}
          isLoading={isLoading}
        />
        <StatCard
          title="Usuários fornecedores"
          value={String(supplierUsers)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de colaboradores será preparada em instantes.' })}
          rightActions={<Button onClick={() => navigate('/colaboradores/novo')}>Cadastrar colaborador</Button>}
          filterSections={filterSections}
          selectedFilters={selectedFilters}
          onFilterChange={(values) => {
            setSelectedFilters(values);
            setCurrentPage(1);
          }}
          onFilterApply={() => showToast({ type: 'success', title: 'Filtro aplicado', description: 'A tabela foi atualizada.' })}
          onFilterClear={() => {
            setSelectedFilters([]);
            setCurrentPage(1);
            showToast({ type: 'info', title: 'Filtros limpos' });
          }}
        />

        <Table
          columns={columns}
          data={pageData}
          keyExtractor={(employee) => employee.id}
          actions={actions}
          emptyMessage="Nenhum colaborador encontrado."
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
