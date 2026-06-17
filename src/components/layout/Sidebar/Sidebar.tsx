import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../common';
import { useAuthStore } from '../../../stores/authStore';
import styles from './Sidebar.module.css';
import CorridasIcon from '../../../assets/icons/corridas.svg?react';
import ContratosIcon from '../../../assets/icons/contratos.svg?react';
import FiliaisIcon from '../../../assets/icons/filiais.svg?react';
import DashboardsIcon from '../../../assets/icons/dashboards.svg?react';
import ColaboradoresIcon from '../../../assets/icons/colaboradores.svg?react';
import AlvoIcon from '../../../assets/icons/alvo.svg?react';
import GastosIcon from '../../../assets/icons/gastos.svg?react';
import PrecoAuditoriaIcon from '../../../assets/icons/preco-auditoria.svg?react';
import SolicitacoesIcon from '../../../assets/icons/solicitacoes.svg?react';
import CalendarioIcon from '../../../assets/icons/calendario.svg?react';
import HistoricoIcon from '../../../assets/icons/historico.svg?react';
import HomeIcon from '../../../assets/icons/home.svg?react';
import TerceirosIcon from '../../../assets/icons/terceiros.svg?react';
import FornecedoresIcon from '../../../assets/icons/fornecedores.svg?react';
import SairIcon from '../../../assets/icons/sair.svg?react';
import setaDireitaIcon from '../../../assets/icons/seta-direita.svg';
import searaJbsLogo from '../../../assets/images/seara-jbs.svg';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
}

const ArrowIcon = ({ className = '', size = 20 }: { className?: string; size?: number }) => (
  <img
    src={setaDireitaIcon}
    alt=""
    width={size}
    height={size}
    className={className}
    style={{ display: 'block' }}
  />
);

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <HomeIcon />,
    path: '/home',
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: <DashboardsIcon />,
    submenu: [
      { id: 'visao-executiva', label: 'Visão executiva', icon: <AlvoIcon />, path: '/visao-executiva' },
      { id: 'gastos', label: 'Gastos', icon: <GastosIcon />, path: '/gastos' },
      { id: 'preco-auditoria', label: 'Preço & Auditoria', icon: <PrecoAuditoriaIcon />, path: '/preco-auditoria' },
    ],
  },
  {
    id: 'corridas',
    label: 'Corridas',
    icon: <CorridasIcon />,
    submenu: [
      { id: 'solicitacoes', label: 'Solicitações', icon: <SolicitacoesIcon />, path: '/corridas/solicitacoes' },
      { id: 'calendario', label: 'Calendário', icon: <CalendarioIcon />, path: '/corridas/calendario' },
      { id: 'historico', label: 'Histórico', icon: <HistoricoIcon />, path: '/corridas/historico' },
    ],
  },
  {
    id: 'terceiros',
    label: 'Terceiros',
    icon: <TerceirosIcon />,
    submenu: [
      { id: 'fornecedores', label: 'Fornecedores', icon: <FornecedoresIcon />, path: '/terceiros/fornecedores' },
      { id: 'contratos-terceiros', label: 'Contratos', icon: <ContratosIcon />, path: '/terceiros/contratos' },
    ],
  },
  {
    id: 'colaboradores',
    label: 'Colaboradores',
    icon: <ColaboradoresIcon />,
    path: '/colaboradores',
  },
  {
    id: 'filiais',
    label: 'Filiais',
    icon: <FiliaisIcon />,
    path: '/filiais',
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const [openMenus, setOpenMenus] = useState<string[]>(['dashboards']);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logos}>
          <img src={searaJbsLogo} alt="Seara JBS" className={styles.logo} />
        </div>
        <p className={styles.subtitle}>Plataforma de gestão de frotas</p>

        <button
          className={styles.collapseButton}
          onClick={onToggle}
          aria-label="Recolher menu"
        >
          <ArrowIcon size={24} className={styles.collapseArrow} />
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              {item.submenu ? (
                <>
                  <button
                    className={`${styles.menuButton} ${openMenus.includes(item.id) ? styles.open : ''}`}
                    onClick={() => toggleMenu(item.id)}
                  >
                    <span className={styles.menuIcon}>{item.icon}</span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={`${styles.chevron} ${openMenus.includes(item.id) ? styles.rotated : ''}`}>
                      <ArrowIcon className={styles.chevronArrow} />
                    </span>
                  </button>

                  {openMenus.includes(item.id) && (
                    <ul className={`${styles.submenu} ${item.id === 'terceiros' ? styles.submenuTerceiros : ''}`}>
                      {item.submenu.map((subItem) => (
                        <li key={subItem.id} className={styles.submenuItem}>
                          <Link
                            to={subItem.path}
                            className={`${styles.submenuLink} ${isActive(subItem.path) ? styles.active : ''}`}
                          >
                            {subItem.icon && (
                              <span className={styles.submenuIcon}>{subItem.icon}</span>
                            )}
                            <span className={styles.submenuLabel}>{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  to={item.path || '#'}
                  className={`${styles.menuButton} ${isActive(item.path) ? styles.active : ''}`}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar} aria-label="Usuário">
              U
            </div>
            <span className={styles.onlineIndicator}></span>
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>Usuário</p>
            <p className={styles.userEmail}>usuario@email.com</p>
          </div>
        </div>

        <button
          className={styles.logoutButton}
          type="button"
          aria-label="Sair da plataforma"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          <span className={styles.logoutIcon} aria-hidden="true">
            <SairIcon width={18} height={18} />
          </span>
          <span className={styles.logoutLabel}>Sair</span>
        </button>
      </div>

      {isLogoutModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setIsLogoutModalOpen(false)}>
          <div
            className={styles.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalIcon} aria-hidden="true">
              <SairIcon width={22} height={22} />
            </div>
            <div className={styles.modalContent}>
              <h2 id="logout-title">Sair da plataforma?</h2>
              <p id="logout-description">Você será redirecionado para a tela de login.</p>
            </div>
            <div className={styles.modalActions}>
              <Button type="button" variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
