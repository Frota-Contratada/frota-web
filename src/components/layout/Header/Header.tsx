import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../common';
import { useAuthStore } from '../../../stores/authStore';
import dashboardsIcon from '../../../assets/icons/dashboards.svg';
import alvoIcon from '../../../assets/icons/alvo.svg';
import gastosIcon from '../../../assets/icons/gastos.svg';
import precoAuditoriaIcon from '../../../assets/icons/preco-auditoria.svg';
import corridasIcon from '../../../assets/icons/corridas.svg';
import solicitacoesIcon from '../../../assets/icons/solicitacoes.svg';
import calendarioIcon from '../../../assets/icons/calendario.svg';
import historicoIcon from '../../../assets/icons/historico.svg';
import contratosIcon from '../../../assets/icons/contratos.svg';
import terceirosIcon from '../../../assets/icons/terceiros.svg';
import fornecedoresIcon from '../../../assets/icons/fornecedores.svg';
import colaboradoresIcon from '../../../assets/icons/colaboradores.svg';
import filiaisIcon from '../../../assets/icons/filiais.svg';
import setaDireitaIcon from '../../../assets/icons/seta-direita.svg';
import notificacoesIcon from '../../../assets/icons/notificacoes.svg';
import sairIcon from '../../../assets/icons/sair.svg';
import styles from './Header.module.css';

const pageTitles: Record<string, string> = {
  '/visao-executiva': 'Visão Executiva',
  '/gastos': 'Gastos',
  '/preco-auditoria': 'Preço & Auditoria',
  '/corridas/solicitacoes': 'Solicitações de Corridas',
  '/corridas/calendario': 'Calendário de Corridas',
  '/corridas/historico': 'Histórico de Corridas',
  '/terceiros/fornecedores': 'Fornecedores',
  '/terceiros/fornecedores/novo': 'Cadastrar Fornecedor',
  '/terceiros/contratos': 'Contratos',
  '/terceiros/contratos/novo': 'Novo Contrato',
  '/terceiros/motoristas': 'Motoristas',
  '/terceiros/motoristas/novo': 'Cadastrar Motorista',
  '/colaboradores': 'Colaboradores',
  '/colaboradores/novo': 'Cadastrar Colaborador',
  '/filiais': 'Filiais',
  '/filiais/nova': 'Cadastrar Filial',
};

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/visao-executiva': [
    { label: 'Dashboards', icon: dashboardsIcon, path: '/visao-executiva' },
    { label: 'Visão Executiva', icon: alvoIcon },
  ],
  '/gastos': [
    { label: 'Dashboards', path: '/visao-executiva', icon: dashboardsIcon },
    { label: 'Gastos', icon: gastosIcon },
  ],
  '/preco-auditoria': [
    { label: 'Dashboards', path: '/visao-executiva', icon: dashboardsIcon },
    { label: 'Preço & Auditoria', icon: precoAuditoriaIcon },
  ],
  '/corridas/solicitacoes': [
    { label: 'Corridas', icon: corridasIcon, path: '/corridas/solicitacoes' },
    { label: 'Solicitações', icon: solicitacoesIcon },
  ],
  '/corridas/calendario': [
    { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
    { label: 'Calendário', icon: calendarioIcon },
  ],
  '/corridas/historico': [
    { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
    { label: 'Histórico', icon: historicoIcon },
  ],
  '/terceiros/fornecedores': [
    { label: 'Terceiros', icon: terceirosIcon, path: '/terceiros/fornecedores' },
    { label: 'Fornecedores', icon: fornecedoresIcon },
  ],
  '/terceiros/fornecedores/novo': [
    { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
    { label: 'Fornecedores', path: '/terceiros/fornecedores', icon: fornecedoresIcon },
    { label: 'Cadastrar Fornecedor' },
  ],
  '/terceiros/contratos': [
    { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
    { label: 'Contratos', icon: contratosIcon },
  ],
  '/terceiros/contratos/novo': [
    { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
    { label: 'Contratos', path: '/terceiros/contratos', icon: contratosIcon },
    { label: 'Novo Contrato' },
  ],
  '/terceiros/motoristas': [
    { label: 'Terceiros', icon: terceirosIcon, path: '/terceiros/fornecedores' },
    { label: 'Motoristas', icon: colaboradoresIcon },
  ],
  '/terceiros/motoristas/novo': [
    { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
    { label: 'Motoristas', path: '/terceiros/motoristas', icon: colaboradoresIcon },
    { label: 'Cadastrar Motorista' },
  ],
  '/colaboradores': [
    { label: 'Colaboradores', icon: colaboradoresIcon, path: '/colaboradores' },
  ],
  '/colaboradores/novo': [
    { label: 'Colaboradores', path: '/colaboradores', icon: colaboradoresIcon },
    { label: 'Cadastrar Colaborador' },
  ],
  '/filiais': [
    { label: 'Filiais', icon: filiaisIcon, path: '/filiais' },
  ],
  '/filiais/nova': [
    { label: 'Filiais', path: '/filiais', icon: filiaisIcon },
    { label: 'Cadastrar Filial' },
  ],
};

import { notificationApi, type NotificacaoDto } from '../../../services';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificacaoDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userName = user?.name || 'Usuário';
  const userEmail = user?.email || 'usuario@email.com';
  const userInitials = userName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login', { replace: true });
  };

  const fetchNotificationCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (typeof res?.response?.quantidade === 'number') {
        setUnreadCount(res.response.quantidade);
      }
    } catch {
      // Falha silenciosa se token expirou ou offline
    }
  };

  const fetchNotificationsList = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await notificationApi.list();
      if (Array.isArray(res?.response)) {
        setNotificationsList(res.response);
      }
    } catch {
      setNotificationsList([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotificationsList();
    }
  }, [isNotificationsOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lidaEm: new Date().toISOString() } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // Ignorar erro
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notificationsList.filter((n) => !n.lidaEm);
    await Promise.allSettled(unread.map((n) => notificationApi.markAsRead(n.id)));
    setNotificationsList((prev) =>
      prev.map((n) => ({ ...n, lidaEm: n.lidaEm || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };
  const isContractDetails = location.pathname.startsWith('/terceiros/contratos/') && location.pathname !== '/terceiros/contratos/novo';
  const isSupplierEdit = location.pathname.startsWith('/terceiros/fornecedores/') && location.pathname.endsWith('/editar');
  const isSupplierDetails = location.pathname.startsWith('/terceiros/fornecedores/') && !isSupplierEdit && location.pathname !== '/terceiros/fornecedores/novo';
  const isEmployeeEdit = location.pathname.startsWith('/colaboradores/') && location.pathname.endsWith('/editar');
  const isEmployeeDetails = location.pathname.startsWith('/colaboradores/') && !isEmployeeEdit && location.pathname !== '/colaboradores/novo';
  const isBranchEdit = location.pathname.startsWith('/filiais/') && location.pathname.endsWith('/editar');
  const isBranchDetails = location.pathname.startsWith('/filiais/') && !isBranchEdit && location.pathname !== '/filiais/nova';
  const isRideReview = location.pathname.startsWith('/corridas/solicitacoes/') && location.pathname.endsWith('/revisar');
  const isRideCreate = location.pathname === '/corridas/solicitacoes/nova';
  const isRideTracking = location.pathname.includes('/acompanhamento');
  const isRideDetails = location.pathname.startsWith('/corridas/historico/') && !isRideTracking;

  const pageTitle = pageTitles[location.pathname] || (
    isContractDetails
      ? 'Visualizar Contrato'
      : isSupplierEdit
        ? 'Editar Fornecedor'
        : isSupplierDetails
          ? 'Visualizar Fornecedor'
          : isEmployeeEdit
            ? 'Editar Colaborador'
            : isEmployeeDetails
              ? 'Editar Permissões'
              : isBranchEdit
                ? 'Editar Filial'
                : isBranchDetails
                  ? 'Visualizar Filial'
                  : isRideReview
                    ? 'Revisar Solicitação'
                    : isRideCreate
                      ? 'Cadastrar Solicitação'
                      : isRideTracking
                        ? 'Acompanhamento da Corrida'
                        : isRideDetails
                          ? 'Detalhes da Corrida'
                          : location.pathname.startsWith('/terceiros/motoristas')
                            ? 'Motoristas'
                            : location.pathname.startsWith('/terceiros')
                              ? 'Terceiros'
                              : location.pathname.startsWith('/filiais')
                                ? 'Filiais'
                                : location.pathname.startsWith('/colaboradores')
                                  ? 'Colaboradores'
                                  : location.pathname.startsWith('/corridas')
                                    ? 'Corridas'
                                    : 'Dashboard'
  );

  const breadcrumbs = breadcrumbMap[location.pathname] ?? (
    isContractDetails
      ? [
          { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
          { label: 'Contratos', path: '/terceiros/contratos', icon: contratosIcon },
          { label: 'Visualizar Contrato', icon: contratosIcon },
        ]
      : isSupplierEdit
        ? [
            { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
            { label: 'Fornecedores', path: '/terceiros/fornecedores', icon: fornecedoresIcon },
            { label: 'Editar Fornecedor', icon: fornecedoresIcon },
          ]
        : isSupplierDetails
          ? [
              { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
              { label: 'Fornecedores', path: '/terceiros/fornecedores', icon: fornecedoresIcon },
              { label: 'Visualizar Fornecedor', icon: fornecedoresIcon },
            ]
          : isEmployeeEdit
            ? [
                { label: 'Colaboradores', path: '/colaboradores', icon: colaboradoresIcon },
                { label: 'Editar Colaborador', icon: colaboradoresIcon },
              ]
            : isEmployeeDetails
              ? [
                  { label: 'Colaboradores', path: '/colaboradores', icon: colaboradoresIcon },
                  { label: 'Editar Permissões', icon: colaboradoresIcon },
                ]
              : isBranchEdit
                ? [
                    { label: 'Filiais', path: '/filiais', icon: filiaisIcon },
                    { label: 'Editar Filial', icon: filiaisIcon },
                  ]
                : isBranchDetails
                  ? [
                      { label: 'Filiais', path: '/filiais', icon: filiaisIcon },
                      { label: 'Visualizar Filial', icon: filiaisIcon },
                    ]
                  : isRideReview
                    ? [
                        { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
                        { label: 'Solicitações', path: '/corridas/solicitacoes', icon: solicitacoesIcon },
                        { label: 'Revisar Solicitação', icon: solicitacoesIcon },
                      ]
                    : isRideCreate
                      ? [
                          { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
                          { label: 'Solicitações', path: '/corridas/solicitacoes', icon: solicitacoesIcon },
                          { label: 'Cadastrar Solicitação', icon: solicitacoesIcon },
                        ]
                      : isRideTracking
                        ? [
                            { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
                            { label: 'Acompanhamento', icon: corridasIcon },
                          ]
                        : isRideDetails
                          ? [
                              { label: 'Corridas', path: '/corridas/solicitacoes', icon: corridasIcon },
                              { label: 'Histórico', path: '/corridas/historico', icon: historicoIcon },
                              { label: 'Detalhes da Corrida', icon: historicoIcon },
                            ]
                          : location.pathname.startsWith('/terceiros/motoristas')
                            ? [
                                { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
                                { label: 'Motoristas', icon: colaboradoresIcon },
                              ]
                            : [
                                { label: pageTitle },
                              ]
  );

  const renderBreadcrumbContent = (item: BreadcrumbItem) => (
    <>
      <span className={styles.breadcrumbIcon} aria-hidden="true">
        {item.icon ? <img src={item.icon} alt="" /> : null}
      </span>
      <span>{item.label}</span>
    </>
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleGroup}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <ol className={styles.breadcrumbList}>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <li key={`${item.label}-${index}`} className={styles.breadcrumbItem}>
                    {item.path && !isLast ? (
                      <Link to={item.path} className={styles.breadcrumbLink}>
                        {renderBreadcrumbContent(item)}
                      </Link>
                    ) : (
                      <span className={isLast ? styles.breadcrumbCurrent : styles.breadcrumbText}>
                        {renderBreadcrumbContent(item)}
                      </span>
                    )}
                    {!isLast && (
                      <img
                        src={setaDireitaIcon}
                        alt=""
                        className={styles.breadcrumbSeparator}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>

        <div className={styles.actions}>
          <div className={styles.notificationsWrapper} ref={notificationsRef}>
            <button
              className={`${styles.iconButton} ${isNotificationsOpen ? styles.iconButtonActive : ''}`}
              type="button"
              aria-label="Notificações"
              aria-haspopup="dialog"
              aria-expanded={isNotificationsOpen}
              onClick={() => setIsNotificationsOpen((current) => !current)}
            >
              <img src={notificacoesIcon} alt="" className={styles.notificationIcon} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className={styles.notificationsPanel} role="dialog" aria-label="Notificações recentes">
                <div className={styles.notificationsHeader}>
                  <div>
                    <strong>Notificações</strong>
                    <span>{unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Todas as mensagens lidas'}</span>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" className={styles.markReadButton} onClick={handleMarkAllAsRead}>
                      Marcar como lidas
                    </button>
                  )}
                </div>

                <div className={styles.notificationsList}>
                  {isLoadingNotifications ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                      Carregando notificações...
                    </div>
                  ) : notificationsList.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                      Nenhuma notificação encontrada.
                    </div>
                  ) : (
                    notificationsList.map((notification) => {
                      const isUnread = !notification.lidaEm;
                      return (
                        <button
                          type="button"
                          className={styles.notificationItem}
                          key={notification.id}
                          onClick={() => isUnread && handleMarkAsRead(notification.id)}
                        >
                          <span className={`${styles.notificationDot} ${isUnread ? styles.notificationUnread : ''}`} />
                          <span className={styles.notificationContent}>
                            <strong>{notification.titulo}</strong>
                            <span>{notification.mensagem}</span>
                            <small>
                              {notification.criadaEm ? new Date(notification.criadaEm).toLocaleString('pt-BR') : ''}
                            </small>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.userMenuWrapper} ref={userMenuRef}>
            <button
              type="button"
              className={`${styles.userButton} ${isUserMenuOpen ? styles.userButtonActive : ''}`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="Perfil do usuário"
              aria-expanded={isUserMenuOpen}
            >
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar} aria-label={userName}>
                  {userInitials}
                </div>
                <span className={styles.onlineIndicator} />
              </div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>{userName}</p>
                <p className={styles.userEmail}>{userEmail}</p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className={styles.userDropdown} role="menu">
                <div className={styles.dropdownHeader}>
                  <strong className={styles.dropdownUserName}>{userName}</strong>
                  <span className={styles.dropdownUserEmail}>{userEmail}</span>
                  {user?.profile && (
                    <span className={styles.profileBadge}>{user.profile}</span>
                  )}
                </div>
                <div className={styles.dropdownDivider} />
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  role="menuitem"
                >
                  <img src={sairIcon} alt="" className={styles.dropdownItemIcon} />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLogoutModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setIsLogoutModalOpen(false)}>
          <div
            className={styles.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-logout-title"
            aria-describedby="header-logout-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalIcon} aria-hidden="true">
              <img src={sairIcon} alt="" style={{ width: 22, height: 22 }} />
            </div>

            <div className={styles.modalContent}>
              <h2 id="header-logout-title">Sair da plataforma?</h2>
              <p id="header-logout-description">Você será redirecionada para a tela de login.</p>
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
    </header>
  );
};
