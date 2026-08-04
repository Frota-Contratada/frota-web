import { useEffect, useId, useRef, useState } from 'react';
import SetaDireitaIcon from '../../../assets/icons/seta-direita.svg?react';
import styles from './Select.module.css';

export type SelectOption = {
  label: string;
  value: string;
};

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export const Select = ({
  label,
  placeholder = 'Selecione',
  value,
  options,
  onChange,
  required = false,
  disabled = false,
}: SelectProps) => {
  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const listboxId = `${generatedId}-listbox`;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </span>
      )}

      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${!selectedOption ? styles.placeholder : ''}`}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <SetaDireitaIcon className={styles.chevron} width={14} height={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" id={listboxId} tabIndex={-1}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
