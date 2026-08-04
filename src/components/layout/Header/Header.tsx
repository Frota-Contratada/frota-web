import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import homeIcon from '../../../assets/icons/home.svg';
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
  '/home': 'Home',
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
  '/home': [{ label: 'Home', icon: homeIcon }],
  '/visao-executiva': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Dashboards', icon: dashboardsIcon },
    { label: 'Visão Executiva', icon: alvoIcon },
  ],
  '/gastos': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Dashboards', icon: dashboardsIcon },
    { label: 'Gastos', icon: gastosIcon },
  ],
  '/preco-auditoria': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Dashboards', icon: dashboardsIcon },
    { label: 'Preço & Auditoria', icon: precoAuditoriaIcon },
  ],
  '/corridas/solicitacoes': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Corridas', icon: corridasIcon },
    { label: 'Solicitações', icon: solicitacoesIcon },
  ],
  '/corridas/calendario': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Corridas', icon: corridasIcon },
    { label: 'Calendário', icon: calendarioIcon },
  ],
  '/corridas/historico': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Corridas', icon: corridasIcon },
    { label: 'Histórico', icon: historicoIcon },
  ],
  '/terceiros/fornecedores': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Terceiros', icon: terceirosIcon },
    { label: 'Fornecedores', icon: fornecedoresIcon },
  ],
  '/terceiros/contratos': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Terceiros', icon: terceirosIcon },
    { label: 'Contratos', icon: contratosIcon },
  ],
  '/colaboradores': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Colaboradores', icon: colaboradoresIcon },
  ],
  '/filiais': [
    { label: 'Home', path: '/home', icon: homeIcon },
    { label: 'Filiais', icon: filiaisIcon },
  ],
};

const notifications = [
  {
    id: 1,
    title: 'Nova solicitação de corrida',
    description: 'Rafael Mendes solicitou uma corrida operacional.',
    time: 'Agora',
    unread: true,
  },
  {
    id: 2,
    title: 'Contrato próximo do vencimento',
    description: 'Mobilidade Prime possui contrato vencendo em 15 dias.',
    time: '1h atrás',
    unread: true,
  },
  {
    id: 3,
    title: 'Fornecedor aprovado',
    description: 'Transporte Executivo BR foi aprovado para novas corridas.',
    time: 'Ontem',
    unread: false,
  },
];

export const Header = () => {
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
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
            : pageTitles[location.pathname] || 'Home';
  const breadcrumbs = isContractDetails
    ? [
        { label: 'Home', path: '/home', icon: homeIcon },
        { label: 'Terceiros', icon: terceirosIcon },
        { label: 'Contratos', path: '/terceiros/contratos', icon: contratosIcon },
        { label: 'Visualizar Contrato', icon: contratosIcon },
      ]
    : isSupplierDetails
      ? [
          { label: 'Home', path: '/home', icon: homeIcon },
          { label: 'Terceiros', icon: terceirosIcon },
          { label: 'Fornecedores', path: '/terceiros/fornecedores', icon: fornecedoresIcon },
          { label: 'Visualizar Fornecedor', icon: fornecedoresIcon },
        ]
      : isEmployeeDetails
        ? [
            { label: 'Home', path: '/home', icon: homeIcon },
            { label: 'Colaboradores', path: '/colaboradores', icon: colaboradoresIcon },
            { label: 'Editar Permissões', icon: colaboradoresIcon },
          ]
        : isRideReview
        ? [
            { label: 'Home', path: '/home', icon: homeIcon },
            { label: 'Corridas', icon: corridasIcon },
            { label: 'Solicitações', path: '/corridas/solicitacoes', icon: solicitacoesIcon },
            { label: 'Revisar Solicitação', icon: solicitacoesIcon },
          ]
        : isRideCreate
          ? [
              { label: 'Home', path: '/home', icon: homeIcon },
              { label: 'Corridas', icon: corridasIcon },
              { label: 'Solicitações', path: '/corridas/solicitacoes', icon: solicitacoesIcon },
              { label: 'Cadastrar Solicitação', icon: solicitacoesIcon },
            ]
          : breadcrumbMap[location.pathname] ?? [
            { label: 'Home', path: '/home', icon: homeIcon },
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
              <span className={styles.badge}>3</span>
            </button>

            {isNotificationsOpen && (
              <div className={styles.notificationsPanel} role="dialog" aria-label="Notificações recentes">
                <div className={styles.notificationsHeader}>
                  <div>
                    <strong>Notificações</strong>
                    <span>3 atualizações recentes</span>
                  </div>
                  <button type="button" className={styles.markReadButton}>Marcar como lidas</button>
                </div>

                <div className={styles.notificationsList}>
                  {notifications.map((notification) => (
                    <button type="button" className={styles.notificationItem} key={notification.id}>
                      <span className={`${styles.notificationDot} ${notification.unread ? styles.notificationUnread : ''}`} />
                      <span className={styles.notificationContent}>
                        <strong>{notification.title}</strong>
                        <span>{notification.description}</span>
                        <small>{notification.time}</small>
                      </span>
                    </button>
                  ))}
                </div>

                <button type="button" className={styles.viewAllButton}>Ver todas as notificações</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
