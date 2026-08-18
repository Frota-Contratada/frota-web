import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import { Button, StatusBadge, useToast } from '../../components/common';
import { driverApi, type MotoristaDto } from '../../services';
import { formatCpf } from './listingsData';
import styles from './EmployeeDetails.module.css';

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
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<MotoristaDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employeeId && !isNaN(Number(employeeId))) {
      driverApi
        .getById(Number(employeeId))
        .then((res) => {
          if (res.response) {
            setEmployee(res.response);
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Erro ao carregar colaborador';
          showToast({ type: 'error', title: message });
          navigate('/colaboradores');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      navigate('/colaboradores');
    }
  }, [employeeId, navigate, showToast]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Carregando dados do colaborador...</p>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.employeeIdentity}>
          <span className={styles.avatar} aria-label={`Avatar de ${employee.nome}`}>{getInitials(employee.nome)}</span>
          <div>
            <span className={styles.eyebrow}>Visão geral do colaborador</span>
            <h2>{employee.nome}</h2>
            <p>{employee.email}</p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <StatusBadge status="aprovado" />
          <Button variant="outline" onClick={() => navigate(`/colaboradores/${employee.id}/editar`)}>Editar dados cadastrais</Button>
          <Button variant="outline" onClick={() => navigate('/colaboradores')}>Voltar</Button>
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
                <strong>Motorista</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Disponibilidade</span>
                <strong>Disponível</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Situação Operacional</span>
                <strong>Ativo na plataforma</strong>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Permissões do Perfil</h3>
                <p>Visão geral das permissões liberadas conforme os perfis vinculados.</p>
              </div>
            </div>

            <div className={styles.permissionList}>
              <div className={`${styles.permissionCard} ${styles.permissionEnabled}`}>
                <div className={styles.permissionStatus} aria-hidden="true">
                  <CheckIcon width={18} height={18} />
                </div>
                <div className={styles.permissionContent}>
                  <div>
                    <strong>Operação de fornecedor / Transporte</strong>
                    <p>Permite acessar corridas vinculadas ao fornecedor e atualizar execução.</p>
                  </div>
                  <div className={styles.permissionTags}>
                    <span>Visualizar corridas atribuídas</span>
                    <span>Atualizar execução</span>
                    <span>Consultar itinerário</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Perfis vinculados</h3>
                <p>Papéis do usuário na plataforma.</p>
              </div>
            </div>

            <div className={styles.profileList}>
              <label className={styles.profileOption}>
                <span>
                  <strong>Motorista</strong>
                  <small>Perfil ativo</small>
                </span>
                <input type="checkbox" checked readOnly aria-label="Perfil Motorista" />
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Vínculo Operacional</h3>
                <p>Origem operacional do colaborador.</p>
              </div>
            </div>

            <div className={styles.linkBox}>
              <span>Fornecedor ID</span>
              <strong>Fornecedor #{employee.fornecedorId}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
