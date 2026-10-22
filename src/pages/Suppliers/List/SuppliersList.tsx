import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction, type BadgeStatus } from '../../../components/common';
import VisualizarIcon from '../../../assets/icons/visualizar.svg?react';
import RedirecionarIcon from '../../../assets/icons/redirecionar.svg?react';
import { supplierApi, extractListData, extractTotalCount, type FornecedorDto, type FornecedorBigNumbers } from '../../../services';
import {
  LIMITE_LISTA_COMPLETA,
  useListagemServidor,
  type ConsultaPagina,
} from '../../../hooks/useListagemServidor';
import { exportToCsv } from '../../../utils/exportHelper';
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

export const formatDocument = (document: string | null | undefined) => {
  if (!document) return 'Não informado';
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
    key: 'name',
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

// Colunas que o backend ordena; as demais são ordenadas na tela.
const CAMPOS_ORDENACAO: Partial<Record<keyof Supplier, string>> = {
  name: 'nome',
  activatedAt: 'dataAtivacao',
  status: 'situacao',
};

const mapSupplier = (s: FornecedorDto): Supplier => {
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
    document: s.cnpjCpf ?? '',
    filePath: s.foto || null,
    activatedAt: activationDate,
    deactivatedAt: s.ativo === false ? 'Sim' : null,
    linkedBranches: s.contratosVigentes ? s.contratosVigentes.length : 1,
    linkedContracts: activeContractsCount,
    vehicles: vehiclesCount,
    status: badgeStatus,
  };
};

const buscarPaginaFornecedores = async ({ page, limit, busca, ordenarPor, direcao }: ConsultaPagina) => {
  const res = await supplierApi.list({ page, limit, nome: busca, ordenarPor, direcao });
  return { itens: extractListData<FornecedorDto>(res).map(mapSupplier), total: extractTotalCount(res) };
};

// A busca vai ao backend pelo nome; aqui ela vale para filtros locais e exportação.
const filtrarSupplier = (supplier: Supplier, filters: string[], busca: string) => {
  const normalizedQuery = busca.toLocaleLowerCase('pt-BR');
  const valuesOf = (prefix: string) =>
    filters.filter((filter) => filter.startsWith(prefix)).map((filter) => filter.replace(prefix, ''));
  const statusFilters = valuesOf('status:');
  const linkFilters = valuesOf('link:');
  const vehicleFilters = valuesOf('veiculos:');

  const matchesQuery =
    normalizedQuery.length === 0 || supplier.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery);

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
};

const filterSections: FilterSection[] = [
  {
    id: 'status',
    title: 'Status do Fornecedor',
    options: [
      { label: 'Ativo / Aprovado', value: 'status:aprovado' },
      { label: 'Inativo / Cancelado', value: 'status:cancelado' },
      { label: 'Pendente', value: 'status:pendente' },
    ],
  },
  {
    id: 'contratos',
    title: 'Contratos',
    options: [
      { label: 'Com contrato vigente', value: 'link:contrato' },
      { label: 'Sem contrato vigente', value: 'link:sem-contrato' },
    ],
  },
  {
    id: 'veiculos',
    title: 'Frota de Veículos',
    options: [
      { label: 'Com veículos na frota', value: 'veiculos:com' },
      { label: 'Sem veículos cadastrados', value: 'veiculos:sem' },
    ],
  },
];

export const SuppliersList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bigNumbers, setBigNumbers] = useState<FornecedorBigNumbers | null>(null);
  const [isLoadingBigNumbers, setIsLoadingBigNumbers] = useState(true);

  const lista = useListagemServidor<Supplier>({
    buscarPagina: buscarPaginaFornecedores,
    camposOrdenacao: CAMPOS_ORDENACAO,
    tamanhoPagina: PAGE_SIZE,
    filtrosLocais: selectedFilters,
    filtrar: filtrarSupplier,
    carregarCompleta: false,
  });
  const suppliersList = lista.todas;

  useEffect(() => {
    let isMounted = true;
    supplierApi
      .getAdminBigNumbers()
      .catch(() => supplierApi.getFilialBigNumbers())
      .then((res) => {
        if (isMounted && res?.response) setBigNumbers(res.response);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoadingBigNumbers(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (lista.erro) {
      showToast({ type: 'error', title: 'Erro ao carregar fornecedores', description: lista.erro.message });
    }
  }, [lista.erro, showToast]);

  const isLoading = isLoadingBigNumbers;


  const activeSuppliers = suppliersList.filter((supplier) => !supplier.deactivatedAt && supplier.status !== 'cancelado').length;
  const suppliersWithContracts = suppliersList.filter((supplier) => supplier.linkedContracts > 0).length;
  const totalVehicles = suppliersList.reduce((total, supplier) => total + supplier.vehicles, 0);

  const actions: TableAction<Supplier>[] = [
    {
      icon: <VisualizarIcon width={18} height={18} />,
      label: 'Visualizar fornecedor',
      onClick: (row) => navigate(`/terceiros/fornecedores/${row.id}`),
    },
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Editar fornecedor',
      onClick: (row) => navigate(`/terceiros/fornecedores/${row.id}/editar`),
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
          onSearch={lista.alterarBusca}
          onExport={async () => {
            try {
              const { itens: paraExportar, parcial } = await lista.carregarFiltrados();
              const ok = exportToCsv('fornecedores-frota', paraExportar, [
                { key: 'id', label: 'Código' },
                { key: 'name', label: 'Fornecedor' },
                { key: 'document', label: 'CNPJ/CPF' },
                { key: 'linkedBranches', label: 'Filiais atendidas' },
                { key: 'linkedContracts', label: 'Contratos vigentes' },
                { key: 'vehicles', label: 'Veículos ativos' },
                { key: 'status', label: 'Status' },
              ]);
              showToast(ok
                ? { type: 'success', title: 'Exportação concluída', description: 'O relatório em CSV foi baixado.' }
                : { type: 'warning', title: 'Aviso', description: 'Nenhum fornecedor encontrado para exportar.' });
              if (parcial) {
                showToast({
                  type: 'warning',
                  title: 'Exportação parcial',
                  description: `O arquivo tem só os primeiros ${LIMITE_LISTA_COMPLETA.toLocaleString('pt-BR')} registros.`,
                });
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Falha ao buscar os registros';
              showToast({ type: 'error', title: 'Erro ao exportar', description: message });
            }
          }}
          rightActions={<Button onClick={() => navigate('/terceiros/fornecedores/novo')}>Cadastrar fornecedor</Button>}
          filterSections={filterSections}
          selectedFilters={selectedFilters}
          onFilterChange={(values) => {
            setSelectedFilters(values);
            lista.setPagina(1);
          }}
          onFilterApply={() => showToast({ type: 'success', title: 'Filtro aplicado', description: 'A tabela foi atualizada.' })}
          onFilterClear={() => {
            setSelectedFilters([]);
            lista.setPagina(1);
            showToast({ type: 'info', title: 'Filtros limpos' });
          }}
        />

        <Table
          columns={columns}
          data={lista.itens}
          keyExtractor={(supplier) => supplier.id}
          actions={actions}
          emptyMessage="Nenhum fornecedor encontrado."
          isLoading={lista.isLoading}
          onSortChange={lista.alterarOrdenacao}
          pagination={{ currentPage: lista.pagina, totalPages: lista.totalPaginas, onPageChange: lista.setPagina, pageSize: PAGE_SIZE }}
        />
      </section>

    </div>
  );
};
