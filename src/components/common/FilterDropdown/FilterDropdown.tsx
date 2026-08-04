import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import SetaDireitaIcon from '../../../assets/icons/seta-direita.svg?react';
import SetaSmIcon from '../../../assets/icons/seta-sm.svg?react';
import styles from './FilterDropdown.module.css';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSection {
  title: string;
  options: FilterOption[];
}

export interface DateRangeFilterValue {
  from: string;
  to: string;
}

interface FilterDropdownProps {
  sections: FilterSection[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  dateRange?: DateRangeFilterValue;
  onDateRangeChange?: (value: DateRangeFilterValue) => void;
  onApply?: () => void;
  onClear?: () => void;
  trigger: ReactNode;
  align?: 'left' | 'right';
}

type ActivePanel = 'period' | string;

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isSameDay = (a: Date, b: Date) => toIsoDate(a) === toIsoDate(b);

const isBetween = (date: Date, from: Date | null, to: Date | null) => {
  if (!from || !to) return false;
  return date > from && date < to;
};

const formatDisplayDate = (value: string) => {
  if (!value) return '--/--/----';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

const buildCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

export function FilterDropdown({
  sections,
  selectedValues,
  onChange,
  dateRange,
  onDateRangeChange,
  onApply,
  onClear,
  trigger,
  align = 'right',
}: FilterDropdownProps) {
  const initialMonth = dateRange?.from ? fromIsoDate(dateRange.from) : new Date();
  const hasDateFilter = Boolean(dateRange && onDateRangeChange);
  const initialPanel: ActivePanel = hasDateFilter ? 'period' : sections[0]?.title ?? 'period';

  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialPanel);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeCount = selectedValues.length + (dateRange?.from || dateRange?.to ? 1 : 0);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedFrom = dateRange?.from ? fromIsoDate(dateRange.from) : null;
  const selectedTo = dateRange?.to ? fromIsoDate(dateRange.to) : null;
  const activeSection = sections.find((section) => section.title === activePanel);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleValue = (value: string) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];

    onChange(next);
  };

  const handleDateSelect = (date: Date) => {
    if (!dateRange || !onDateRangeChange) return;

    const isoDate = toIsoDate(date);
    const currentFrom = dateRange.from ? fromIsoDate(dateRange.from) : null;
    const currentTo = dateRange.to ? fromIsoDate(dateRange.to) : null;

    if (!currentFrom || currentTo) {
      onDateRangeChange({ from: isoDate, to: '' });
      return;
    }

    if (date < currentFrom) {
      onDateRangeChange({ from: isoDate, to: dateRange.from });
      return;
    }

    if (isSameDay(date, currentFrom)) {
      onDateRangeChange({ from: isoDate, to: '' });
      return;
    }

    onDateRangeChange({ from: dateRange.from, to: isoDate });
  };

  const handleClearDate = () => {
    onDateRangeChange?.({ from: '', to: '' });
  };

  const getSectionCount = (section: FilterSection) =>
    section.options.filter((option) => selectedValues.includes(option.value)).length;

  const changeMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const handleClear = () => {
    onChange([]);
    onDateRangeChange?.({ from: '', to: '' });
    onClear?.();
  };

  const handleApply = () => {
    onApply?.();
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${styles[align]}`} role="menu">
          <div className={styles.header}>
            <div>
              <strong className={styles.title}>Filtros</strong>
              <span className={styles.subtitle}>Escolha uma categoria para refinar a tabela</span>
            </div>
            {activeCount > 0 && <span className={styles.counter}>{activeCount}</span>}
          </div>

          <div className={styles.body}>
            <aside className={styles.tabs} aria-label="Categorias de filtro">
              {hasDateFilter && (
                <button
                  type="button"
                  className={`${styles.tabButton} ${activePanel === 'period' ? styles.tabActive : ''}`}
                  onClick={() => setActivePanel('period')}
                >
                  <span>Período</span>
                  {(dateRange?.from || dateRange?.to) && <span className={styles.tabBadge}>1</span>}
                </button>
              )}

              {sections.map((section) => {
                const count = getSectionCount(section);
                return (
                  <button
                    key={section.title}
                    type="button"
                    className={`${styles.tabButton} ${activePanel === section.title ? styles.tabActive : ''}`}
                    onClick={() => setActivePanel(section.title)}
                  >
                    <span>{section.title}</span>
                    {count > 0 && <span className={styles.tabBadge}>{count}</span>}
                  </button>
                );
              })}
            </aside>

            <main className={styles.panel}>
              {activePanel === 'period' && hasDateFilter && dateRange && onDateRangeChange && (
                <section className={styles.panelSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionTitle}>Período</span>
                      <p className={styles.sectionHint}>Clique uma vez para data inicial. Clique outra para data final.</p>
                    </div>
                    {(dateRange.from || dateRange.to) && (
                      <button type="button" className={styles.inlineClearButton} onClick={handleClearDate}>
                        Limpar
                      </button>
                    )}
                  </div>

                  <div className={styles.dateSummary}>
                    <span>{formatDisplayDate(dateRange.from)}</span>
                    <SetaSmIcon className={styles.dateArrow} width={14} height={14} />
                    <span>{formatDisplayDate(dateRange.to)}</span>
                  </div>

                  <div className={styles.calendar}>
                    <div className={styles.calendarHeader}>
                      <button type="button" className={`${styles.monthButton} ${styles.monthButtonPrev}`} onClick={() => changeMonth(-1)} aria-label="Mês anterior">
                        <SetaDireitaIcon width={14} height={14} />
                      </button>
                      <strong className={styles.monthLabel}>
                        {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                      </strong>
                      <button type="button" className={styles.monthButton} onClick={() => changeMonth(1)} aria-label="Próximo mês">
                        <SetaDireitaIcon width={14} height={14} />
                      </button>
                    </div>

                    <div className={styles.weekGrid}>
                      {WEEK_DAYS.map((day, index) => (
                        <span key={`${day}-${index}`} className={styles.weekDay}>{day}</span>
                      ))}
                    </div>

                    <div className={styles.daysGrid}>
                      {calendarDays.map((day) => {
                        const isoDate = toIsoDate(day);
                        const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth();
                        const isStart = selectedFrom ? isSameDay(day, selectedFrom) : false;
                        const isEnd = selectedTo ? isSameDay(day, selectedTo) : false;
                        const isInRange = isBetween(day, selectedFrom, selectedTo);

                        return (
                          <button
                            key={isoDate}
                            type="button"
                            className={`
                              ${styles.dayButton}
                              ${isOutsideMonth ? styles.dayOutside : ''}
                              ${isInRange ? styles.dayInRange : ''}
                              ${isStart ? styles.dayRangeStart : ''}
                              ${isEnd ? styles.dayRangeEnd : ''}
                              ${isStart || isEnd ? styles.daySelected : ''}
                            `}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {activeSection && (
                <section className={styles.panelSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionTitle}>{activeSection.title}</span>
                      <p className={styles.sectionHint}>Selecione uma ou mais opções.</p>
                    </div>
                  </div>

                  <div className={styles.options}>
                    {activeSection.options.map((option) => (
                      <label key={option.value} className={styles.option}>
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option.value)}
                          onChange={() => toggleValue(option.value)}
                        />
                        <span className={styles.checkbox} aria-hidden="true" />
                        <span className={styles.optionLabel}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}
            </main>
          </div>

          <div className={styles.footer}>
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} className={styles.clearButton}>
              Limpar tudo
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
