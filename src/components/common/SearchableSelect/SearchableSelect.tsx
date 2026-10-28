import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import SetaDireitaIcon from '../../../assets/icons/seta-direita.svg?react';
import type { SelectOption } from '../Select/Select';
import selectStyles from '../Select/Select.module.css';
import styles from './SearchableSelect.module.css';

export type SearchableSelectOption = SelectOption & {
  /** Texto extra para a busca (código, CNPJ etc.), além do label. */
  searchText?: string;
};

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  /**
   * Busca no servidor, para listas grandes demais para carregar inteiras.
   * Recebe o termo digitado (com atraso) e o componente mostra as options
   * que o pai devolver. Sem ela, as options são filtradas aqui mesmo.
   */
  onSearch?: (term: string) => void;
  /** Mínimo de letras para chamar onSearch. */
  minSearchLength?: number;
  isLoading?: boolean;
  /** Label do valor escolhido quando ele não está nas options atuais. */
  selectedLabel?: string;
}

// Opções desenhadas de uma vez; o restante aparece ao refinar a busca.
const MAX_VISIBLE = 100;
const SEARCH_DELAY_MS = 300;

// Busca sem diferenciar acento nem maiúscula: "rolandia" acha "ROLÂNDIA".
const normalizeSearch = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim();

export const SearchableSelect = ({
  label,
  placeholder = 'Selecione',
  searchPlaceholder = 'Digite para buscar',
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  error,
  helperText,
  onSearch,
  minSearchLength = 2,
  isLoading = false,
  selectedLabel,
}: SearchableSelectProps) => {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const listboxId = `${generatedId}-listbox`;
  const hasError = Boolean(error);
  const isRemote = Boolean(onSearch);
  const trimmed = term.trim();
  const waitingForTerm = isRemote && trimmed.length < minSearchLength;

  const triggerLabel = options.find((option) => option.value === value)?.label ?? (value ? selectedLabel : undefined);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isRemote || !isOpen || trimmed.length < minSearchLength) return;
    const timer = setTimeout(() => onSearch?.(trimmed), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isRemote, isOpen, trimmed, minSearchLength, onSearch]);

  const filtered = useMemo(() => {
    if (waitingForTerm) return [];
    const query = normalizeSearch(trimmed);
    if (!query || isRemote) return options;
    return options.filter((option) =>
      normalizeSearch(`${option.label} ${option.searchText ?? ''}`).includes(query)
    );
  }, [options, trimmed, isRemote, waitingForTerm]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  const open = () => {
    if (disabled) return;
    setTerm('');
    setHighlighted(0);
    setIsOpen(true);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, visible.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = visible[highlighted];
      if (option) handleSelect(option.value);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const statusMessage = (() => {
    if (waitingForTerm) return `Digite ao menos ${minSearchLength} letras para buscar`;
    if (isLoading) return 'Buscando...';
    if (visible.length === 0) return 'Nenhum resultado';
    if (filtered.length > visible.length) {
      return `Mostrando ${visible.length} de ${filtered.length}. Continue digitando para refinar.`;
    }
    return undefined;
  })();

  return (
    <div className={selectStyles.container} ref={containerRef}>
      {label && (
        <span className={selectStyles.label}>
          {label}
          {required && <span className={selectStyles.required}>*</span>}
        </span>
      )}

      <button
        type="button"
        className={`${selectStyles.trigger} ${isOpen ? selectStyles.open : ''} ${!triggerLabel ? selectStyles.placeholder : ''} ${hasError ? selectStyles.error : ''}`}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={hasError}
      >
        <span>{triggerLabel ?? placeholder}</span>
        <SetaDireitaIcon className={selectStyles.chevron} width={14} height={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={`${selectStyles.dropdown} ${styles.dropdown}`}>
          <input
            className={styles.search}
            type="text"
            role="combobox"
            aria-label={label ? `Buscar ${label.replace(/\s*\*$/, '').toLocaleLowerCase('pt-BR')}` : 'Buscar'}
            aria-controls={listboxId}
            aria-expanded="true"
            aria-autocomplete="list"
            aria-activedescendant={visible[highlighted] ? `${listboxId}-${highlighted}` : undefined}
            placeholder={searchPlaceholder}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          <div className={styles.options} role="listbox" id={listboxId} tabIndex={-1}>
            {visible.map((option, index) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={`${option.value}-${index}`}
                  id={`${listboxId}-${index}`}
                  type="button"
                  className={`${selectStyles.option} ${isSelected ? selectStyles.selected : ''} ${index === highlighted ? styles.highlighted : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {statusMessage && <p className={styles.status}>{statusMessage}</p>}
        </div>
      )}

      {error && (
        <span className={selectStyles.errorText} role="alert">
          {error}
        </span>
      )}

      {!error && helperText && <span className={selectStyles.helperText}>{helperText}</span>}
    </div>
  );
};
