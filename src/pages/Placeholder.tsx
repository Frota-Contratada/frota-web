import styles from './Placeholder.module.css';

interface PlaceholderProps {
  title: string;
}

export const Placeholder = ({ title }: PlaceholderProps) => (
  <div className={styles.container}>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.subtitle}>Em construção</p>
  </div>
);
