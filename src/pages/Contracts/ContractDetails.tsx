import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import { Button, LoadingState, StatusBadge, useToast, type BadgeStatus } from '../../components/common';
import { contractApi, extractListData, type ContratoDto } from '../../services';
import styles from './Contracts.module.css';

type ExtractedField = {
  label: string;
  value: string;
};

const mapContractStatus = (status?: string): BadgeStatus => {
  const s = status?.toUpperCase();
  if (s === 'ATIVO' || s === 'APROVADO') return 'aprovado';
  if (s === 'VENCE_EM_BREVE' || s === 'PENDENTE') return 'pendente';
  if (s === 'VENCIDO' || s === 'CANCELADO') return 'cancelado';
  return 'em_andamento';
};

export const ContractDetails = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState<ContratoDto | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const numericId = Number(contractId);

    if (contractId && !isNaN(numericId)) {
      setIsLoading(true);

      Promise.allSettled([
        contractApi.list(),
        contractApi.getPdfBlob(numericId),
      ]).then(([listRes, blobRes]) => {
        if (!isMounted) return;

        if (listRes.status === 'fulfilled') {
          const apiContracts = extractListData<ContratoDto>(listRes.value);
          const found = apiContracts.find((c) => c.id === numericId);
          if (found) {
            setContract(found);
          }
        }

        if (blobRes.status === 'fulfilled' && blobRes.value) {
          const url = URL.createObjectURL(blobRes.value);
          setPdfBlobUrl(url);
        }
      }).catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erro ao consultar contrato no servidor.';
        showToast({ type: 'error', title: 'Erro ao carregar contrato', description: msg });
      }).finally(() => {
        if (isMounted) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      navigate('/terceiros/contratos', { replace: true });
    }

    return () => {
      isMounted = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [contractId, navigate]);

  if (isLoading) {
    return (
      <div className={styles.contractReaderPage}>
        <LoadingState
          variant="details"
          message="Carregando contrato digital"
          submessage="Buscando arquivo PDF e parâmetros de vigência no servidor..."
        />
      </div>
    );
  }

  const contractCode = contract ? `CTR-${String(contract.id).padStart(4, '0')}` : `CTR-${String(contractId).padStart(4, '0')}`;
  const fornecedorNome = contract?.vinculos?.[0]?.fornecedorNome || (contract?.vinculos && contract.vinculos.length > 0 ? contract.vinculos.map(v => v.fornecedorNome).join(', ') : 'Fornecedor Credenciado');
  const filialNome = contract?.vinculos?.[0]?.filialNome || (contract?.vinculos && contract.vinculos.length > 0 ? contract.vinculos.map(v => v.filialNome).join(', ') : 'Filial Seara');
  const dataInicio = contract?.dataVigenciaInicio ? new Date(contract.dataVigenciaInicio).toLocaleDateString('pt-BR') : '—';
  const dataFim = contract?.dataVigenciaFim ? new Date(contract.dataVigenciaFim).toLocaleDateString('pt-BR') : 'Indeterminado';
  const statusBadge = mapContractStatus(contract?.status);

  const extractedFields: ExtractedField[] = [
    { label: 'Código do Contrato', value: contractCode },
    { label: 'Fornecedor(es)', value: fornecedorNome },
    { label: 'Filial(is) Vinculada(s)', value: filialNome },
    { label: 'Início da Vigência', value: dataInicio },
    { label: 'Fim da Vigência', value: dataFim },
    { label: 'Status Operacional', value: contract?.status || 'ATIVO' },
  ];

  return (
    <div className={styles.contractReaderPage}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {contractCode} — {fornecedorNome}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Instrumento de prestação de serviços de transporte e mobilidade corporativa.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {pdfBlobUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(pdfBlobUrl, '_blank')}
            >
              Abrir PDF em nova aba
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/terceiros/contratos')}>
            Voltar para contratos
          </Button>
        </div>
      </div>

      <section className={styles.readerLayout}>
        <article className={styles.previewPane} aria-label="Preview do contrato">
          <div className={styles.previewPaneHeader}>
            <div>
              <span>Documento Digitalizado</span>
              <strong>{contractCode}.pdf</strong>
            </div>
            <span className={styles.fileBadge}>PDF</span>
          </div>

          <div className={styles.previewViewport} style={{ padding: 0, overflow: 'hidden', height: '620px' }}>
            {pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={`Contrato ${contractCode}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  Visualização do PDF não disponível ou arquivo não renderizável diretamente no navegador.
                </p>
              </div>
            )}
          </div>
        </article>

        <aside className={styles.extractedSidePanel} aria-label="Dados do contrato">
          <div className={styles.sideMetaList}>
            <div>
              <span>Status</span>
              <strong><StatusBadge status={statusBadge} /></strong>
            </div>
            <div>
              <span>Arquivo</span>
              <strong>{contractCode}.pdf</strong>
            </div>
          </div>

          <div className={styles.extractedPanelHeader}>
            <div className={styles.extractedPanelTitle}>
              <strong>Parâmetros Contratuais</strong>
            </div>
            <p>Informações registradas no sistema para este instrumento.</p>
          </div>

          <div className={styles.extractedReviewList}>
            {extractedFields.map((field) => (
              <div key={field.label} className={styles.extractedReviewItem}>
                <div>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                </div>
                <CheckIcon width={16} height={16} aria-hidden="true" />
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

