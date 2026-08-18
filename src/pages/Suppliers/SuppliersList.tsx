import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { supplierApi } from '../../services';
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
    header: 'Contratos',
    sortable: true,
    render: (_, row) => row.linkedContracts,
  },
  {
    key: 'vehicles',
    header: 'Veículos',
    sortable: true,
    render: (_, row) => row.vehicles,
  },
  {
    key: 'activatedAt',
    header: 'Ativação',
    sortable: true,
  },
  {
    key: 'filePath',
    header: 'Arquivo',
    render: (_, row) => row.filePath ? <span className={styles.fileText}>Anexado</span> : <span className={styles.emptyFile}>Não enviado</span>,
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

  useEffect(() => {
    supplierApi.list()
      .then((res) => {
        if (res.response && Array.isArray(res.response)) {
          const apiSuppliers: Supplier[] = res.response.map((s) => ({
            id: s.id,
            name: s.nome,
            document: s.cnpjCpf,
            filePath: null,
            activatedAt: '01/01/2026',
            deactivatedAt: null,
            linkedBranches: 1,
            linkedContracts: 1,
            vehicles: 0,
            status: 'aprovado',
          }));
          setSuppliersList(apiSuppliers);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar fornecedores';
        showToast({ type: 'error', title: message });
      });
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
        <StatCard title="Fornecedores ativos" value={String(activeSuppliers)} trend={{ value: 6, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="Com contrato" value={String(suppliersWithContracts)} />
        <StatCard title="Veículos vinculados" value={String(totalVehicles)} trend={{ value: 4.5, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="Documentos pendentes" value={String(pendingDocuments)} />
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
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
