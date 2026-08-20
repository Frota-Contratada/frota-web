import { type ReactNode } from 'react';
import CorridasIcon from '../../../assets/icons/corridas.svg?react';
import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  variant?: 'inline' | 'card' | 'fullscreen' | 'overlay';
  icon?: ReactNode;
  className?: string;
}

export function LoadingState({
  message = 'Carregando',
  submessage,
  variant = 'inline',
  icon,
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`${styles.container} ${styles[variant]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.animationWrapper}>
        <div className={styles.glowPulse} />
        <div className={styles.glowRing} />
        <div className={styles.iconCircle}>
          {icon || <CorridasIcon width={24} height={24} />}
        </div>
      </div>

      <div className={styles.textGroup}>
        <h3 className={styles.message}>
          {message}
          <span className={styles.dots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </h3>
        {submessage && <p className={styles.submessage}>{submessage}</p>}
      </div>
    </div>
  );
}
