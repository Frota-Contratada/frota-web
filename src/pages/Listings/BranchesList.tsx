import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import { branchApi, extractListData, type FilialDto } from '../../services';
import { formatCnpj } from '../../utils';
import { type Branch } from './listingsData';
import styles from './Listings.module.css';

const PAGE_SIZE = 5;

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Ativa', value: 'status:aprovado' },
      { label: 'Pendente', value: 'status:pendente' },
      { label: 'Em implantação', value: 'status:em_andamento' },
      { label: 'Inativa', value: 'status:cancelado' },
    ],
  },
  {
    title: 'UF',
    options: [
      { label: 'SC', value: 'uf:SC' },
      { label: 'SP', value: 'uf:SP' },
      { label: 'PR', value: 'uf:PR' },
      { label: 'PE', value: 'uf:PE' },
    ],
  },
  {
    title: 'Vínculos',
    options: [
      { label: 'Com fornecedores', value: 'vinculo:fornecedores' },
      { label: 'Com solicitações', value: 'vinculo:solicitacoes' },
      { label: 'Com centros de custo', value: 'vinculo:centros-custo' },
    ],
  },
];

const columns: ColumnDef<Branch>[] = [
  {
    key: 'name',
    header: 'Filial',
    sortable: true,
    render: (_, row) => <strong className={styles.primaryText}>{row.name}</strong>,
  },
  {
    key: 'cnpj',
    header: 'CNPJ',
    sortable: true,
    render: (_, row) => (row.cnpj ? formatCnpj(row.cnpj) : '—'),
  },
  {
    key: 'address',
    header: 'Endereço',
    render: (_, row) => (
      <span className={styles.mutedText}>
        {row.address || '—'}{row.neighborhood ? `, ${row.neighborhood}` : ''}
      </span>
    ),
  },
  { key: 'city', header: 'Cidade', sortable: true },
  { key: 'state', header: 'UF', sortable: true },
  { key: 'zipCode', header: 'CEP', sortable: true },
];

export const BranchesList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    branchApi.list()
      .then((res) => {
        const branches = extractListData<FilialDto>(res);
        const apiBranches: Branch[] = branches.map((b) => ({
          id: b.id,
          name: b.nome,
          cnpj: b.cnpj,
          zipCode: b.endereco?.cep || '',
          address: b.endereco?.logradouro ? `${b.endereco.logradouro}${b.endereco.numero ? `, ${b.endereco.numero}` : ''}` : '',
          neighborhood: b.endereco?.bairro || '',
          city: b.endereco?.cidade || '',
          state: b.endereco?.uf || 'SC',
          costCenters: 0,
          suppliers: 0,
          requests: 0,
          activatedAt: '—',
          deactivatedAt: null,
          status: 'aprovado',
        }));
        setBranchesList(apiBranches);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao buscar filiais';
        showToast({ type: 'error', title: message });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [showToast]);

  const filteredBranches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters.filter((filter) => filter.startsWith('status:')).map((filter) => filter.replace('status:', ''));
    const stateFilters = selectedFilters.filter((filter) => filter.startsWith('uf:')).map((filter) => filter.replace('uf:', ''));
    const linkFilters = selectedFilters.filter((filter) => filter.startsWith('vinculo:')).map((filter) => filter.replace('vinculo:', ''));

    return branchesList.filter((branch) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        branch.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        branch.address.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        branch.neighborhood.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        branch.city.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        branch.zipCode.includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(branch.status);
      const matchesState = stateFilters.length === 0 || stateFilters.includes(branch.state);
      const matchesLink = linkFilters.length === 0 || linkFilters.some((link) => {
        if (link === 'fornecedores') return branch.suppliers > 0;
        if (link === 'solicitacoes') return branch.requests > 0;
        if (link === 'centros-custo') return branch.costCenters > 0;
        return false;
      });

      return matchesQuery && matchesStatus && matchesState && matchesLink;
    });
  }, [branchesList, query, selectedFilters]);

  const totalStates = new Set(branchesList.map((b) => b.state).filter(Boolean)).size;
  const totalCities = new Set(branchesList.map((b) => b.city).filter(Boolean)).size;
  const totalPages = Math.max(1, Math.ceil(filteredBranches.length / PAGE_SIZE));
  const pageData = filteredBranches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<Branch>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar filial',
      onClick: (row) => navigate(`/filiais/${row.id}`),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid3} aria-label="Resumo de filiais">
        <StatCard
          title="Filiais cadastradas"
          value={String(branchesList.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Estados atendidos (UFs)"
          value={String(totalStates)}
          isLoading={isLoading}
        />
        <StatCard
          title="Cidades atendidas"
          value={String(totalCities)}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de filiais será preparada em instantes.' })}
          rightActions={<Button onClick={() => navigate('/filiais/nova')}>Cadastrar filial</Button>}
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
          keyExtractor={(branch) => branch.id}
          actions={actions}
          emptyMessage="Nenhuma filial encontrada."
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>
    </div>
  );
};
