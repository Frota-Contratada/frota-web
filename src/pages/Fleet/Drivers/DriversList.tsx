import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../../components/common';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import { driverApi, type MotoristaDto } from '../../../services';
import { exportToCsv } from '../../../utils/exportHelper';
import styles from '../Fleet.module.css';

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

export const DriversList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState<MotoristaDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDriverForStatus, setSelectedDriverForStatus] = useState<MotoristaDto | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const res = await driverApi.list();
      if (Array.isArray(res.response)) {
        setDrivers(res.response);
      } else if (res.response && Array.isArray(res.response.data)) {
        setDrivers(res.response.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', description: 'Não foi possível carregar os motoristas.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        driver.nome.toLowerCase().includes(q) ||
        driver.cpf.includes(q) ||
        (driver.fornecedorNome && driver.fornecedorNome.toLowerCase().includes(q));

      const statusFilter = selectedFilters
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
    });
  }, [drivers, query, selectedFilters]);

  const totalActive = drivers.filter((d) => d.ativo !== false).length;
  const totalInactive = drivers.filter((d) => d.ativo === false).length;
  const uniqueSuppliers = new Set(drivers.map((d) => d.fornecedorId)).size;

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  const pageData = filteredDrivers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleStatus = async () => {
    if (!selectedDriverForStatus) return;
    const isCurrentlyActive = selectedDriverForStatus.ativo !== false;
    try {
      setIsUpdatingStatus(true);
      await driverApi.toggleStatus(selectedDriverForStatus.id, isCurrentlyActive);

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === selectedDriverForStatus.id ? { ...d, ativo: !isCurrentlyActive } : d
        )
      );

      showToast({
        type: isCurrentlyActive ? 'warning' : 'success',
        title: isCurrentlyActive ? 'Motorista inativado' : 'Motorista ativado',
        description: `O motorista ${selectedDriverForStatus.nome} foi ${isCurrentlyActive ? 'inativado' : 'ativado'} com sucesso.`,
      });
      setSelectedDriverForStatus(null);
    } catch {
      showToast({ type: 'error', title: 'Erro', description: 'Falha ao alterar status do motorista.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
    { key: 'cpf', header: 'CPF', sortable: true },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (_, row) => row.telefone || '—',
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
      render: (_, row) =>
        row.dataAtivacao ? new Date(row.dataAtivacao).toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'ativo',
      header: 'Status',
      sortable: true,
      render: (_, row) => (
        <StatusBadge status={row.ativo !== false ? 'aprovado' : 'cancelado'} />
      ),
    },
  ];

  const actions: TableAction<MotoristaDto>[] = [
    {
      icon: <ErroIcon width={16} height={16} />,
      label: 'Alterar status (ativar/inativar)',
      onClick: (row) => setSelectedDriverForStatus(row),
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
          onSearch={(val) => {
            setQuery(val);
            setCurrentPage(1);
          }}
          onExport={() => {
            const ok = exportToCsv('motoristas-frota', filteredDrivers, [
              { key: 'id', label: 'ID' },
              { key: 'nome', label: 'Nome' },
              { key: 'cpf', label: 'CPF' },
              { key: 'telefone', label: 'Telefone' },
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
            setCurrentPage(1);
          }}
          onFilterClear={() => setSelectedFilters([])}
        />

        <Table
          columns={columns}
          data={pageData}
          keyExtractor={(row) => String(row.id)}
          actions={actions}
          emptyMessage="Nenhum motorista encontrado."
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>

      {selectedDriverForStatus && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>
              {selectedDriverForStatus.ativo !== false ? 'Inativar Motorista' : 'Reativar Motorista'}
            </h3>
            <p>
              Tem certeza que deseja {selectedDriverForStatus.ativo !== false ? 'inativar' : 'reativar'} o motorista{' '}
              <strong>{selectedDriverForStatus.nome}</strong> (CPF: {selectedDriverForStatus.cpf})?
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setSelectedDriverForStatus(null)} disabled={isUpdatingStatus}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleToggleStatus}
                isLoading={isUpdatingStatus}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
