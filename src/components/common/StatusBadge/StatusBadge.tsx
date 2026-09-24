import styles from './StatusBadge.module.css';

export type BadgeStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'cancelado';

const STATUS_LABELS: Record<BadgeStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  em_andamento: 'Em andamento',
  cancelado: 'Cancelado',
};

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} />
      {label || STATUS_LABELS[status]}
    </span>
  );
}
