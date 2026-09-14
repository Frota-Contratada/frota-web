import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, StatCard, StatusBadge, Table, TableToolbar, useToast, type BadgeStatus, type ColumnDef, type FilterSection, type TableAction } from '../../../components/common';
import RedirecionarIcon from '../../../assets/icons/redirecionar.svg?react';
import CheckIcon from '../../../assets/icons/check.svg?react';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import { contractApi, contractIaApi, extractListData, type ContratoDto, type ContratoBigNumbers } from '../../../services';
import styles from './ContractsList.module.css';

export type Contract = {
  id: number;
  codigo: string;
  fornecedor: string;
  filial: string;
  inicio: string;
  vencimento: string;
  status: BadgeStatus;
  arquivo: string;
};

const PAGE_SIZE = 5;

const columns: ColumnDef<Contract>[] = [
  {
    key: 'codigo',
    header: 'Contrato',
    sortable: true,
    render: (_, row) => <strong className={styles.contractCode}>{row.codigo}</strong>,
  },
  { key: 'fornecedor', header: 'Fornecedor', sortable: true },
  { key: 'filial', header: 'Filial', sortable: true },
  { key: 'inicio', header: 'Início Vigência', sortable: true },
  { key: 'vencimento', header: 'Fim Vigência', sortable: true },
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataInicioVigencia, setDataInicioVigencia] = useState(new Date().toISOString().slice(0, 10));
  const [dataFimVigencia, setDataFimVigencia] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingIa, setIsExtractingIa] = useState(false);

  const handleExtrairComIa = async () => {
    if (!selectedFile) return;
    try {
      setIsExtractingIa(true);
      const resultado = await contractIaApi.extrairDados(selectedFile);
      if (resultado.datasNormalizadas?.dataVigenciaInicio) {
        setDataInicioVigencia(resultado.datasNormalizadas.dataVigenciaInicio);
      }
      if (resultado.datasNormalizadas?.dataVigenciaFim) {
        setDataFimVigencia(resultado.datasNormalizadas.dataVigenciaFim);
      }
      const confianca = Math.round((resultado.extracao?.confianca_geral ?? 0) * 100);
      showToast({
        type: 'success',
        title: 'Datas extraídas com IA',
        description: `Vigência preenchida com ${confianca}% de confiança.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha na extração com IA';
      showToast({ type: 'error', title: 'Erro ao analisar contrato', description: msg });
    } finally {
      setIsExtractingIa(false);
    }
  };

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const [contractsRes, bigNumbersRes] = await Promise.allSettled([
        contractApi.list(),
        contractApi.getAdminBigNumbers().catch(() => contractApi.getFilialBigNumbers()),
      ]);

      if (contractsRes.status === 'fulfilled') {
        const apiContracts = extractListData<ContratoDto>(contractsRes.value);
        const mapped: Contract[] = apiContracts.map((c: ContratoDto) => {
          const rawStatus = (c.status || '').toUpperCase();
          let badgeStatus: BadgeStatus = 'em_andamento';
          if (rawStatus === 'ATIVO' || rawStatus === 'APROVADO') badgeStatus = 'aprovado';
          else if (rawStatus === 'VENCE_EM_BREVE' || rawStatus === 'PENDENTE') badgeStatus = 'pendente';
          else if (rawStatus === 'VENCIDO' || rawStatus === 'CANCELADO') badgeStatus = 'cancelado';

          const fornecedorNome = c.vinculos?.[0]?.fornecedorNome || (c.vinculos && c.vinculos.length > 0 ? c.vinculos.map(v => v.fornecedorNome).join(', ') : '—');
          const filialNome = c.vinculos?.[0]?.filialNome || (c.vinculos && c.vinculos.length > 0 ? c.vinculos.map(v => v.filialNome).join(', ') : '—');
          
          return {
            id: c.id,
            codigo: `CONT-${String(c.id).padStart(4, '0')}`,
            fornecedor: fornecedorNome,
            filial: filialNome,
            inicio: c.dataVigenciaInicio ? new Date(c.dataVigenciaInicio).toLocaleDateString('pt-BR') : '—',
            vencimento: c.dataVigenciaFim ? new Date(c.dataVigenciaFim).toLocaleDateString('pt-BR') : 'Indeterminado',
            status: badgeStatus,
            arquivo: c.caminhoArquivo ? c.caminhoArquivo.split('/').pop() || 'contrato.pdf' : 'contrato.pdf',
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar dados de contratos';
      showToast({ type: 'error', title: 'Erro ao carregar contratos', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filterSections = useMemo<FilterSection[]>(() => {
    const statuses = Array.from(new Set(contractsList.map((c) => c.status))).filter(Boolean);
    const fornecedores = Array.from(new Set(contractsList.map((c) => c.fornecedor).filter((f) => f && f !== '—'))).sort();
    const filiais = Array.from(new Set(contractsList.map((c) => c.filial).filter((f) => f && f !== '—'))).sort();

    const sections: FilterSection[] = [];

    if (statuses.length > 0) {
      const statusLabels: Record<BadgeStatus, string> = {
        aprovado: 'Ativo',
        pendente: 'A vencer em breve',
        cancelado: 'Vencido / Cancelado',
        em_andamento: 'Em andamento',
        rejeitado: 'Rejeitado',
      };
      sections.push({
        id: 'status',
        title: 'Status',
        options: statuses.map((status) => ({
          label: statusLabels[status] || status,
          value: `status:${status}`,
        })),
      });
    }

    if (fornecedores.length > 0) {
      sections.push({
        id: 'fornecedor',
        title: 'Fornecedor',
        options: fornecedores.map((forn) => ({
          label: forn,
          value: `fornecedor:${forn}`,
        })),
      });
    }

    if (filiais.length > 0) {
      sections.push({
        id: 'filial',
        title: 'Filial',
        options: filiais.map((fil) => ({
          label: fil,
          value: `filial:${fil}`,
        })),
      });
    }

    return sections;
  }, [contractsList]);

  const filteredContracts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    const statusFilters = selectedFilters
      .filter((filter) => filter.startsWith('status:'))
      .map((filter) => filter.replace('status:', ''));
    const fornecedorFilters = selectedFilters
      .filter((filter) => filter.startsWith('fornecedor:'))
      .map((filter) => filter.replace('fornecedor:', ''));
    const filialFilters = selectedFilters
      .filter((filter) => filter.startsWith('filial:'))
      .map((filter) => filter.replace('filial:', ''));

    return contractsList.filter((contract) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        contract.codigo.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.fornecedor.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        contract.filial.toLocaleLowerCase('pt-BR').includes(normalizedQuery);

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(contract.status);
      const matchesFornecedor = fornecedorFilters.length === 0 || fornecedorFilters.includes(contract.fornecedor);
      const matchesFilial = filialFilters.length === 0 || filialFilters.includes(contract.filial);

      return matchesQuery && matchesStatus && matchesFornecedor && matchesFilial;
    });
  }, [query, selectedFilters, contractsList]);

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

    if (!selectedFile) {
      showToast({ type: 'warning', title: 'Arquivo obrigatório', description: 'Por favor, anexe o arquivo PDF do contrato.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await contractApi.create({
        arquivo: selectedFile,
        dataVigenciaInicio: dataInicioVigencia,
        dataFimVigencia: dataFimVigencia ? dataFimVigencia : undefined,
      });
      setIsModalOpen(false);
      setSelectedFile(null);
      setDataFimVigencia('');
      showToast({ type: 'success', title: 'Contrato enviado com sucesso', description: `${selectedFile.name} foi cadastrado.` });
      fetchContracts();
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
          title="Total de contratos"
          value={String(bigNumbers?.total ?? contractsList.length)}
          isLoading={isLoading}
        />
        <StatCard
          title="Contratos ativos"
          value={String(bigNumbers?.validos ?? contractsList.filter(c => c.status === 'aprovado').length)}
          isLoading={isLoading}
        />
        <StatCard
          title="A vencer em breve"
          value={String(bigNumbers?.vencemEmBreve ?? '0')}
          isLoading={isLoading}
        />
        <StatCard
          title="Contratos vencidos"
          value={String(bigNumbers?.vencidos ?? '0')}
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
                <p>Envie o arquivo PDF e informe o período de vigência.</p>
              </div>
              <button className={styles.closeButton} type="button" aria-label="Fechar modal" onClick={() => setIsModalOpen(false)}>
                <ErroIcon width={14} height={14} aria-hidden="true" />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleUploadSubmit}>
              <Input
                label="Início da vigência *"
                type="date"
                value={dataInicioVigencia}
                onChange={(e) => setDataInicioVigencia(e.target.value)}
                required
              />

              <Input
                label="Fim da vigência (opcional)"
                type="date"
                value={dataFimVigencia}
                onChange={(e) => setDataFimVigencia(e.target.value)}
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
                <small>Arquivo em PDF, assinado e com anexos consolidados.</small>
              </label>

              {selectedFile && (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExtrairComIa}
                    isLoading={isExtractingIa}
                    disabled={isSubmitting}
                  >
                    ✨ Preencher vigência com IA (frota-ia)
                  </Button>
                </div>
              )}

              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" isLoading={isSubmitting} disabled={isExtractingIa}>Salvar contrato</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
