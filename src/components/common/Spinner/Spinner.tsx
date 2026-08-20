import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'brand' | 'white' | 'muted';
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Carregando...',
}: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${styles[size]} ${styles[variant]} ${className}`}
      role="status"
      aria-label={label}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="4.5"
        />
        <circle
          className={styles.head}
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="4.5"
        />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
