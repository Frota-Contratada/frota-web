import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection } from '../../../components/common';
import { driverApi, extractListData, extractTotalCount, type MotoristaDto } from '../../../services';
import {
  LIMITE_LISTA_COMPLETA,
  useListagemServidor,
  type ConsultaPagina,
} from '../../../hooks/useListagemServidor';
import { exportToCsv } from '../../../utils/exportHelper';
import { formatCpf } from '../../../utils';
import styles from '../Fleet.module.css';

const formatPhone = (phone?: string | null) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
};

const PAGE_SIZE = 5;

const filterSections: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Ativo', value: 'status:ativo' },
      { label: 'Inativo', value: 'status:inativo' },
    ],
  },
];

const CAMPOS_ORDENACAO: Partial<Record<keyof MotoristaDto, string>> = {
  nome: 'nome',
  dataAtivacao: 'dataAtivacao',
};

const buscarPaginaMotoristas = async ({ page, limit, busca, ordenarPor, direcao }: ConsultaPagina) => {
  const res = await driverApi.list({ page, limit, nome: busca, ordenarPor, direcao });
  return { itens: extractListData<MotoristaDto>(res), total: extractTotalCount(res) };
};

const filtrarMotorista = (driver: MotoristaDto, filters: string[], busca: string) => {
  const q = busca.toLowerCase();
  const matchesQuery = !q || driver.nome.toLowerCase().includes(q);

  const statusFilter = filters
    .filter((f) => f.startsWith('status:'))
    .map((f) => f.replace('status:', ''));

  let matchesStatus = true;
  if (statusFilter.length > 0) {
    matchesStatus = statusFilter.some((st) => {
      if (st === 'ativo') return driver.ativo !== false;
      if (st === 'inativo') return driver.ativo === false;
      return true;
    });
  }

  return matchesQuery && matchesStatus;
};

export const DriversList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const lista = useListagemServidor<MotoristaDto>({
    buscarPagina: buscarPaginaMotoristas,
    camposOrdenacao: CAMPOS_ORDENACAO,
    tamanhoPagina: PAGE_SIZE,
    filtrosLocais: selectedFilters,
    filtrar: filtrarMotorista,
  });
  const drivers = lista.todas;
  const isLoading = lista.isLoadingTodas;

  useEffect(() => {
    if (lista.erro) {
      showToast({ type: 'error', title: 'Erro', description: 'Não foi possível carregar os motoristas.' });
    }
  }, [lista.erro, showToast]);

  const totalActive = drivers.filter((d) => d.ativo !== false).length;
  const totalInactive = drivers.filter((d) => d.ativo === false).length;
  const uniqueSuppliers = new Set(drivers.map((d) => d.fornecedorId)).size;

  const columns: ColumnDef<MotoristaDto>[] = [
    {
      key: 'nome',
      header: 'Motorista',
      sortable: true,
      render: (_, row) => (
        <div>
          <strong className={styles.primaryText}>{row.nome}</strong>
          <span className={styles.secondaryText} style={{ display: 'block' }}>
            {row.email}
          </span>
        </div>
      ),
    },
    {
      key: 'cpf',
      header: 'CPF',
      sortable: true,
      render: (_, row) => formatCpf(row.cpf),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (_, row) => formatPhone(row.telefone),
    },
    {
      key: 'fornecedorNome',
      header: 'Fornecedor',
      sortable: true,
      render: (_, row) => row.fornecedorNome || `Fornecedor #${row.fornecedorId}`,
    },
    {
      key: 'dataAtivacao',
      header: 'Data de Cadastro',
      sortable: true,
      render: (_, row) =>
        row.dataAtivacao ? new Date(row.dataAtivacao).toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'ativo',
      header: 'Status',
      sortable: true,
      render: (_, row) => (
        <StatusBadge
          status={row.ativo !== false ? 'aprovado' : 'cancelado'}
          label={row.ativo !== false ? 'Ativo' : 'Inativo'}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo dos motoristas">
        <StatCard title="Total de motoristas" value={String(drivers.length)} isLoading={isLoading} />
        <StatCard title="Motoristas ativos" value={String(totalActive)} isLoading={isLoading} />
        <StatCard title="Inativos" value={String(totalInactive)} isLoading={isLoading} />
        <StatCard title="Fornecedores vinculados" value={String(uniqueSuppliers)} isLoading={isLoading} />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={lista.alterarBusca}
          onExport={async () => {
            try {
              const { itens: paraExportar, parcial } = await lista.carregarFiltrados();
              const ok = exportToCsv('motoristas-frota', paraExportar, [
                { key: 'id', label: 'ID' },
                { key: 'nome', label: 'Nome' },
                {
                  key: 'cpf',
                  label: 'CPF',
                  format: (val) => formatCpf(val),
                },
                {
                  key: 'telefone',
                  label: 'Telefone',
                  format: (val) => formatPhone(val),
                },
                { key: 'email', label: 'E-mail' },
                { key: 'fornecedorNome', label: 'Fornecedor' },
                {
                  key: 'ativo',
                  label: 'Status',
                  format: (val) => (val !== false ? 'Ativo' : 'Inativo'),
                },
              ]);
              if (ok) {
                showToast({ type: 'success', title: 'Relatório exportado', description: 'CSV de motoristas baixado com sucesso.' });
              }
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
          rightActions={
            <Button onClick={() => navigate('/terceiros/motoristas/novo')}>
              Cadastrar motorista
            </Button>
          }
          filterSections={filterSections}
          selectedFilters={selectedFilters}
          onFilterChange={(vals) => {
            setSelectedFilters(vals);
            lista.setPagina(1);
          }}
          onFilterClear={() => {
            setSelectedFilters([]);
            lista.setPagina(1);
          }}
        />

        <Table
          columns={columns}
          data={lista.itens}
          keyExtractor={(row) => String(row.id)}
          emptyMessage="Nenhum motorista encontrado."
          isLoading={lista.isLoading}
          onSortChange={lista.alterarOrdenacao}
          pagination={{ currentPage: lista.pagina, totalPages: lista.totalPaginas, onPageChange: lista.setPagina, pageSize: PAGE_SIZE }}
        />
      </section>
    </div>
  );
};
