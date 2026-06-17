import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const pageTitles: Record<string, string> = {
  '/home': 'Home',
};

export const Header = () => {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'Página';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>{currentTitle}</h1>
        </div>
      </div>
    </header>
  );
};
