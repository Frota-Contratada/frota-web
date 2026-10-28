import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      {isMobileSidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className={`${styles.main} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileSidebarOpen}
        />
        <main className={styles.content}>
          <div key={location.pathname} className={styles.pageWrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
