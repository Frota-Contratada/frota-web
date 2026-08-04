import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import { Button, StatusBadge } from '../../components/common';
import { employees, formatCpf } from './listingsData';
import styles from './EmployeeDetails.module.css';

const permissionGroups = [
  {
    title: 'Solicitações de corrida',
    description: 'Permite solicitar, acompanhar e visualizar corridas corporativas.',
    permissions: ['Criar solicitação', 'Consultar histórico', 'Cancelar solicitação própria'],
    profiles: ['Solicitante', 'Aprovador'],
  },
  {
    title: 'Aprovação e revisão',
    description: 'Permite revisar dados, selecionar fornecedor e aprovar/reprovar solicitações.',
    permissions: ['Revisar solicitação', 'Aprovar corrida', 'Reprovar corrida'],
    profiles: ['Aprovador'],
  },
  {
    title: 'Operação de fornecedor',
    description: 'Permite acessar corridas vinculadas ao fornecedor e atualizar execução.',
    permissions: ['Visualizar corridas atribuídas', 'Atualizar execução', 'Consultar contrato'],
    profiles: ['Motorista'],
  },
];

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toLocaleUpperCase('pt-BR');

export const EmployeeDetails = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const employee = employees.find((item) => item.id === Number(employeeId));

  if (!employee) {
    return <Navigate to="/colaboradores" replace />;
  }

  const activePermissionGroups = permissionGroups.map((group) => ({
    ...group,
    enabled: group.profiles.some((profile) => employee.profiles.includes(profile)),
  }));

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.employeeIdentity}>
          <span className={styles.avatar} aria-label={`Avatar de ${employee.name}`}>{getInitials(employee.name)}</span>
          <div>
            <span className={styles.eyebrow}>Visão geral do colaborador</span>
            <h2>{employee.name}</h2>
            <p>{employee.email}</p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <StatusBadge status={employee.status} />
          <Button variant="outline" onClick={() => navigate('/colaboradores')}>Voltar</Button>
          <Button>Salvar alterações</Button>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Dados cadastrais</h3>
                <p>Informações usadas para identificar o colaborador na plataforma.</p>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>CPF</span>
                <strong>{formatCpf(employee.cpf)}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Cargo</span>
                <strong>{employee.role ?? 'Não informado'}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Código Seara</span>
                <strong>{employee.searaCode ?? 'Não informado'}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Disponibilidade</span>
                <strong>{employee.available ? 'Disponível' : 'Indisponível'}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Ativado em</span>
                <strong>{employee.activatedAt}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Desativado em</span>
                <strong>{employee.deactivatedAt ?? '—'}</strong>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Permissões</h3>
                <p>Visão geral das permissões liberadas conforme os perfis vinculados.</p>
              </div>
            </div>

            <div className={styles.permissionList}>
              {activePermissionGroups.map((group) => (
                <div className={`${styles.permissionCard} ${group.enabled ? styles.permissionEnabled : ''}`} key={group.title}>
                  <div className={styles.permissionStatus} aria-hidden="true">
                    {group.enabled ? <CheckIcon width={18} height={18} /> : <ErroIcon width={16} height={16} />}
                  </div>
                  <div className={styles.permissionContent}>
                    <div>
                      <strong>{group.title}</strong>
                      <p>{group.description}</p>
                    </div>
                    <div className={styles.permissionTags}>
                      {group.permissions.map((permission) => (
                        <span key={permission}>{permission}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Perfis vinculados</h3>
                <p>Controle os papéis do usuário na plataforma.</p>
              </div>
            </div>

            <div className={styles.profileList}>
              {['Solicitante', 'Aprovador', 'Motorista'].map((profile) => {
                const isActive = employee.profiles.includes(profile);

                return (
                  <label className={styles.profileOption} key={profile}>
                    <span>
                      <strong>{profile}</strong>
                      <small>{isActive ? 'Perfil ativo' : 'Perfil não vinculado'}</small>
                    </span>
                    <input type="checkbox" checked={isActive} readOnly aria-label={`Perfil ${profile}`} />
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Vínculo</h3>
                <p>Origem operacional do colaborador.</p>
              </div>
            </div>

            <div className={styles.linkBox}>
              <span>Filial</span>
              <strong>{employee.branch ?? '—'}</strong>
            </div>
            <div className={styles.linkBox}>
              <span>Fornecedor</span>
              <strong>{employee.supplier ?? '—'}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
