import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import styles from './Header.module.css';

const pageTitles: Record<string, string> = {
  '/visao-executiva': 'Visão Executiva',
  '/gastos': 'Gastos',
  '/preco-auditoria': 'Preço & Auditoria',
  '/corridas/solicitacoes': 'Solicitações de Corridas',
  '/corridas/calendario': 'Calendário de Corridas',
  '/corridas/historico': 'Histórico de Corridas',
  '/terceiros/fornecedores': 'Fornecedores',
  '/terceiros/contratos': 'Contratos',
  '/colaboradores': 'Colaboradores',
  '/filiais': 'Filiais',
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
  '/terceiros/contratos': [
    { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
    { label: 'Contratos', icon: contratosIcon },
  ],
  '/colaboradores': [
    { label: 'Colaboradores', icon: colaboradoresIcon, path: '/colaboradores' },
  ],
  '/filiais': [
    { label: 'Filiais', icon: filiaisIcon, path: '/filiais' },
  ],
};

import { notificationApi, type NotificacaoDto } from '../../../services';

export const Header = () => {
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificacaoDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
  const isContractDetails = location.pathname.startsWith('/terceiros/contratos/');
  const isSupplierDetails = location.pathname.startsWith('/terceiros/fornecedores/');
  const isEmployeeDetails = location.pathname.startsWith('/colaboradores/');
  const isRideReview = location.pathname.startsWith('/corridas/solicitacoes/') && location.pathname.endsWith('/revisar');
  const isRideCreate = location.pathname === '/corridas/solicitacoes/nova';
  const pageTitle = isContractDetails
    ? 'Visualizar Contrato'
    : isSupplierDetails
      ? 'Visualizar Fornecedor'
      : isEmployeeDetails
        ? 'Editar Permissões'
        : isRideReview
          ? 'Revisar Solicitação'
          : isRideCreate
            ? 'Cadastrar Solicitação'
            : pageTitles[location.pathname] || 'Dashboard';
  const breadcrumbs = isContractDetails
    ? [
        { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
        { label: 'Contratos', path: '/terceiros/contratos', icon: contratosIcon },
        { label: 'Visualizar Contrato', icon: contratosIcon },
      ]
    : isSupplierDetails
      ? [
          { label: 'Terceiros', path: '/terceiros/fornecedores', icon: terceirosIcon },
          { label: 'Fornecedores', path: '/terceiros/fornecedores', icon: fornecedoresIcon },
          { label: 'Visualizar Fornecedor', icon: fornecedoresIcon },
        ]
      : isEmployeeDetails
        ? [
            { label: 'Colaboradores', path: '/colaboradores', icon: colaboradoresIcon },
            { label: 'Editar Permissões', icon: colaboradoresIcon },
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
          : breadcrumbMap[location.pathname] ?? [
            { label: pageTitle },
          ];

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
        </div>
      </div>
    </header>
  );
};
