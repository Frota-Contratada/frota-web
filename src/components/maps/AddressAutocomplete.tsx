import { useEffect, useRef, useState } from 'react';
import { Input, Spinner } from '../common';
import { geoService, type SugestaoEndereco } from '../../services/maps/geoService';
import styles from './AddressAutocomplete.module.css';

interface AddressAutocompleteProps {
  label?: string;
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
  placeholder = 'Buscar endereço...',
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await geoService.buscarSugestoesEndereco(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);

        // Se for um CEP exato de 8 dígitos, sincroniza diretamente
        const cleanCep = query.replace(/\D/g, '');
        if (cleanCep.length === 8 && results.length > 0) {
          onSelectAddress?.(results[0]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelect = (suggestion: SugestaoEndereco) => {
    const formattedAddress = suggestion.displayName || [suggestion.logradouro, suggestion.bairro, suggestion.cidade, suggestion.uf].filter(Boolean).join(', ');
    onChange(formattedAddress);
    onSelectAddress?.(suggestion);
    setIsOpen(false);
    setSuggestions([]);
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
          rightIcon={isLoading ? <Spinner size="xs" variant="primary" /> : undefined}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
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
