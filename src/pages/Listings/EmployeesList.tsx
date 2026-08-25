import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard, Table, TableToolbar, useToast, type ColumnDef, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { collaboratorApi, extractListData, type ColaboradorDto, type ColaboradorBigNumbers } from '../../services';
import { type Employee } from './listingsData';
import styles from './Listings.module.css';

const PAGE_SIZE = 5;

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
    render: (_, row) => (
      <span className={styles.avatar} aria-label={`Foto de ${row.name}`}>
        {getInitials(row.name)}
      </span>
    ),
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
  {
    key: 'role',
    header: 'Cargo',
    sortable: true,
    render: (_, row) => row.role ?? 'Não informado',
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
    ])
      .then(([collabRes, bigNumbersRes]) => {
        if (!isMounted) return;

        if (bigNumbersRes.status === 'fulfilled' && bigNumbersRes.value.response) {
          setBigNumbers(bigNumbersRes.value.response);
        }

        const collabs =
          collabRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabRes.value) : [];

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
        } else {
          setEmployeesList([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Falha ao carregar colaboradores';
        showToast({ type: 'error', title: 'Erro ao listar colaboradores', description: msg });
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

    return employeesList.filter((employee) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        employee.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        employee.email.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        (employee.role ?? '').toLocaleLowerCase('pt-BR').includes(normalizedQuery);

      return matchesQuery;
    });
  }, [query, employeesList]);

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
          title="Colaboradores cadastrados"
          value={String(employeesList.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Administradores de Filial"
          value={String(bigNumbers?.administradoresDeFilial ?? 0)}
          isLoading={isLoading}
        />
        <StatCard
          title="Aprovadores"
          value={String(bigNumbers?.aprovadores ?? 0)}
          isLoading={isLoading}
        />
        <StatCard
          title="Solicitantes de Emergência"
          value={String(bigNumbers?.solicitantesDeEmergencia ?? 0)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() =>
            showToast({
              type: 'success',
              title: 'Exportação iniciada',
              description: 'A lista de colaboradores será preparada em instantes.',
            })
          }
          filterSections={[]}
          selectedFilters={selectedFilters}
          onFilterChange={(values) => {
            setSelectedFilters(values);
            setCurrentPage(1);
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
