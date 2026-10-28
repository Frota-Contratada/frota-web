import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  StatCard,
  Table,
  TableToolbar,
  useToast,
  type BadgeStatus,
  type ColumnDef,
  type FilterSection,
  type TableAction,
} from '../../../components/common';
import RedirecionarIcon from '../../../assets/icons/redirecionar.svg?react';
import {
  branchApi,
  costCenterApi,
  contractApi,
  ridesApi,
  extractListData,
  extractTotalCount,
  type FilialDto,
  type CentroCustoDto,
  type ContratoDto,
  type SolicitacaoDto,
} from '../../../services';
import { formatCnpj } from '../../../utils';
import {
  LIMITE_LISTA_COMPLETA,
  useListagemServidor,
  type ConsultaPagina,
} from '../../../hooks/useListagemServidor';
import { exportToCsv } from '../../../utils/exportHelper';
import styles from './BranchesList.module.css';

export type Branch = {
  id: number;
  name: string;
  cnpj?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  costCenters: number;
  suppliers: number;
  requests: number;
  activatedAt: string;
  deactivatedAt: string | null;
  status: BadgeStatus;
};

const PAGE_SIZE = 5;

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

const CAMPOS_ORDENACAO: Partial<Record<keyof Branch, string>> = {
  name: 'nome',
  cnpj: 'cnpj',
  city: 'cidade',
  state: 'uf',
};

type DadosAuxiliares = {
  costCenters: CentroCustoDto[];
  contracts: ContratoDto[];
  rides: SolicitacaoDto[];
};

const mapBranch = (b: FilialDto, { costCenters, contracts, rides }: DadosAuxiliares): Branch => {
  const numId = Number(b.id);
  const ccsCount = costCenters.filter((c) => Number(c.filialId) === numId).length;
  const suppliersCount = contracts.filter((c) =>
    c.vinculos?.some((v) => Number(v.filialId) === numId)
  ).length;
  const requestsCount = rides.filter((r) =>
    Number((r as any).filialId) === numId ||
    (r.origem && r.origem.cidade && b.endereco && r.origem.cidade.toLowerCase() === b.endereco.cidade.toLowerCase())
  ).length;

  const isDeactivated = Boolean((b as any).dataDesativacao || (b as any).dDesativacao);
  const status: BadgeStatus = isDeactivated ? 'cancelado' : 'aprovado';

  return {
    id: b.id,
    name: b.nome,
    cnpj: b.cnpj,
    zipCode: b.endereco?.cep || '',
    address: b.endereco?.logradouro
      ? `${b.endereco.logradouro}${b.endereco.numero ? `, ${b.endereco.numero}` : ''}`
      : '',
    neighborhood: b.endereco?.bairro || '',
    city: b.endereco?.cidade || '',
    state: b.endereco?.uf || '',
    costCenters: ccsCount,
    suppliers: suppliersCount,
    requests: requestsCount,
    activatedAt: (b as any).dataAtivacao
      ? new Date((b as any).dataAtivacao).toLocaleDateString('pt-BR')
      : '—',
    deactivatedAt: isDeactivated ? 'Inativa' : null,
    status,
  };
};

const filtrarBranch = (branch: Branch, filters: string[], busca: string) => {
  const normalizedQuery = busca.toLocaleLowerCase('pt-BR');
  const valuesOf = (prefix: string) =>
    filters.filter((filter) => filter.startsWith(prefix)).map((filter) => filter.replace(prefix, ''));
  const statusFilters = valuesOf('status:');
  const stateFilters = valuesOf('uf:');
  const cityFilters = valuesOf('cidade:');
  const linkFilters = valuesOf('vinculo:');

  const matchesQuery =
    normalizedQuery.length === 0 || branch.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
  const matchesStatus = statusFilters.length === 0 || statusFilters.includes(branch.status);
  const matchesState = stateFilters.length === 0 || stateFilters.includes(branch.state);
  const matchesCity = cityFilters.length === 0 || cityFilters.includes(branch.city);

  const matchesLink =
    linkFilters.length === 0 ||
    linkFilters.every((link) => {
      if (link === 'centros-custo') return branch.costCenters > 0;
      if (link === 'sem-centros-custo') return branch.costCenters === 0;
      if (link === 'fornecedores') return branch.suppliers > 0;
      if (link === 'sem-fornecedores') return branch.suppliers === 0;
      if (link === 'solicitacoes') return branch.requests > 0;
      return true;
    });

  return matchesQuery && matchesStatus && matchesState && matchesCity && matchesLink;
};

export const BranchesList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [auxiliares, setAuxiliares] = useState<DadosAuxiliares>({ costCenters: [], contracts: [], rides: [] });

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([costCenterApi.list(), contractApi.list(), ridesApi.list()]).then(
      ([costCentersRes, contractsRes, ridesRes]) => {
        if (!isMounted) return;
        setAuxiliares({
          costCenters:
            costCentersRes.status === 'fulfilled' ? extractListData<CentroCustoDto>(costCentersRes.value) : [],
          contracts:
            contractsRes.status === 'fulfilled' ? extractListData<ContratoDto>(contractsRes.value) : [],
          rides: ridesRes.status === 'fulfilled' ? extractListData<SolicitacaoDto>(ridesRes.value) : [],
        });
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const buscarPagina = useCallback(
    async ({ page, limit, busca, ordenarPor, direcao }: ConsultaPagina) => {
      const res = await branchApi.list({ page, limit, nome: busca, ordenarPor, direcao });
      return {
        itens: extractListData<FilialDto>(res).map((b) => mapBranch(b, auxiliares)),
        total: extractTotalCount(res),
      };
    },
    [auxiliares]
  );

  const lista = useListagemServidor<Branch>({
    buscarPagina,
    camposOrdenacao: CAMPOS_ORDENACAO,
    tamanhoPagina: PAGE_SIZE,
    filtrosLocais: selectedFilters,
    filtrar: filtrarBranch,
  });
  const branchesList = lista.todas;

  useEffect(() => {
    if (lista.erro) showToast({ type: 'error', title: lista.erro.message || 'Erro ao buscar filiais' });
  }, [lista.erro, showToast]);

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [];

    const uniqueUfs = Array.from(
      new Set(branchesList.map((b) => b.state).filter(Boolean))
    ).sort();

    if (uniqueUfs.length > 0) {
      sections.push({
        title: 'UF',
        options: uniqueUfs.map((uf) => ({ label: uf, value: `uf:${uf}` })),
      });
    }

    const uniqueCities = Array.from(
      new Set(branchesList.map((b) => b.city).filter(Boolean))
    ).sort();

    if (uniqueCities.length > 0) {
      sections.push({
        title: 'Cidade',
        options: uniqueCities.map((city) => ({ label: city, value: `cidade:${city}` })),
      });
    }

    sections.push({
      title: 'Status',
      options: [
        { label: 'Ativa', value: 'status:aprovado' },
        { label: 'Inativa', value: 'status:cancelado' },
      ],
    });

    sections.push({
      title: 'Vínculos',
      options: [
        { label: 'Com centros de custo', value: 'vinculo:centros-custo' },
        { label: 'Sem centros de custo', value: 'vinculo:sem-centros-custo' },
        { label: 'Com fornecedores', value: 'vinculo:fornecedores' },
        { label: 'Sem fornecedores', value: 'vinculo:sem-fornecedores' },
        { label: 'Com solicitações', value: 'vinculo:solicitacoes' },
      ],
    });

    return sections;
  }, [branchesList]);

  const totalStates = new Set(branchesList.map((b) => b.state).filter(Boolean)).size;
  const totalCities = new Set(branchesList.map((b) => b.city).filter(Boolean)).size;

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
          isLoading={lista.isLoadingTodas}
        />
        <StatCard
          title="Estados atendidos (UFs)"
          value={String(totalStates)}
          isLoading={lista.isLoadingTodas}
        />
        <StatCard
          title="Cidades atendidas"
          value={String(totalCities)}
          isLoading={lista.isLoadingTodas}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={lista.alterarBusca}
          onExport={async () => {
            try {
              const { itens: paraExportar, parcial } = await lista.carregarFiltrados();
              const ok = exportToCsv('filiais-frota', paraExportar, [
                { key: 'id', label: 'Código' },
                { key: 'name', label: 'Filial' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'address', label: 'Endereço' },
                { key: 'city', label: 'Cidade' },
                { key: 'state', label: 'UF' },
                { key: 'zipCode', label: 'CEP' },
                { key: 'status', label: 'Status' },
              ]);
              showToast(ok
                ? { type: 'success', title: 'Exportação concluída', description: 'O relatório em CSV foi baixado.' }
                : { type: 'warning', title: 'Aviso', description: 'Nenhuma filial encontrada para exportar.' });
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
          rightActions={<Button onClick={() => navigate('/filiais/nova')}>Cadastrar filial</Button>}
          filterSections={filterSections}
          selectedFilters={selectedFilters}
          onFilterChange={(values) => {
            setSelectedFilters(values);
            lista.setPagina(1);
          }}
          onFilterApply={() =>
            showToast({
              type: 'success',
              title: 'Filtro aplicado',
              description: 'A tabela foi atualizada.',
            })
          }
          onFilterClear={() => {
            setSelectedFilters([]);
            lista.setPagina(1);
            showToast({ type: 'info', title: 'Filtros limpos' });
          }}
        />

        <Table
          columns={columns}
          data={lista.itens}
          keyExtractor={(branch) => branch.id}
          actions={actions}
          emptyMessage="Nenhuma filial encontrada."
          isLoading={lista.isLoading}
          onSortChange={lista.alterarOrdenacao}
          pagination={{ currentPage: lista.pagina, totalPages: lista.totalPaginas, onPageChange: lista.setPagina, pageSize: PAGE_SIZE }}
        />
      </section>
    </div>
  );
};
