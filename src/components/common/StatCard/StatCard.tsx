import { Skeleton } from '../Skeleton/Skeleton';
import styles from './StatCard.module.css';

export interface StatCardTrend {
  value: number;
  direction: 'up' | 'down';
  label: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: StatCardTrend;
  isLoading?: boolean;
}

export function StatCard({ title, value, isLoading = false }: StatCardProps) {
  if (isLoading) {
    return (
      <div className={styles.card}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={28} style={{ margin: '6px 0' }} />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.title}>{title}</span>
      <strong className={styles.value}>{value}</strong>
    </div>
  );
}
