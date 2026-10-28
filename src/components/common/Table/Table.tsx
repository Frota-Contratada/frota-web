import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import SetaSmIcon from '../../../assets/icons/seta-sm.svg?react';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableAction<T> {
  icon: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalRecords?: number;
}

interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  actions?: TableAction<T>[];
  pagination?: PaginationProps;
  onSortChange?: (sort: SortState | null) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
  stickyActions?: boolean;
  stickyFirstColumn?: boolean;
  allowViewToggle?: boolean;
  initialViewMode?: 'table' | 'cards';
}

function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <span
      className={`${styles.sortIcon} ${direction === 'asc' ? styles.sortAsc : ''} ${
        direction === 'desc' ? styles.sortDesc : ''
      }`}
      aria-hidden="true"
    >
      <SetaSmIcon width={12} height={12} />
    </span>
  );
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  actions,
  pagination,
  onSortChange,
  emptyMessage = 'Nenhum registro encontrado.',
  isLoading = false,
  loadingRows = 5,
  stickyActions = true,
  stickyFirstColumn = false,
  allowViewToggle = true,
  initialViewMode = 'table',
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(initialViewMode);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hasActions = actions && actions.length > 0;
  const totalCols = columns.length + (hasActions ? 1 : 0);
  const pages = pagination ? buildPages(pagination.currentPage, pagination.totalPages) : [];

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || viewMode !== 'table') return;

    checkScroll();

    const handleScroll = () => {
      checkScroll();
      setHasScrolled(true);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, data, columns, viewMode]);

  const handleSort = (key: string) => {
    const next: SortState =
      sort?.key === key && sort.direction === 'asc'
        ? { key, direction: 'desc' }
        : { key, direction: 'asc' };

    setSort(next);
    onSortChange?.(next);
  };

  const sortedData = useMemo(() => {
    if (!sort || onSortChange) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.key];
      const bVal = (b as Record<string, unknown>)[sort.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true });

      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, onSortChange]);

  const displayData = useMemo(() => {
    if (!pagination) return sortedData;
    const size = pagination.pageSize ?? 5;
    if (sortedData.length <= size) return sortedData;
    const start = (pagination.currentPage - 1) * size;
    return sortedData.slice(start, start + size);
  }, [sortedData, pagination]);

  const firstColumnKey = columns[0] ? String(columns[0].key) : '';

  return (
    <div className={styles.wrapper}>
      {/* Barra superior de UX: indicador de rolagem e alternador Tabela / Cards */}
      {allowViewToggle && data.length > 0 && !isLoading && (
        <div className={styles.tableHeaderBar}>
          <div className={styles.tableHeaderInfo}>
            <span className={styles.recordsBadge}>
              {data.length} {data.length === 1 ? 'registro' : 'registros'}
            </span>
            {viewMode === 'table' && canScrollRight && !hasScrolled && (
              <span className={styles.scrollHint}>↔ Role horizontalmente para ver mais colunas</span>
            )}
          </div>

          <div className={styles.viewModeToggle} role="group" aria-label="Modo de visualização da tabela">
            <button
              type="button"
              className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.viewModeActive : ''}`}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              title="Visualização tabular com colunas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              <span>Tabela</span>
            </button>
            <button
              type="button"
              className={`${styles.viewModeButton} ${viewMode === 'cards' ? styles.viewModeActive : ''}`}
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              title="Visualização em cartões (ideal para dispositivos móveis)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="6" rx="1.5" />
                <rect x="4" y="14" width="16" height="6" rx="1.5" />
              </svg>
              <span>Cartões</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualização em Cartões (Card View) */}
      {viewMode === 'cards' && !isLoading && displayData.length > 0 ? (
        <div className={styles.cardsContainer} role="region" aria-label="Lista em formato de cartões">
          {displayData.map((row) => {
            const rowKey = keyExtractor(row);
            const firstCol = columns[0];
            const firstColVal = firstCol ? (row as Record<string, unknown>)[firstCol.key as string] : null;
            const otherCols = columns.slice(1);

            return (
              <article key={rowKey} className={styles.cardItem}>
                {firstCol && (
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardPrimaryInfo}>
                      <span className={styles.cardPrimaryLabel}>{firstCol.header}</span>
                      <div className={styles.cardPrimaryValue}>
                        {firstCol.render ? firstCol.render(firstColVal, row) : (firstColVal as React.ReactNode)}
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.cardFieldsGrid}>
                  {otherCols.map((col) => {
                    const value = (row as Record<string, unknown>)[col.key as string];
                    return (
                      <div key={String(col.key)} className={styles.cardField}>
                        <span className={styles.cardFieldLabel}>{col.header}</span>
                        <div className={styles.cardFieldValue}>
                          {col.render ? col.render(value, row) : (value as React.ReactNode)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasActions && (
                  <div className={styles.cardActionsRow}>
                    {actions
                      .filter((action) => !action.hidden || !action.hidden(row))
                      .map((action) => {
                        const isDisabled = action.disabled ? action.disabled(row) : false;
                        return (
                          <button
                            key={action.label}
                            type="button"
                            className={styles.cardActionButton}
                            title={action.label}
                            aria-label={`${action.label} (registro #${rowKey})`}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && action.onClick(row)}
                          >
                            {action.icon}
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        /* Visualização em Tabela Tabular com Sticky Columns e Scroll Shadows */
        <div
          ref={scrollContainerRef}
          className={`${styles.scrollContainer} ${canScrollLeft ? styles.canScrollLeft : ''} ${
            canScrollRight ? styles.canScrollRight : ''
          }`}
          tabIndex={0}
          role="region"
          aria-label="Tabela de dados"
        >
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col, index) => {
                  const isSorted = sort?.key === String(col.key);
                  const isFirstCol = stickyFirstColumn && index === 0;

                  return (
                    <th
                      key={String(col.key)}
                      className={`${styles.th} ${col.sortable ? styles.thSortable : ''} ${
                        isFirstCol ? styles.stickyFirstColTh : ''
                      }`}
                      style={{
                        ...(col.width ? { width: col.width } : {}),
                        ...(col.align ? { textAlign: col.align } : {}),
                      }}
                      onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                      aria-sort={isSorted ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {col.header}
                      {col.sortable && <SortIcon direction={isSorted ? sort!.direction : null} />}
                    </th>
                  );
                })}
                {hasActions && (
                  <th
                    className={`${styles.th} ${stickyActions ? styles.stickyActionsTh : ''}`}
                    style={{ width: `${actions.length * 48}px` }}
                    aria-label="Ações"
                  />
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: loadingRows }, (_, rowIndex) => (
                  <tr key={`skeleton-row-${rowIndex}`} className={styles.tr}>
                    {columns.map((col, colIndex) => {
                      const widths = ['80%', '60%', '90%', '45%', '70%'];
                      const width = widths[(rowIndex + colIndex) % widths.length];
                      const isFirstCol = stickyFirstColumn && colIndex === 0;
                      return (
                        <td
                          key={`skeleton-cell-${colIndex}`}
                          className={`${styles.td} ${isFirstCol ? styles.stickyFirstColTd : ''}`}
                          style={col.align ? { textAlign: col.align } : undefined}
                        >
                          <Skeleton width={width} height={16} />
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td
                        className={`${styles.td} ${styles.actionsCell} ${
                          stickyActions ? styles.stickyActionsTd : ''
                        }`}
                      >
                        <Skeleton variant="circular" width={28} height={28} />
                      </td>
                    )}
                  </tr>
                ))
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className={styles.empty}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayData.map((row) => (
                  <tr key={keyExtractor(row)} className={styles.tr}>
                    {columns.map((col) => {
                      const value = (row as Record<string, unknown>)[col.key as string];
                      const isFirstCol = stickyFirstColumn && String(col.key) === firstColumnKey;
                      return (
                        <td
                          key={String(col.key)}
                          className={`${styles.td} ${isFirstCol ? styles.stickyFirstColTd : ''}`}
                          style={col.align ? { textAlign: col.align } : undefined}
                        >
                          {col.render ? col.render(value, row) : (value as React.ReactNode)}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td
                        className={`${styles.td} ${styles.actionsCell} ${
                          stickyActions ? styles.stickyActionsTd : ''
                        }`}
                      >
                        {actions
                          .filter((action) => !action.hidden || !action.hidden(row))
                          .map((action) => {
                            const isDisabled = action.disabled ? action.disabled(row) : false;
                            const rowKey = keyExtractor(row);
                            return (
                              <button
                                key={action.label}
                                className={styles.actionButton}
                                title={action.label}
                                aria-label={`${action.label} (registro #${rowKey})`}
                                disabled={isDisabled}
                                onClick={() => !isDisabled && action.onClick(row)}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação Inteligente com suporte a dispositivos móveis */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Página {pagination.currentPage} de {pagination.totalPages}
            {pagination.totalRecords ? ` (${pagination.totalRecords} itens)` : ''}
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={`${styles.navArrowButton} ${styles.navArrowLeft}`}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              aria-label="Página anterior"
              title="Página anterior"
            >
              <SetaSmIcon width={12} height={12} />
            </button>

            {pages.map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`${styles.pageButton} ${page === pagination.currentPage ? styles.pageActive : ''}`}
                  onClick={() => pagination.onPageChange(page as number)}
                  aria-label={`Página ${String(page).padStart(2, '0')}`}
                  aria-current={page === pagination.currentPage ? 'page' : undefined}
                >
                  {String(page).padStart(2, '0')}
                </button>
              )
            )}

            <button
              type="button"
              className={`${styles.navArrowButton} ${styles.navArrowRight}`}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              aria-label="Próxima página"
              title="Próxima página"
            >
              <SetaSmIcon width={12} height={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
