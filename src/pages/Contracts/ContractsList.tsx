import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, StatCard, StatusBadge, Table, TableToolbar, useToast, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import { contracts, suppliers, type Contract } from './contractsData';
import styles from './Contracts.module.css';

const PAGE_SIZE = 5;

const contractFilters: FilterSection[] = [
  {
    title: 'Status',
    options: [
      { label: 'Aprovado', value: 'status:aprovado' },
      { label: 'Pendente', value: 'status:pendente' },
      { label: 'Em andamento', value: 'status:em_andamento' },
    ],
  },
  {
    title: 'Tipo',
    options: [
      { label: 'Transporte executivo', value: 'tipo:Transporte executivo' },
      { label: 'Frota dedicada', value: 'tipo:Frota dedicada' },
      { label: 'Gestão de frota', value: 'tipo:Gestão de frota' },
    ],
  },
];

const columns: ColumnDef<Contract>[] = [
  {
    key: 'codigo',
    header: 'Contrato',
    sortable: true,
    render: (_, row) => <strong className={styles.contractCode}>{row.codigo}</strong>,
  },
  { key: 'fornecedor', header: 'Fornecedor', sortable: true },
  { key: 'tipo', header: 'Tipo', sortable: true },
  { key: 'vencimento', header: 'Vencimento', sortable: true },
  { key: 'valorMensal', header: 'Valor mensal', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_, row) => <StatusBadge status={row.status} />,
  },
];

export const ContractsList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const statusFilters = selectedFilters
    .filter((filter) => filter.startsWith('status:'))
    .map((filter) => filter.replace('status:', ''));

  const typeFilters = selectedFilters
    .filter((filter) => filter.startsWith('tipo:'))
    .map((filter) => filter.replace('tipo:', ''));

  const filteredContracts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return contracts.filter((contract) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        contract.codigo.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.fornecedor.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.tipo.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(contract.status);
      const matchesType = typeFilters.length === 0 || typeFilters.includes(contract.tipo);

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [query, statusFilters, typeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const pageData = filteredContracts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<Contract>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar contrato',
      onClick: (row) => navigate(`/terceiros/contratos/${row.id}`),
    },
  ];

  const handleUploadSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSupplier || !selectedFileName) {
      showToast({ type: 'warning', title: 'Dados incompletos', description: 'Selecione um fornecedor e anexe um PDF.' });
      return;
    }

    setIsModalOpen(false);
    setSelectedSupplier('');
    setSelectedFileName('');
    showToast({ type: 'success', title: 'Contrato enviado', description: `${selectedFileName} foi vinculado a ${selectedSupplier}.` });
  };

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo de contratos">
        <StatCard title="Contratos ativos" value="12" trend={{ value: 8, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="Valor mensal" value="R$ 273.650" trend={{ value: 4.2, direction: 'up', label: 'vs. mês anterior' }} />
        <StatCard title="A vencer" value="3" trend={{ value: 2, direction: 'down', label: 'nos próximos 60 dias' }} />
        <StatCard title="Fornecedores" value="5" />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de contratos será preparada em instantes.' })}
          rightActions={<Button onClick={() => setIsModalOpen(true)}>Cadastrar</Button>}
          filterSections={contractFilters}
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
          keyExtractor={(contract) => contract.id}
          actions={actions}
          emptyMessage="Nenhum contrato encontrado."
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        />
      </section>

      {isModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setIsModalOpen(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="contract-upload-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="contract-upload-title">Inserir contrato</h2>
                <p>Envie o PDF e vincule o documento a um fornecedor.</p>
              </div>
              <button className={styles.closeButton} type="button" aria-label="Fechar modal" onClick={() => setIsModalOpen(false)}>
                <ErroIcon width={14} height={14} aria-hidden="true" />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleUploadSubmit}>
              <Select
                label="Fornecedor"
                placeholder="Selecione um fornecedor"
                value={selectedSupplier}
                options={suppliers.map((supplier) => ({ label: supplier, value: supplier }))}
                onChange={setSelectedSupplier}
                required
              />

              <label className={styles.uploadBox}>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
                  required
                />
                <span className={styles.uploadIcon} aria-hidden="true">
                  <CheckIcon width={22} height={22} />
                </span>
                <strong>{selectedFileName || 'Selecionar PDF do contrato'}</strong>
                <small>Arquivo em PDF, preferencialmente assinado e com anexos consolidados.</small>
              </label>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar contrato</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
