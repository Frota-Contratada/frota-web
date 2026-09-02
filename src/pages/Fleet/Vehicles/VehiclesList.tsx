import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../../components/common';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import { vehicleApi, type VeiculoDto } from '../../../services';
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

export const VehiclesList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<VeiculoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState<VeiculoDto | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await vehicleApi.list();
      if (Array.isArray(res.response)) {
        setVehicles(res.response);
      } else if (res.response && Array.isArray(res.response.data)) {
        setVehicles(res.response.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', description: 'Não foi possível carregar os veículos.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const q = query.toUpperCase().trim();
      const matchesQuery =
        !q ||
        vehicle.placa.toUpperCase().includes(q) ||
        vehicle.modelo.toUpperCase().includes(q) ||
        (vehicle.fornecedorNome && vehicle.fornecedorNome.toUpperCase().includes(q));

      const statusFilter = selectedFilters
        .filter((f) => f.startsWith('status:'))
        .map((f) => f.replace('status:', ''));

      let matchesStatus = true;
      if (statusFilter.length > 0) {
        matchesStatus = statusFilter.some((st) => {
          if (st === 'ativo') return vehicle.ativo !== false;
          if (st === 'inativo') return vehicle.ativo === false;
          return true;
        });
      }

      return matchesQuery && matchesStatus;
    });
  }, [vehicles, query, selectedFilters]);

  const totalActive = vehicles.filter((v) => v.ativo !== false).length;
  const totalInactive = vehicles.filter((v) => v.ativo === false).length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacidadePassageiros || 4), 0);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const pageData = filteredVehicles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleStatus = async () => {
    if (!selectedVehicleForStatus) return;
    const isCurrentlyActive = selectedVehicleForStatus.ativo !== false;
    try {
      setIsUpdatingStatus(true);
      await vehicleApi.toggleStatus(selectedVehicleForStatus.id, isCurrentlyActive);

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === selectedVehicleForStatus.id ? { ...v, ativo: !isCurrentlyActive } : v
        )
      );

      showToast({
        type: isCurrentlyActive ? 'warning' : 'success',
        title: isCurrentlyActive ? 'Veículo desativado' : 'Veículo ativado',
        description: `O veículo ${selectedVehicleForStatus.modelo} (${selectedVehicleForStatus.placa}) foi ${isCurrentlyActive ? 'desativado' : 'ativado'} com sucesso.`,
      });
      setSelectedVehicleForStatus(null);
    } catch {
      showToast({ type: 'error', title: 'Erro', description: 'Falha ao alterar status do veículo.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const columns: ColumnDef<VeiculoDto>[] = [
    {
      key: 'placa',
      header: 'Placa',
      sortable: true,
      render: (_, row) => <span className={styles.plateBadge}>{row.placa}</span>,
    },
    {
      key: 'modelo',
      header: 'Modelo do Veículo',
      sortable: true,
      render: (_, row) => (
        <div>
          <strong className={styles.primaryText}>{row.modelo}</strong>
          <span className={styles.secondaryText} style={{ display: 'block' }}>
            {row.tipoVeiculoNome || 'Categoria Padrão'}
          </span>
        </div>
      ),
    },
    {
      key: 'capacidadePassageiros',
      header: 'Capacidade',
      sortable: true,
      render: (_, row) => `${row.capacidadePassageiros || 4} passageiros`,
    },
    {
      key: 'fornecedorNome',
      header: 'Fornecedor Proprietário',
      sortable: true,
      render: (_, row) => row.fornecedorNome || `Fornecedor #${row.fornecedorId}`,
    },
    {
      key: 'dataAtivacao',
      header: 'Data de Ativação',
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

  const actions: TableAction<VeiculoDto>[] = [
    {
      icon: <ErroIcon width={16} height={16} />,
      label: 'Alterar status (ativar/desativar)',
      onClick: (row) => setSelectedVehicleForStatus(row),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo dos veículos da frota">
        <StatCard title="Total de veículos" value={String(vehicles.length)} isLoading={isLoading} />
        <StatCard title="Veículos ativos" value={String(totalActive)} isLoading={isLoading} />
        <StatCard title="Desativados" value={String(totalInactive)} isLoading={isLoading} />
        <StatCard title="Lugares disponíveis" value={String(totalCapacity)} isLoading={isLoading} />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(val) => {
            setQuery(val);
            setCurrentPage(1);
          }}
          onExport={() => {
            const ok = exportToCsv('veiculos-frota', filteredVehicles, [
              { key: 'id', label: 'ID' },
              { key: 'placa', label: 'Placa' },
              { key: 'modelo', label: 'Modelo' },
              { key: 'tipoVeiculoNome', label: 'Categoria' },
              { key: 'capacidadePassageiros', label: 'Capacidade' },
              { key: 'fornecedorNome', label: 'Fornecedor' },
              {
                key: 'ativo',
                label: 'Status',
                format: (val) => (val !== false ? 'Ativo' : 'Inativo'),
              },
            ]);
            if (ok) {
              showToast({ type: 'success', title: 'Relatório exportado', description: 'CSV de veículos baixado com sucesso.' });
            }
          }}
          rightActions={
            <Button onClick={() => navigate('/terceiros/veiculos/novo')}>
              Cadastrar veículo
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
          emptyMessage="Nenhum veículo cadastrado na frota."
          isLoading={isLoading}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>

      {selectedVehicleForStatus && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>
              {selectedVehicleForStatus.ativo !== false ? 'Desativar Veículo' : 'Reativar Veículo'}
            </h3>
            <p>
              Tem certeza que deseja {selectedVehicleForStatus.ativo !== false ? 'desativar' : 'reativar'} o veículo{' '}
              <strong>{selectedVehicleForStatus.modelo}</strong> (Placa: {selectedVehicleForStatus.placa})?
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setSelectedVehicleForStatus(null)} disabled={isUpdatingStatus}>
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
