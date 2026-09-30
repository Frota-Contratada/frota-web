import React from 'react';
import styles from './PeriodFilter.module.css';

export type PeriodFilterMode = 'month' | 'year';

export interface PeriodFilterValue {
  mode: PeriodFilterMode;
  year: number;
  month?: number;
  isAllYears?: boolean;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (newValue: PeriodFilterValue) => void;
  availableYears?: number[];
  showSummary?: boolean;
}

const MONTH_SHORT_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MONTH_FULL_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  value,
  onChange,
  availableYears = [2024, 2025, 2026, 2027],
  showSummary = true,
}) => {
  const currentActualDate = new Date();
  const currentActualYear = currentActualDate.getFullYear();
  const currentActualMonth = currentActualDate.getMonth();

  const handleModeChange = (mode: PeriodFilterMode) => {
    if (mode === value.mode) return;
    if (mode === 'month') {
      onChange({
        mode: 'month',
        year: value.year || currentActualYear,
        month: value.month ?? currentActualMonth,
        isAllYears: false,
      });
    } else {
      onChange({
        mode: 'year',
        year: value.year || currentActualYear,
        month: undefined,
        isAllYears: false,
      });
    }
  };

  const handleYearChange = (year: number) => {
    onChange({
      ...value,
      year,
      isAllYears: false,
    });
  };

  const handleAllYears = () => {
    onChange({
      ...value,
      mode: 'year',
      isAllYears: true,
      month: undefined,
    });
  };

  const handleMonthChange = (monthIndex: number) => {
    onChange({
      ...value,
      mode: 'month',
      month: monthIndex,
      isAllYears: false,
    });
  };

  const handlePrevMonth = () => {
    const curMonth = value.month ?? currentActualMonth;
    const curYear = value.year;
    if (curMonth === 0) {
      onChange({
        mode: 'month',
        year: curYear - 1,
        month: 11,
        isAllYears: false,
      });
    } else {
      onChange({
        mode: 'month',
        year: curYear,
        month: curMonth - 1,
        isAllYears: false,
      });
    }
  };

  const handleNextMonth = () => {
    const curMonth = value.month ?? currentActualMonth;
    const curYear = value.year;
    if (curMonth === 11) {
      onChange({
        mode: 'month',
        year: curYear + 1,
        month: 0,
        isAllYears: false,
      });
    } else {
      onChange({
        mode: 'month',
        year: curYear,
        month: curMonth + 1,
        isAllYears: false,
      });
    }
  };

  const handleCurrentMonth = () => {
    onChange({
      mode: 'month',
      year: currentActualYear,
      month: currentActualMonth,
      isAllYears: false,
    });
  };

  const activeLabel = value.isAllYears
    ? 'Todos os Anos (Consolidado)'
    : value.mode === 'year'
    ? `Ano Completo • ${value.year}`
    : `${MONTH_FULL_NAMES[value.month ?? currentActualMonth]} / ${value.year}`;

  return (
    <div className={styles.container} role="region" aria-label="Filtro de Período Temporal">
      <div className={styles.topRow}>
        <div className={styles.modeToggle} role="group" aria-label="Modo de Filtro">
          <button
            type="button"
            className={`${styles.modeBtn} ${value.mode === 'month' && !value.isAllYears ? styles.modeBtnActive : ''}`}
            onClick={() => handleModeChange('month')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Mês a Mês
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${value.mode === 'year' || value.isAllYears ? styles.modeBtnActive : ''}`}
            onClick={() => handleModeChange('year')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Ano a Ano
          </button>
        </div>

        <div className={styles.navControls}>
          {value.mode === 'month' && !value.isAllYears && (
            <>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrevMonth}
                title="Mês anterior"
                aria-label="Mês anterior"
              >
                ◀ Mês anterior
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleCurrentMonth}
                title="Ir para o mês atual"
              >
                Mês Atual
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleNextMonth}
                title="Próximo mês"
                aria-label="Próximo mês"
              >
                Próximo mês ▶
              </button>
            </>
          )}

          <div className={styles.activeLabelBadge}>
            <span style={{ fontSize: '10px' }}>●</span>
            <span>{activeLabel}</span>
          </div>
        </div>
      </div>

      <div className={styles.periodGrid}>

        <div className={styles.yearPillGroup}>
          {availableYears.map((yr) => {
            const isYearActive = value.year === yr && !value.isAllYears;
            return (
              <button
                key={yr}
                type="button"
                className={`${styles.periodPill} ${isYearActive ? styles.periodPillActive : ''}`}
                onClick={() => handleYearChange(yr)}
              >
                {yr}
              </button>
            );
          })}

          {value.mode === 'year' && (
            <button
              type="button"
              className={`${styles.periodPill} ${value.isAllYears ? styles.periodPillActive : ''}`}
              onClick={handleAllYears}
            >
              Todos os Anos
            </button>
          )}
        </div>

        {/* Seletor de 12 Meses (visível no modo mês a mês) */}
        {value.mode === 'month' && !value.isAllYears && (
          <>
            {MONTH_SHORT_NAMES.map((name, idx) => {
              const isMonthActive = value.month === idx;
              return (
                <button
                  key={name}
                  type="button"
                  className={`${styles.periodPill} ${isMonthActive ? styles.periodPillActive : ''}`}
                  onClick={() => handleMonthChange(idx)}
                >
                  {name}
                </button>
              );
            })}
          </>
        )}
      </div>

      {showSummary && (
        <div className={styles.periodSummary}>
          <span>
            Período selecionado:{' '}
            <strong className={styles.highlightText}>{activeLabel}</strong>
          </span>
          <span>
            {value.mode === 'month'
              ? 'Exibindo dados e transações filtrados por competência mensal'
              : 'Exibindo faturamento e balanço consolidado anual'}
          </span>
        </div>
      )}
    </div>
  );
};
