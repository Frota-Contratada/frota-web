import SetaTendenciaIcon from '../../../assets/icons/seta-tendencia.svg?react';
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
}

export function StatCard({ title, value, trend }: StatCardProps) {
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
