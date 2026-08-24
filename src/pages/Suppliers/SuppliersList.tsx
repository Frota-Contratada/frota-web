import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction, type BadgeStatus } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { supplierApi, extractListData, type FornecedorDto, type FornecedorBigNumbers } from '../../services';
import { formatDocument, type Supplier } from './suppliersData';
import styles from './Suppliers.module.css';

const PAGE_SIZE = 5;

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Ativo', value: 'status:aprovado' },
      { label: 'Pendente', value: 'status:pendente' },
      { label: 'Em andamento', value: 'status:em_andamento' },
      { label: 'Inativo', value: 'status:cancelado' },
    ],
  },
  {
    title: 'Vínculos',
    options: [
      { label: 'Com contrato', value: 'link:contrato' },
      { label: 'Sem contrato', value: 'link:sem-contrato' },
      { label: 'Com veículos', value: 'link:veiculos' },
    ],
  },
];

const columns: ColumnDef<Supplier>[] = [
  {
    key: 'name',
    header: 'Fornecedor',
    sortable: true,
    render: (_, row) => <strong className={styles.supplierName}>{row.name}</strong>,
  },
  {
    key: 'document',
    header: 'CNPJ/CPF',
    sortable: true,
    render: (_, row) => formatDocument(row.document),
  },
  {
    key: 'linkedContracts',
    header: 'Contratos vigentes',
    sortable: true,
    render: (_, row) => row.linkedContracts,
  },
  {
    key: 'vehicles',
    header: 'Veículos ativos',
    sortable: true,
    render: (_, row) => row.vehicles,
  },
  {
    key: 'activatedAt',
    header: 'Data de ativação',
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
];

export const SuppliersList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [bigNumbers, setBigNumbers] = useState<FornecedorBigNumbers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      supplierApi.list(),
      supplierApi.getAdminBigNumbers().catch(() => supplierApi.getFilialBigNumbers()),
    ])
      .then(([suppliersRes, bigNumbersRes]) => {
        if (!isMounted) return;

        if (bigNumbersRes.status === 'fulfilled' && bigNumbersRes.value.response) {
          setBigNumbers(bigNumbersRes.value.response);
        }

        if (suppliersRes.status === 'fulfilled') {
          const apiSuppliersData = extractListData<FornecedorDto>(suppliersRes.value);
          const apiSuppliers: Supplier[] = apiSuppliersData.map((s) => {
            let badgeStatus: BadgeStatus = 'em_andamento';
            if (s.ativo === true) {
              badgeStatus = 'aprovado';
            } else if (s.ativo === false) {
              badgeStatus = 'cancelado';
            } else if (s.status) {
              const raw = s.status.toLowerCase();
              if (raw === 'ativo' || raw === 'aprovado') badgeStatus = 'aprovado';
              else if (raw === 'pendente') badgeStatus = 'pendente';
              else if (raw === 'cancelado' || raw === 'inativo') badgeStatus = 'cancelado';
            }

            const activeContractsCount = s.contratosVigentes ? s.contratosVigentes.length : (s.totalContratos ?? 0);
            const vehiclesCount = s.quantidadeVeiculosAtivos ?? s.totalMotoristas ?? 0;
            const activationDate = s.dataAtivacao
              ? new Date(s.dataAtivacao).toLocaleDateString('pt-BR')
              : '—';

            return {
              id: s.id,
              name: s.nome,
              document: s.cnpjCpf,
              filePath: s.foto || null,
              activatedAt: activationDate,
              deactivatedAt: s.ativo === false ? 'Sim' : null,
              linkedBranches: s.contratosVigentes ? s.contratosVigentes.length : 1,
              linkedContracts: activeContractsCount,
              vehicles: vehiclesCount,
              status: badgeStatus,
            };
          });
          setSuppliersList(apiSuppliers);
        } else if (suppliersRes.status === 'rejected') {
          const msg = suppliersRes.reason instanceof Error ? suppliersRes.reason.message : 'Falha ao buscar fornecedores';
          showToast({ type: 'error', title: 'Erro ao carregar fornecedores', description: msg });
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar fornecedores';
        showToast({ type: 'error', title: message });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters
      .filter((filter) => filter.startsWith('status:'))
      .map((filter) => filter.replace('status:', ''));
    const linkFilters = selectedFilters
      .filter((filter) => filter.startsWith('link:'))
      .map((filter) => filter.replace('link:', ''));

    return suppliersList.filter((supplier) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        supplier.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        supplier.document.includes(normalizedQuery) ||
        formatDocument(supplier.document).toLocaleLowerCase('pt-BR').includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(supplier.status);
      const matchesLinks = linkFilters.length === 0 || linkFilters.some((filter) => {
        if (filter === 'contrato') return supplier.linkedContracts > 0;
        if (filter === 'sem-contrato') return supplier.linkedContracts === 0;
        if (filter === 'veiculos') return supplier.vehicles > 0;
        return false;
      });

      return matchesQuery && matchesStatus && matchesLinks;
    });
  }, [suppliersList, query, selectedFilters]);

  const activeSuppliers = suppliersList.filter((supplier) => !supplier.deactivatedAt).length;
  const suppliersWithContracts = suppliersList.filter((supplier) => supplier.linkedContracts > 0).length;
  const totalVehicles = suppliersList.reduce((total, supplier) => total + supplier.vehicles, 0);
  const pendingDocuments = suppliersList.filter((supplier) => !supplier.filePath).length;
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const pageData = filteredSuppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<Supplier>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar fornecedor',
      onClick: (row) => navigate(`/terceiros/fornecedores/${row.id}`),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo de fornecedores">
        <StatCard
          title="Fornecedores ativos"
          value={String(bigNumbers?.fornecedoresAtivos ?? activeSuppliers)}
          isLoading={isLoading}
        />
        <StatCard
          title="Com contrato vigente"
          value={String(bigNumbers?.fornecedoresComContratoVigente ?? suppliersWithContracts)}
          isLoading={isLoading}
        />
        <StatCard
          title="Sem contrato vigente"
          value={String(bigNumbers?.fornecedoresSemContratoVigente ?? (activeSuppliers - suppliersWithContracts))}
          isLoading={isLoading}
        />
        <StatCard
          title="Veículos ativos"
          value={String(bigNumbers?.veiculosAtivos ?? totalVehicles)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de fornecedores será preparada em instantes.' })}
          rightActions={<Button onClick={() => navigate('/terceiros/fornecedores/novo')}>Cadastrar fornecedor</Button>}
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
          keyExtractor={(supplier) => supplier.id}
          actions={actions}
          emptyMessage="Nenhum fornecedor encontrado."
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
