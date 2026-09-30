import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import SetaDireitaIcon from '../../../assets/icons/seta-direita.svg?react';
import SearchIcon from '../../../assets/icons/search.svg?react';
import CheckIcon from '../../../assets/icons/check.svg?react';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import styles from './MultiSelect.module.css';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  selectAllText?: string;
  clearAllText?: string;
  showSelectAll?: boolean;
  maxDisplayedChips?: number;
  emptySearchMessage?: string;
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const MultiSelect = ({
  label,
  placeholder = 'Selecione uma ou mais opções',
  searchPlaceholder = 'Pesquisar...',
  values = [],
  options = [],
  onChange,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  selectAllText = 'Selecionar todos',
  clearAllText = 'Limpar seleção',
  showSelectAll = true,
  maxDisplayedChips = 5,
  emptySearchMessage = 'Nenhuma opção encontrada',
}: MultiSelectProps) => {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const listboxId = `${generatedId}-multiselect-listbox`;
  const hasError = Boolean(error);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  const filteredOptions = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return options;

    return options.filter((opt) => {
      const matchLabel = normalizeText(opt.label).includes(query);
      const matchDesc = opt.description ? normalizeText(opt.description).includes(query) : false;
      const matchBadge = opt.badge ? normalizeText(opt.badge).includes(query) : false;
      return matchLabel || matchDesc || matchBadge;
    });
  }, [options, searchQuery]);

  const selectedOptions = useMemo(() => {
    const valueSet = new Set(values);
    return options.filter((opt) => valueSet.has(opt.value));
  }, [options, values]);

  const handleToggleOption = (optionValue: string, optionDisabled?: boolean) => {
    if (disabled || optionDisabled) return;

    const exists = values.includes(optionValue);
    const next = exists ? values.filter((v) => v !== optionValue) : [...values, optionValue];
    onChange(next);
  };

  const handleRemoveChip = (e: MouseEvent, optionValue: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(values.filter((v) => v !== optionValue));
  };

  const handleClearAll = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  const handleSelectAll = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    const enabledOptionValues = filteredOptions.filter((opt) => !opt.disabled).map((opt) => opt.value);
    const combined = Array.from(new Set([...values, ...enabledOptionValues]));
    onChange(combined);
  };

  const visibleChips = selectedOptions.slice(0, maxDisplayedChips);
  const hiddenChipsCount = selectedOptions.length - visibleChips.length;

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </span>
      )}

      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${hasError ? styles.error : ''}`}
        onClick={() => !disabled && setIsOpen((curr) => !curr)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={hasError}
      >
        <div className={styles.contentWrapper}>
          {selectedOptions.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <>
              {visibleChips.map((opt) => (
                <span key={opt.value} className={styles.chip} title={opt.label}>
                  <span className={styles.chipLabel}>{opt.label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={(e) => handleRemoveChip(e, opt.value)}
                      aria-label={`Remover ${opt.label}`}
                    >
                      <ErroIcon width={9} height={9} />
                    </button>
                  )}
                </span>
              ))}

              {hiddenChipsCount > 0 && (
                <span className={styles.chipMore} title={`${hiddenChipsCount} outros itens selecionados`}>
                  +{hiddenChipsCount} mais
                </span>
              )}
            </>
          )}
        </div>

        <div className={styles.actionsRight}>
          {values.length > 0 && !disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClearAll}
              aria-label="Limpar todas as seleções"
              title="Limpar seleção"
            >
              <ErroIcon width={11} height={11} />
            </button>
          )}

          <SetaDireitaIcon className={styles.chevron} width={14} height={14} aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" id={listboxId} aria-multiselectable="true">
          <div className={styles.searchWrapper}>
            <SearchIcon className={styles.searchIcon} width={15} height={15} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Limpar busca"
              >
                <ErroIcon width={10} height={10} />
              </button>
            )}
          </div>

          <div className={styles.toolbar}>
            <span className={styles.counter}>
              {values.length} de {options.length} selecionado{values.length === 1 ? '' : 's'}
            </span>

            {showSelectAll && options.length > 0 && (
              <div className={styles.batchActions}>
                <button
                  type="button"
                  className={styles.textBtn}
                  onClick={handleSelectAll}
                >
                  {selectAllText}
                </button>
                {values.length > 0 && (
                  <button
                    type="button"
                    className={`${styles.textBtn} ${styles.textBtnSecondary}`}
                    onClick={(e) => handleClearAll(e)}
                  >
                    {clearAllText}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={styles.list}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyState}>
                <span>{emptySearchMessage}</span>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${
                      option.disabled ? styles.optionDisabled : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleToggleOption(option.value, option.disabled)}
                  >
                    <div className={styles.checkbox} aria-hidden="true">
                      {isSelected && <CheckIcon className={styles.checkIcon} width={11} height={11} />}
                    </div>

                    <div className={styles.optionInfo}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.description && (
                        <span className={styles.optionDescription}>{option.description}</span>
                      )}
                    </div>

                    {option.badge && <span className={styles.badge}>{option.badge}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      )}

      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};
