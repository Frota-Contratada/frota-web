import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction, type BadgeStatus } from '../../../components/common';
import RedirecionarIcon from '../../../assets/icons/redirecionar.svg?react';
import { collaboratorApi, extractListData, extractTotalCount, type ColaboradorDto, type ColaboradorBigNumbers } from '../../../services';
import {
  LIMITE_LISTA_COMPLETA,
  useListagemServidor,
  type ConsultaPagina,
} from '../../../hooks/useListagemServidor';
import { exportToCsv } from '../../../utils/exportHelper';
import styles from './EmployeesList.module.css';

export type Employee = {
  id: number;
  name: string;
  branch: string | null;
  supplier: string | null;
  searaCode: string | null;
  email: string;
  role: string | null;
  cpf: string | null;
  available: boolean;
  activatedAt: string;
  deactivatedAt: string | null;
  profiles: string[];
  status: BadgeStatus;
};

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

// Colunas que o backend ordena.
const CAMPOS_ORDENACAO: Partial<Record<keyof Employee, string>> = {
  name: 'nome',
  role: 'cargo',
};

const mapEmployee = (c: ColaboradorDto): Employee => ({
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
});

const buscarPaginaColaboradores = async ({ page, limit, busca, ordenarPor, direcao }: ConsultaPagina) => {
  const res = await collaboratorApi.list({ page, limit, nome: busca, ordenarPor, direcao });
  return { itens: extractListData<ColaboradorDto>(res).map(mapEmployee), total: extractTotalCount(res) };
};

// A busca vai ao backend pelo nome; aqui ela vale para filtros locais e exportação.
const filtrarEmployee = (employee: Employee, filters: string[], busca: string) => {
  const normalizedQuery = busca.toLocaleLowerCase('pt-BR');
  const valuesOf = (prefix: string) =>
    filters.filter((f) => f.startsWith(prefix)).map((f) => f.replace(prefix, ''));
  const perfilFilters = valuesOf('perfil:');
  const cargoFilters = valuesOf('cargo:');
  const filialFilters = valuesOf('filial:');

  const matchesQuery =
    normalizedQuery.length === 0 || employee.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery);

  const matchesPerfil =
    perfilFilters.length === 0 ||
    employee.profiles.some((p) => perfilFilters.includes(p));

  const matchesCargo =
    cargoFilters.length === 0 ||
    Boolean(employee.role && cargoFilters.includes(employee.role));

  const matchesFilial =
    filialFilters.length === 0 ||
    Boolean(employee.branch && filialFilters.includes(employee.branch));

  return matchesQuery && matchesPerfil && matchesCargo && matchesFilial;
};

export const EmployeesList = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bigNumbers, setBigNumbers] = useState<ColaboradorBigNumbers | null>(null);
  const [isLoadingBigNumbers, setIsLoadingBigNumbers] = useState(true);

  const lista = useListagemServidor<Employee>({
    buscarPagina: buscarPaginaColaboradores,
    camposOrdenacao: CAMPOS_ORDENACAO,
    tamanhoPagina: PAGE_SIZE,
    filtrosLocais: selectedFilters,
    filtrar: filtrarEmployee,
  });
  const employeesList = lista.todas;

  useEffect(() => {
    let isMounted = true;
    collaboratorApi
      .getAdminBigNumbers()
      .catch(() => collaboratorApi.getFilialBigNumbers())
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
      showToast({ type: 'error', title: 'Erro ao listar colaboradores', description: lista.erro.message });
    }
  }, [lista.erro, showToast]);

  const isLoading = isLoadingBigNumbers || lista.isLoadingTodas;

  const filterSections = useMemo<FilterSection[]>(() => {
    const allProfiles = Array.from(new Set(employeesList.flatMap((e) => e.profiles))).filter(Boolean).sort();
    const roles = Array.from(new Set(employeesList.map((e) => e.role).filter(Boolean))).sort() as string[];
    const branches = Array.from(new Set(employeesList.map((e) => e.branch).filter(Boolean))).sort() as string[];

    const sections: FilterSection[] = [];

    if (allProfiles.length > 0) {
      const formatProfileLabel = (p: string) => {
        const map: Record<string, string> = {
          ADMINISTRADOR_FILIAL: 'Administrador de Filial',
          ADMINISTRADOR_MATRIZ: 'Administrador Matriz',
          APROVADOR: 'Aprovador',
          SOLICITANTE: 'Solicitante',
          SOLICITANTE_EMERGENCIA: 'Solicitante de Emergência',
          MOTORISTA: 'Motorista',
        };
        return map[p] || p;
      };

      sections.push({
        id: 'perfil',
        title: 'Perfil de Acesso',
        options: allProfiles.map((p) => ({
          label: formatProfileLabel(p),
          value: `perfil:${p}`,
        })),
      });
    }

    if (roles.length > 0) {
      sections.push({
        id: 'cargo',
        title: 'Cargo',
        options: roles.map((r) => ({
          label: r,
          value: `cargo:${r}`,
        })),
      });
    }

    if (branches.length > 0) {
      sections.push({
        id: 'filial',
        title: 'Filial',
        options: branches.map((b) => ({
          label: b,
          value: `filial:${b}`,
        })),
      });
    }

    return sections;
  }, [employeesList]);

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
          onSearch={lista.alterarBusca}
          onExport={async () => {
            try {
              const { itens: paraExportar, parcial } = await lista.carregarFiltrados();
              const ok = exportToCsv('colaboradores-frota', paraExportar, [
                { key: 'id', label: 'Código' },
                { key: 'name', label: 'Colaborador' },
                { key: 'email', label: 'E-mail' },
                { key: 'branch', label: 'Filial' },
                { key: 'role', label: 'Cargo' },
                { key: 'profiles', label: 'Perfis', format: (value: string[]) => value.join(', ') },
                { key: 'status', label: 'Status' },
              ]);
              showToast(ok
                ? { type: 'success', title: 'Exportação concluída', description: 'O relatório em CSV foi baixado.' }
                : { type: 'warning', title: 'Aviso', description: 'Nenhum colaborador encontrado para exportar.' });
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
          rightActions={<Button onClick={() => navigate('/colaboradores/novo')}>Cadastrar colaborador</Button>}
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
          keyExtractor={(employee) => employee.id}
          actions={actions}
          emptyMessage="Nenhum colaborador encontrado."
          isLoading={lista.isLoading}
          onSortChange={lista.alterarOrdenacao}
          pagination={{ currentPage: lista.pagina, totalPages: lista.totalPaginas, onPageChange: lista.setPagina, pageSize: PAGE_SIZE }}
        />
      </section>
    </div>
  );
};
