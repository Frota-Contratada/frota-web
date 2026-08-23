import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import IaIcon from '../../assets/icons/ia.svg?react';
import { LoadingState, useToast, type BadgeStatus } from '../../components/common';
import { contractApi, type ContratoDto } from '../../services';
import { type Contract } from './contractsData';
import styles from './Contracts.module.css';

type ExtractedField = {
  label: string;
  value: string;
};

const TOTAL_PREVIEW_PAGES = 17;

const buildPreviewPages = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];

  return [1, '...', current - 1, current, current + 1, '...', total];
};

const mapContractStatus = (status?: string): BadgeStatus => {
  const s = status?.toLowerCase();
  if (s === 'ativo' || s === 'aprovado') return 'aprovado';
  if (s === 'pendente') return 'pendente';
  if (s === 'cancelado' || s === 'inativo') return 'cancelado';
  return 'em_andamento';
};

export const ContractDetails = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (contractId && !isNaN(Number(contractId))) {
      contractApi
        .getById(Number(contractId))
        .then((res) => {
          if (!isMounted) return;
          if (res.response) {
            const c: ContratoDto = res.response;
            setContract({
              id: c.id,
              codigo: `CTR-${String(c.id).padStart(4, '0')}`,
              fornecedor: c.fornecedorNome || `Fornecedor #${c.fornecedorId}`,
              tipo: c.tipoContrato || 'Transporte executivo',
              inicio: c.dataInicioVigencia ? new Date(c.dataInicioVigencia).toLocaleDateString('pt-BR') : '01/01/2026',
              vencimento: c.dataFimVigencia ? new Date(c.dataFimVigencia).toLocaleDateString('pt-BR') : 'Indeterminado',
              valorMensal: c.valorMensal ? `R$ ${Number(c.valorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
              responsavel: 'Gestor de Contratos',
              status: mapContractStatus(c.status),
              arquivo: c.nomeArquivo || (c.arquivoUrl ? c.arquivoUrl.split('/').pop() || 'contrato.pdf' : 'contrato.pdf'),
              escopo: c.descricao || 'Prestação de serviços de transporte e mobilidade.',
              sla: '95% de atendimento no prazo combinado.',
              reajuste: 'IPCA anual.',
            });
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          const msg = err instanceof Error ? err.message : 'Contrato não encontrado no servidor.';
          showToast({ type: 'error', title: 'Erro ao carregar contrato', description: msg });
          navigate('/terceiros/contratos', { replace: true });
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      navigate('/terceiros/contratos', { replace: true });
    }

    return () => {
      isMounted = false;
    };
  }, [contractId, navigate, showToast]);

  if (isLoading) {
    return (
      <div className={styles.contractReaderPage}>
        <LoadingState
          variant="card"
          message="Carregando contrato"
          submessage="Buscando arquivo e parâmetros..."
        />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const previewPages = buildPreviewPages(currentPage, TOTAL_PREVIEW_PAGES);

  const extractedFields: ExtractedField[] = [
    { label: 'Código do Contrato', value: contract.codigo },
    { label: 'Contraparte / Fornecedor', value: contract.fornecedor },
    { label: 'Tipo de Contrato', value: contract.tipo },
    { label: 'Início da vigência', value: contract.inicio },
    { label: 'Fim da vigência', value: contract.vencimento },
    { label: 'Valor Mensal Contratado', value: contract.valorMensal },
    { label: 'Status do Contrato', value: contract.status },
  ];

  return (
    <div className={styles.contractReaderPage}>
      <section className={styles.readerLayout}>
        <article className={styles.previewPane} aria-label="Preview do contrato">
          <div className={styles.previewPaneHeader}>
            <div>
              <span>Preview do contrato</span>
              <strong>{contract.arquivo}</strong>
            </div>
            <span className={styles.fileBadge}>PDF</span>
          </div>

          <div className={styles.previewViewport}>
            <div className={styles.previewPage}>
              <div className={styles.previewWatermark}>PDF</div>
              <div className={styles.previewDocumentTop} />
              <div className={styles.previewTitle}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
              <div className={styles.previewLineLarge} />
              <div className={styles.previewLine} />
              <div className={styles.previewLineShort} />
              <div className={styles.previewBlockGrid}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.previewParagraph}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.previewSignatureRow}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <nav className={styles.previewPagination} aria-label="Paginação do contrato">
            {previewPages.map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className={styles.previewEllipsis}>...</span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`${styles.previewPageButton} ${page === currentPage ? styles.previewPageActive : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Página ${String(page).padStart(2, '0')}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {String(page).padStart(2, '0')}
                </button>
              )
            )}
          </nav>
        </article>

        <aside className={styles.extractedSidePanel} aria-label="Dados extraídos do contrato">
          <div className={styles.sideMetaList}>
            <div>
              <span>Status de leitura</span>
              <strong className={styles.successStatus}>Lido com sucesso</strong>
            </div>
            <div>
              <span>Arquivo</span>
              <strong>{contract.arquivo}</strong>
            </div>
            <div>
              <span>Responsável</span>
              <strong>{contract.responsavel}</strong>
            </div>
          </div>

          <div className={styles.extractedPanelHeader}>
            <div className={styles.extractedPanelTitle}>
              <IaIcon width={22} height={22} aria-hidden="true" />
              <strong>Parâmetros extraídos</strong>
            </div>
            <p>8 campos identificados automaticamente no contrato.</p>
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
