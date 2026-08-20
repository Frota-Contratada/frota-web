import { useState, useMemo } from 'react';
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
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableAction<T> {
  icon: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const hasActions = actions && actions.length > 0;
  const totalCols = columns.length + (hasActions ? 1 : 0);
  const pages = pagination ? buildPages(pagination.currentPage, pagination.totalPages) : [];

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
          : String(aVal).localeCompare(String(bVal), 'pt-BR');

      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, onSortChange]);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === String(col.key);
              return (
                <th
                  key={String(col.key)}
                  className={`${styles.th} ${col.sortable ? styles.thSortable : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  aria-sort={isSorted ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.header}
                  {col.sortable && (
                    <SortIcon direction={isSorted ? sort!.direction : null} />
                  )}
                </th>
              );
            })}
            {hasActions && <th className={styles.th} style={{ width: `${actions.length * 44}px` }} />}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: loadingRows }, (_, rowIndex) => (
              <tr key={`skeleton-row-${rowIndex}`} className={styles.tr}>
                {columns.map((_, colIndex) => {
                  // Varied widths for realistic skeleton feel
                  const widths = ['80%', '60%', '90%', '45%', '70%'];
                  const width = widths[(rowIndex + colIndex) % widths.length];
                  return (
                    <td key={`skeleton-cell-${colIndex}`} className={styles.td}>
                      <Skeleton width={width} height={16} />
                    </td>
                  );
                })}
                {hasActions && (
                  <td className={`${styles.td} ${styles.actionsCell}`}>
                    <Skeleton variant="circular" width={28} height={28} />
                  </td>
                )}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr key={keyExtractor(row)} className={styles.tr}>
                {columns.map((col) => {
                  const value = (row as Record<string, unknown>)[col.key as string];
                  return (
                    <td key={String(col.key)} className={styles.td}>
                      {col.render ? col.render(value, row) : (value as React.ReactNode)}
                    </td>
                  );
                })}
                {hasActions && (
                  <td className={`${styles.td} ${styles.actionsCell}`}>
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        className={styles.actionButton}
                        title={action.label}
                        aria-label={action.label}
                        onClick={() => action.onClick(row)}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          {pages.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`${styles.pageButton} ${page === pagination.currentPage ? styles.pageActive : ''}`}
                onClick={() => pagination.onPageChange(page as number)}
                aria-label={`Página ${String(page).padStart(2, '0')}`}
                aria-current={page === pagination.currentPage ? 'page' : undefined}
              >
                {String(page).padStart(2, '0')}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
