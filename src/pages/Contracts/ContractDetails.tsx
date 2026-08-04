import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import IaIcon from '../../assets/icons/ia.svg?react';
import { contracts } from './contractsData';
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

export const ContractDetails = () => {
  const { contractId } = useParams();
  const contract = contracts.find((item) => item.id === Number(contractId));
  const [currentPage, setCurrentPage] = useState(1);

  if (!contract) {
    return <Navigate to="/terceiros/contratos" replace />;
  }

  const previewPages = buildPreviewPages(currentPage, TOTAL_PREVIEW_PAGES);

  const extractedFields: ExtractedField[] = [
    { label: 'Contraparte', value: contract.fornecedor },
    { label: 'Requisitante', value: 'Jonas Paulo Teixeira' },
    { label: 'CNPJ/CPF', value: '35.211.434/0001-15' },
    { label: 'Data', value: '22/05/2025' },
    { label: 'Início da vigência', value: contract.inicio },
    { label: 'Fim da vigência', value: contract.vencimento },
    { label: 'Tipo de cobrança', value: 'KM rodado' },
    { label: 'Valor por KM', value: 'R$34,09' },
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
