import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { authApi } from '../../../services/auth/authApi';
import { useAuthStore } from '../../../stores/authStore';
import { normalizeProfile, type UserProfile } from '../../../types/profile.types';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    let isMounted = true;
    authApi.me().then((res) => {
      if (!isMounted || !res?.response) return;
      const meData = res.response;
      const rawMain = (meData.perfis && meData.perfis.length > 0)
        ? meData.perfis[0].tipoPerfil
        : 'solicitante';
      const mainProfile = normalizeProfile(rawMain) || ('solicitante' as UserProfile);

      updateUser({
        id: String(meData.id),
        name: meData.nome,
        email: meData.email,
        cpf: meData.cpf,
        profile: mainProfile,
        fotoPerfil: meData.fotoPerfil,
        dataAtivacao: meData.dataAtivacao,
        perfis: meData.perfis,
      });
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [updateUser]);

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
