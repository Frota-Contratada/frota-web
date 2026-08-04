import { type ReactNode } from 'react';
import { Button, FilterDropdown, Input, type DateRangeFilterValue, type FilterSection } from '../index';
import SearchIcon from '../../../assets/icons/search.svg?react';
import ExportarIcon from '../../../assets/icons/exportar.svg?react';
import FiltrarIcon from '../../../assets/icons/filtrar.svg?react';
import styles from './TableToolbar.module.css';

interface TableToolbarProps {
  onSearch?: (query: string) => void;
  onExport?: () => void;
  onFilter?: () => void;
  filterSections?: FilterSection[];
  selectedFilters?: string[];
  onFilterChange?: (values: string[]) => void;
  dateRange?: DateRangeFilterValue;
  onDateRangeChange?: (value: DateRangeFilterValue) => void;
  onFilterApply?: () => void;
  onFilterClear?: () => void;
  rightActions?: ReactNode;
}

const renderFilterButton = (activeCount: number): ReactNode => (
  <Button variant="ghost" rightIcon={<FiltrarIcon width={18} height={18} />} className={styles.filterButton}>
    Filtrar
    {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
  </Button>
);

export function TableToolbar({
  onSearch,
  onExport,
  onFilter,
  filterSections,
  selectedFilters = [],
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onFilterApply,
  onFilterClear,
  rightActions,
}: TableToolbarProps) {
  const activeFilterCount = selectedFilters.length + (dateRange?.from ? 1 : 0) + (dateRange?.to ? 1 : 0);
  const hasDropdownFilter = Boolean((filterSections?.length || dateRange) && onFilterChange);

  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Input
          placeholder="Buscar"
          leftIcon={<SearchIcon width={18} height={18} />}
          onChange={(e) => onSearch?.(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        {rightActions}
        {onExport && (
          <Button variant="primary" rightIcon={<ExportarIcon width={18} height={18} />} onClick={onExport}>
            Exportar
          </Button>
        )}
        {hasDropdownFilter && filterSections ? (
          <FilterDropdown
            sections={filterSections}
            selectedValues={selectedFilters}
            onChange={onFilterChange!}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            onApply={onFilterApply}
            onClear={onFilterClear}
            trigger={renderFilterButton(activeFilterCount)}
          />
        ) : (
          onFilter && (
            <Button variant="ghost" rightIcon={<FiltrarIcon width={18} height={18} />} onClick={onFilter} className={styles.filterButton}>
              Filtrar
            </Button>
          )
        )}
      </div>
    </div>
  );
}
