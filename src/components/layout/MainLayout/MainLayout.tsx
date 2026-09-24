import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className={`${styles.main} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <Header />
        <main className={styles.content}>
          <div key={location.pathname} className={styles.pageWrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
