import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import type { UserProfile } from '../../../types/profile.types';
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
import TerceirosIcon from '../../../assets/icons/terceiros.svg?react';
import FornecedoresIcon from '../../../assets/icons/fornecedores.svg?react';
import setaDireitaIcon from '../../../assets/icons/seta-direita.svg';
import searaJbsLogo from '../../../assets/images/seara-jbs.svg';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: SubMenuItem[];
  badge?: string;
  allowedProfiles?: UserProfile[];
}

interface SubMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  allowedProfiles?: UserProfile[];
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

const allMenuItems: MenuItem[] = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: <DashboardsIcon />,
    allowedProfiles: ['admin-master', 'admin-filial', 'aprovador'],
    submenu: [
      { id: 'visao-executiva', label: 'Visão executiva', icon: <AlvoIcon />, path: '/visao-executiva', allowedProfiles: ['admin-master', 'admin-filial'] },
      { id: 'gastos', label: 'Gastos', icon: <GastosIcon />, path: '/gastos', allowedProfiles: ['admin-master', 'admin-filial', 'aprovador'] },
      { id: 'preco-auditoria', label: 'Preço & Auditoria', icon: <PrecoAuditoriaIcon />, path: '/preco-auditoria', allowedProfiles: ['admin-master', 'admin-filial', 'aprovador'] },
    ],
  },
  {
    id: 'corridas',
    label: 'Corridas',
    icon: <CorridasIcon />,
    submenu: [
      { id: 'solicitacoes', label: 'Solicitações', icon: <SolicitacoesIcon />, path: '/corridas/solicitacoes', allowedProfiles: ['admin-master', 'admin-filial', 'aprovador', 'solicitante', 'solicitante-emergencia', 'admin-fornecedor'] },
      { id: 'calendario', label: 'Calendário', icon: <CalendarioIcon />, path: '/corridas/calendario', allowedProfiles: ['admin-master', 'admin-filial', 'aprovador', 'solicitante', 'solicitante-emergencia'] },
      { id: 'historico', label: 'Histórico', icon: <HistoricoIcon />, path: '/corridas/historico' },
    ],
  },
  {
    id: 'terceiros',
    label: 'Terceiros',
    icon: <TerceirosIcon />,
    allowedProfiles: ['admin-master', 'admin-filial', 'admin-fornecedor'],
    submenu: [
      { id: 'fornecedores', label: 'Fornecedores', icon: <FornecedoresIcon />, path: '/terceiros/fornecedores', allowedProfiles: ['admin-master', 'admin-filial'] },
      { id: 'contratos-terceiros', label: 'Contratos', icon: <ContratosIcon />, path: '/terceiros/contratos', allowedProfiles: ['admin-master', 'admin-filial'] },
      { id: 'motoristas', label: 'Motoristas', icon: <ColaboradoresIcon />, path: '/terceiros/motoristas', allowedProfiles: ['admin-master', 'admin-filial', 'admin-fornecedor'] },
    ],
  },
  {
    id: 'colaboradores',
    label: 'Colaboradores',
    icon: <ColaboradoresIcon />,
    allowedProfiles: ['admin-master', 'admin-filial'],
    path: '/colaboradores',
  },
  {
    id: 'filiais',
    label: 'Filiais',
    icon: <FiliaisIcon />,
    allowedProfiles: ['admin-master'],
    path: '/filiais',
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const getSubmenuConnectorClass = (count: number) => {
  if (count === 1) return styles.submenu1;
  if (count === 2) return styles.submenu2;
  if (count === 4) return styles.submenu4;
  return styles.submenu3;
};

export const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const { hasProfile, isRequester, isSupplier, isApprover } = usePermissions();
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    if (isSupplier) return ['terceiros'];
    if (isRequester || isApprover) return ['corridas'];
    return ['dashboards'];
  });
  const location = useLocation();

  const visibleMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      if (item.allowedProfiles && !hasProfile(item.allowedProfiles)) {
        return false;
      }
      return true;
    }).map((item) => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter((sub) => !sub.allowedProfiles || hasProfile(sub.allowedProfiles)),
        };
      }
      return item;
    });
  }, [hasProfile]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleMenuWithSubmenuClick = (menuId: string) => {
    if (isCollapsed) {
      setOpenMenus((prev) => (prev.includes(menuId) ? prev : [...prev, menuId]));
      onToggle?.();
      return;
    }

    toggleMenu(menuId);
  };

  const isItemActive = (item: MenuItem) => {
    if (item.path && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
      return true;
    }
    if (item.submenu) {
      return item.submenu.some(
        (sub) => location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`)
      );
    }
    return false;
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
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
          {visibleMenuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              {item.submenu ? (
                <>
                  <button
                    className={`${styles.menuButton} ${openMenus.includes(item.id) ? styles.open : ''} ${isItemActive(item) ? styles.active : ''}`}
                    onClick={() => handleMenuWithSubmenuClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <span className={styles.menuIcon}>{item.icon}</span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={`${styles.chevron} ${openMenus.includes(item.id) ? styles.rotated : ''}`}>
                      <ArrowIcon className={styles.chevronArrow} />
                    </span>
                  </button>

                  {openMenus.includes(item.id) && (
                    <ul className={`${styles.submenu} ${getSubmenuConnectorClass(item.submenu.length)}`}>
                      {item.submenu.map((subItem) => (
                        <li key={subItem.id} className={styles.submenuItem}>
                          <Link
                            to={subItem.path}
                            className={`${styles.submenuLink} ${isActive(subItem.path) ? styles.active : ''}`}
                            title={isCollapsed ? subItem.label : undefined}
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
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>


    </aside>
  );
};
