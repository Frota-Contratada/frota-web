import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Input } from '../common/Input/Input';
import { geoService, type SugestaoEndereco } from '../../services/maps/geoService';
import styles from './AddressAutocomplete.module.css';

interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (address: SugestaoEndereco) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const AddressAutocomplete = ({
  label,
  placeholder,
  value,
  onChange,
  onSelectAddress,
  required,
  disabled,
  error,
  leftIcon,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<SugestaoEndereco[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 3) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        const results = await geoService.buscarSugestoesEndereco(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsLoading(false);
      }, 350);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelect = (item: SugestaoEndereco) => {
    onChange(item.displayName);
    onSelectAddress?.(item);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div className={styles.inputWrapper}>
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          required={required}
          disabled={disabled}
          error={error}
          leftIcon={leftIcon}
          rightIcon={isLoading ? <div className={styles.loadingSpinner} /> : undefined}
          autoComplete="off"
        />

        {isOpen && suggestions.length > 0 && (
          <ul className={styles.suggestionsDropdown} role="listbox">
            {suggestions.map((item, index) => {
              const mainText = [item.logradouro, item.bairro, item.cidade].filter(Boolean).join(', ') || item.displayName.split(',')[0];
              return (
                <li
                  key={`${item.latitude}-${item.longitude}-${index}`}
                  className={styles.suggestionItem}
                  onClick={() => handleSelect(item)}
                  role="option"
                  aria-selected={false}
                >
                  <span className={styles.suggestionMain}>{mainText}</span>
                  <span className={styles.suggestionSub}>{item.displayName}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
