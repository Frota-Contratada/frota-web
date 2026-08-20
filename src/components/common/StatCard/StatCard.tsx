import SetaTendenciaIcon from '../../../assets/icons/seta-tendencia.svg?react';
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

export function StatCard({ title, value, trend, isLoading = false }: StatCardProps) {
  if (isLoading) {
    return (
      <div className={styles.card}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={28} style={{ margin: '6px 0' }} />
        {trend && <Skeleton width="50%" height={14} />}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.title}>{title}</span>
      <strong className={styles.value}>{value}</strong>
      {trend && (
        <div className={`${styles.trend} ${styles[trend.direction]}`}>
          <SetaTendenciaIcon className={styles.trendIcon} width={16} height={16} />
          <span className={styles.trendValue}>{trend.value}%</span>
          <span className={styles.trendLabel}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
