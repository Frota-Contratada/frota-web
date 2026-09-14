import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction, type BadgeStatus } from '../../../components/common';
import RedirecionarIcon from '../../../assets/icons/redirecionar.svg?react';
import { supplierApi, extractListData, type FornecedorDto, type FornecedorBigNumbers } from '../../../services';
import styles from './SuppliersList.module.css';

export type Supplier = {
  id: number;
  name: string;
  document: string;
  filePath: string | null;
  activatedAt: string;
  deactivatedAt: string | null;
  linkedBranches: number;
  linkedContracts: number;
  vehicles: number;
  status: BadgeStatus;
};

export const formatDocument = (document: string) => {
  if (document.length === 14) {
    return document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  if (document.length === 11) {
    return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  return document;
};

const PAGE_SIZE = 5;

const columns: ColumnDef<Supplier>[] = [
  {
    key: 'id',
    header: 'Fornecedor',
    sortable: true,
    render: (_, row) => (
      <span className={styles.supplierName}>{row.name}</span>
    ),
  },
  {
    key: 'document',
    header: 'CNPJ/CPF',
    sortable: true,
    render: (_, row) => formatDocument(row.document),
  },
  {
    key: 'filePath',
    header: 'Arquivo',
    render: (_, row) => (
      row.filePath ? (
        <span className={styles.fileText}>Foto enviada</span>
      ) : (
        <span className={styles.emptyFile}>Sem anexo</span>
      )
    ),
  },
  { key: 'activatedAt', header: 'Data de ativação', sortable: true },
  { key: 'linkedBranches', header: 'Filiais atendidas', sortable: true },
  { key: 'linkedContracts', header: 'Contratos vigentes', sortable: true },
  { key: 'vehicles', header: 'Veículos ativos', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
];

export const SuppliersList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
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
      .then(([suppliersRes, numbersRes]) => {
        if (!isMounted) return;

        if (numbersRes.status === 'fulfilled' && numbersRes.value && numbersRes.value.response) {
          setBigNumbers(numbersRes.value.response);
        }

        if (suppliersRes.status === 'fulfilled' && suppliersRes.value) {
          const rawList = extractListData<FornecedorDto>(suppliersRes.value);
          const apiSuppliers: Supplier[] = rawList.map((s) => {
            let badgeStatus: BadgeStatus = 'aprovado';
            if (s.ativo === true) {
              badgeStatus = 'aprovado';
            } else if (s.ativo === false) {
              badgeStatus = 'cancelado';
            } else if (s.status) {
              const raw = s.status.toLowerCase();
              if (raw === 'ativo' || raw === 'aprovado') badgeStatus = 'aprovado';
              else if (raw === 'pendente') badgeStatus = 'pendente';
              else if (raw === 'cancelado' || raw === 'inativo') badgeStatus = 'cancelado';
              else badgeStatus = 'em_andamento';
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



  const filterSections = useMemo<FilterSection[]>(() => {
    const statuses = Array.from(new Set(suppliersList.map((s) => s.status))).filter(Boolean);
    const hasWithContract = suppliersList.some((s) => s.linkedContracts > 0);
    const hasWithoutContract = suppliersList.some((s) => s.linkedContracts === 0);
    const hasVehicles = suppliersList.some((s) => s.vehicles > 0);
    const hasNoVehicles = suppliersList.some((s) => s.vehicles === 0);

    const sections: FilterSection[] = [];

    if (statuses.length > 0) {
      sections.push({
        id: 'status',
        title: 'Status do Fornecedor',
        options: statuses.map((status) => ({
          label: status === 'aprovado' ? 'Ativo / Aprovado' : status === 'cancelado' ? 'Inativo / Cancelado' : status === 'pendente' ? 'Pendente' : 'Em andamento',
          value: `status:${status}`,
        })),
      });
    }

    const linkOptions = [];
    if (hasWithContract) linkOptions.push({ label: 'Com contrato vigente', value: 'link:contrato' });
    if (hasWithoutContract) linkOptions.push({ label: 'Sem contrato vigente', value: 'link:sem-contrato' });
    if (linkOptions.length > 0) {
      sections.push({
        id: 'contratos',
        title: 'Contratos',
        options: linkOptions,
      });
    }

    const vehicleOptions = [];
    if (hasVehicles) vehicleOptions.push({ label: 'Com veículos na frota', value: 'veiculos:com' });
    if (hasNoVehicles) vehicleOptions.push({ label: 'Sem veículos cadastrados', value: 'veiculos:sem' });
    if (vehicleOptions.length > 0) {
      sections.push({
        id: 'veiculos',
        title: 'Frota de Veículos',
        options: vehicleOptions,
      });
    }

    return sections;
  }, [suppliersList]);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters
      .filter((filter) => filter.startsWith('status:'))
      .map((filter) => filter.replace('status:', ''));
    const linkFilters = selectedFilters
      .filter((filter) => filter.startsWith('link:'))
      .map((filter) => filter.replace('link:', ''));
    const vehicleFilters = selectedFilters
      .filter((filter) => filter.startsWith('veiculos:'))
      .map((filter) => filter.replace('veiculos:', ''));

    return suppliersList.filter((supplier) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        supplier.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        supplier.document.includes(normalizedQuery) ||
        (supplier.filePath && supplier.filePath.toLocaleLowerCase('pt-BR').includes(normalizedQuery));

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(supplier.status);
      const matchesLinks =
        linkFilters.length === 0 ||
        (linkFilters.includes('contrato') && supplier.linkedContracts > 0) ||
        (linkFilters.includes('sem-contrato') && supplier.linkedContracts === 0);
      const matchesVehicles =
        vehicleFilters.length === 0 ||
        (vehicleFilters.includes('com') && supplier.vehicles > 0) ||
        (vehicleFilters.includes('sem') && supplier.vehicles === 0);

      return matchesQuery && matchesStatus && matchesLinks && matchesVehicles;
    });
  }, [suppliersList, query, selectedFilters]);

  const activeSuppliers = suppliersList.filter((supplier) => !supplier.deactivatedAt && supplier.status !== 'cancelado').length;
  const suppliersWithContracts = suppliersList.filter((supplier) => supplier.linkedContracts > 0).length;
  const totalVehicles = suppliersList.reduce((total, supplier) => total + supplier.vehicles, 0);
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
          value={String(bigNumbers?.fornecedoresSemContratoVigente ?? Math.max(0, activeSuppliers - suppliersWithContracts))}
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
