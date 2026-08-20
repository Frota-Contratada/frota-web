import { Skeleton } from '../Skeleton/Skeleton';
import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  variant?: 'inline' | 'card' | 'fullscreen' | 'overlay' | 'details' | 'form' | 'table';
  className?: string;
  rows?: number;
}

export function LoadingState({
  variant = 'card',
  className = '',
  rows = 4,
}: LoadingStateProps) {
  if (variant === 'details' || variant === 'card') {
    return (
      <div className={`${styles.skeletonContainer} ${styles[variant]} ${className}`} role="status" aria-live="polite">
        <div className={styles.headerBlock}>
          <Skeleton variant="rounded" width="40%" height={28} />
          <Skeleton variant="text" width="20%" height={16} />
        </div>
        <div className={styles.gridBlock}>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className={styles.cardItem}>
              <Skeleton variant="text" width="30%" height={14} />
              <Skeleton variant="rounded" width="80%" height={22} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`${styles.skeletonContainer} ${className}`} role="status" aria-live="polite">
        <div className={styles.headerBlock}>
          <Skeleton variant="rounded" width="35%" height={32} />
        </div>
        <div className={styles.formFields}>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className={styles.formField}>
              <Skeleton variant="text" width="25%" height={14} />
              <Skeleton variant="rounded" width="100%" height={44} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.skeletonContainer} ${styles[variant]} ${className}`} role="status" aria-live="polite">
      <Skeleton variant="rounded" width="100%" height={48} />
      <Skeleton variant="rounded" width="100%" height={48} />
      <Skeleton variant="rounded" width="100%" height={48} />
    </div>
  );
}
