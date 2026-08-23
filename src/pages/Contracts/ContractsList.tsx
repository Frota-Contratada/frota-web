import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, StatCard, StatusBadge, Table, TableToolbar, useToast, type BadgeStatus, type ColumnDef, type FilterSection, type TableAction } from '../../components/common';
import RedirecionarIcon from '../../assets/icons/redirecionar.svg?react';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import { suppliers as defaultSuppliers, type Contract } from './contractsData';
import { contractApi, supplierApi, extractListData, type ContratoDto, type ContratoBigNumbers } from '../../services';
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
  const [contractsList, setContractsList] = useState<Contract[]>([]);
  const [bigNumbers, setBigNumbers] = useState<ContratoBigNumbers | null>(null);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: number; nome: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [contractsRes, bigNumbersRes, suppliersRes] = await Promise.allSettled([
          contractApi.list(),
          contractApi.getAdminBigNumbers().catch(() => contractApi.getFilialBigNumbers()),
          supplierApi.list(),
        ]);

        if (!isMounted) return;

        if (contractsRes.status === 'fulfilled') {
          const apiContracts = extractListData<ContratoDto>(contractsRes.value);
          const mapped: Contract[] = apiContracts.map((c: ContratoDto) => {
            const rawStatus = (c.status || '').toLowerCase();
            let badgeStatus: BadgeStatus = 'em_andamento';
            if (rawStatus === 'ativo' || rawStatus === 'aprovado') badgeStatus = 'aprovado';
            else if (rawStatus === 'pendente' || rawStatus.includes('breve')) badgeStatus = 'pendente';
            else if (rawStatus === 'cancelado' || rawStatus === 'vencido') badgeStatus = 'cancelado';

            const fornecedorNome = c.vinculos?.[0]?.fornecedorNome || c.fornecedorNome || (c.fornecedorId ? `Fornecedor #${c.fornecedorId}` : '—');
            const dataInicio = c.dataVigenciaInicio || c.dataInicioVigencia;
            const dataFim = c.dataVigenciaFim || c.dataFimVigencia;

            return {
              id: c.id,
              codigo: `CTR-${String(c.id).padStart(4, '0')}`,
              fornecedor: fornecedorNome,
              tipo: c.tipoContrato || 'Transporte executivo',
              inicio: dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : '—',
              vencimento: dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Indeterminado',
              valorMensal: c.valorMensal ? `R$ ${Number(c.valorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
              responsavel: 'Gestor de Contratos',
              status: badgeStatus,
              arquivo: c.nomeArquivo || (c.arquivoUrl ? c.arquivoUrl.split('/').pop() || 'contrato.pdf' : (c as any).caminhoArquivo ? (c as any).caminhoArquivo.split('/').pop() : 'contrato.pdf'),
              escopo: c.descricao || 'Prestação de serviços de transporte e mobilidade.',
              sla: '95% de atendimento no prazo.',
              reajuste: 'IPCA anual.',
            };
          });
          setContractsList(mapped);
        }

        if (bigNumbersRes.status === 'fulfilled' && bigNumbersRes.value.response) {
          setBigNumbers(bigNumbersRes.value.response);
        }

        if (contractsRes.status === 'rejected') {
          const msg = contractsRes.reason instanceof Error ? contractsRes.reason.message : 'Falha ao buscar contratos';
          showToast({ type: 'error', title: 'Erro ao carregar contratos', description: msg });
        }

        if (suppliersRes.status === 'fulfilled') {
          const apiSuppliers = extractListData<{ id: number; nome: string }>(suppliersRes.value);
          if (apiSuppliers.length > 0) {
            setSuppliersList(apiSuppliers);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao processar dados de contratos';
        showToast({ type: 'error', title: 'Erro ao carregar contratos', description: msg });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusFilters = selectedFilters
    .filter((filter) => filter.startsWith('status:'))
    .map((filter) => filter.replace('status:', ''));

  const typeFilters = selectedFilters
    .filter((filter) => filter.startsWith('tipo:'))
    .map((filter) => filter.replace('tipo:', ''));

  const filteredContracts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return contractsList.filter((contract) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        contract.codigo.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.fornecedor.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.tipo.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(contract.status);
      const matchesType = typeFilters.length === 0 || typeFilters.includes(contract.tipo);

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [query, statusFilters, typeFilters, contractsList]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));
  const pageData = filteredContracts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const actions: TableAction<Contract>[] = [
    {
      icon: <RedirecionarIcon width={18} height={18} />,
      label: 'Visualizar contrato',
      onClick: (row) => navigate(`/terceiros/contratos/${row.id}`),
    },
  ];

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSupplierId || !selectedFile) {
      showToast({ type: 'warning', title: 'Dados incompletos', description: 'Selecione um fornecedor e anexe um arquivo PDF.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await contractApi.create({
        arquivo: selectedFile,
        fornecedorId: Number(selectedSupplierId),
        tipoContrato: 'Transporte executivo',
        valorMensal: 10000,
        dataInicioVigencia: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setSelectedSupplierId('');
      setSelectedFile(null);
      showToast({ type: 'success', title: 'Contrato enviado com sucesso', description: `${selectedFile.name} foi salvo.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar contrato';
      showToast({ type: 'error', title: 'Erro ao enviar contrato', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.statsGrid} aria-label="Resumo de contratos">
        <StatCard
          title="Contratos ativos"
          value={String(bigNumbers?.validos ?? bigNumbers?.totalAtivos ?? contractsList.length)}
          trend={{ value: 8, direction: 'up', label: 'vs. mês anterior' }}
          isLoading={isLoading}
        />
        <StatCard
          title="Valor mensal"
          value={bigNumbers?.valorTotalMensal !== undefined ? `R$ ${Number(bigNumbers.valorTotalMensal).toLocaleString('pt-BR')}` : 'R$ 273.650'}
          trend={{ value: 4.2, direction: 'up', label: 'vs. mês anterior' }}
          isLoading={isLoading}
        />
        <StatCard
          title="A vencer"
          value={String(bigNumbers?.vencemEmBreve ?? bigNumbers?.totalVencendoEmBreve ?? '0')}
          trend={{ value: 2, direction: 'down', label: 'nos próximos 60 dias' }}
          isLoading={isLoading}
        />
        <StatCard
          title="Fornecedores"
          value={String(suppliersList.length || '0')}
          isLoading={isLoading}
        />
      </section>

      <section className={styles.tableSection}>
        <TableToolbar
          onSearch={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onExport={() => showToast({ type: 'success', title: 'Exportação iniciada', description: 'A lista de contratos será preparada em instantes.' })}
          rightActions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>Anexar PDF</Button>
              <Button onClick={() => navigate('/terceiros/contratos/novo')}>Novo contrato</Button>
            </div>
          }
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
          isLoading={isLoading}
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
                value={selectedSupplierId}
                options={
                  suppliersList.length > 0
                    ? suppliersList.map((s) => ({ label: s.nome, value: String(s.id) }))
                    : defaultSuppliers.map((s, idx) => ({ label: s, value: String(idx + 1) }))
                }
                onChange={setSelectedSupplierId}
                required
              />

              <label className={styles.uploadBox}>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  required
                />
                <span className={styles.uploadIcon} aria-hidden="true">
                  <CheckIcon width={22} height={22} />
                </span>
                <strong>{selectedFile?.name || 'Selecionar PDF do contrato'}</strong>
                <small>Arquivo em PDF, preferencialmente assinado e com anexos consolidados.</small>
              </label>

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" isLoading={isSubmitting}>Salvar contrato</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
