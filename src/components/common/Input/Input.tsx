import { type InputHTMLAttributes, forwardRef, type ReactNode, type ChangeEvent } from 'react';
import styles from './Input.module.css';
import { formatCpf, formatCnpj, formatCep, formatPhone } from '../../../utils';

export type InputMaskType = 'cpf' | 'cnpj' | 'cep' | 'phone' | ((value: string) => string);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  mask?: InputMaskType;
}

const applyMask = (val: string, maskType?: InputMaskType): string => {
  if (!maskType) return val;
  if (typeof maskType === 'function') return maskType(val);
  switch (maskType) {
    case 'cpf':
      return formatCpf(val);
    case 'cnpj':
      return formatCnpj(val);
    case 'cep':
      return formatCep(val);
    case 'phone':
      return formatPhone(val);
    default:
      return val;
  }
};

const getMaskDefaults = (maskType?: InputMaskType) => {
  if (!maskType || typeof maskType === 'function') return {};
  switch (maskType) {
    case 'cpf':
      return { maxLength: 14, placeholder: '000.000.000-00' };
    case 'cnpj':
      return { maxLength: 18, placeholder: '00.000.000/0000-00' };
    case 'cep':
      return { maxLength: 9, placeholder: '00000-000' };
    case 'phone':
      return { maxLength: 15, placeholder: '(00) 00000-0000' };
    default:
      return {};
  }
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      mask,
      onChange,
      value,
      maxLength,
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const maskDefaults = getMaskDefaults(mask);

    const computedMaxLength = maxLength ?? maskDefaults.maxLength;
    const computedPlaceholder = placeholder ?? maskDefaults.placeholder;
    const formattedValue = typeof value === 'string' && mask ? applyMask(value, mask) : value;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (mask) {
        const masked = applyMask(e.target.value, mask);
        e.target.value = masked;
      }
      onChange?.(e);
    };

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

          <input
            ref={ref}
            id={inputId}
            className={`
              ${styles.input}
              ${hasError ? styles.error : ''}
              ${leftIcon ? styles.hasLeftIcon : ''}
              ${rightIcon ? styles.hasRightIcon : ''}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            maxLength={computedMaxLength}
            placeholder={computedPlaceholder}
            value={formattedValue}
            onChange={handleChange}
            {...props}
          />

          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>

        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export type { InputProps };
