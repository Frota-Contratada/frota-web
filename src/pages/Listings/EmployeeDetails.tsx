import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { collaboratorApi, driverApi, extractListData, type ColaboradorDto, type MotoristaDto } from '../../services';
import { formatCpf, employees as defaultEmployees } from './listingsData';
import styles from './EmployeeDetails.module.css';

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toLocaleUpperCase('pt-BR');

interface EmployeeViewData {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  cargo: string;
  vinculoTipo: 'Filial' | 'Fornecedor';
  vinculoNome: string;
  perfis: string[];
}

export const EmployeeDetails = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<EmployeeViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const numericId = Number(employeeId);
    const mockEmployee = defaultEmployees.find((e) => String(e.id) === String(employeeId));

    Promise.allSettled([
      collaboratorApi.list(),
      !isNaN(numericId) ? driverApi.getById(numericId) : Promise.reject(),
      !isNaN(numericId) ? collaboratorApi.getProfiles(numericId) : Promise.reject(),
    ]).then(([collabsRes, driverRes, profilesRes]) => {
      if (!isMounted) return;

      const collabs = collabsRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabsRes.value) : [];

      if (driverRes.status === 'fulfilled' && driverRes.value?.response) {
        const d: MotoristaDto = driverRes.value.response;
        setEmployee({
          id: d.id,
          nome: d.nome,
          email: d.email,
          cpf: d.cpf,
          cargo: 'Motorista',
          vinculoTipo: 'Fornecedor',
          vinculoNome: `Fornecedor #${d.fornecedorId}`,
          perfis: ['Motorista'],
        });
        return;
      }

      const matchedCollab = collabs.find((c) => String(c.id) === String(employeeId));
      if (matchedCollab) {
        let loadedProfiles: string[] = [];
        if (profilesRes.status === 'fulfilled' && profilesRes.value?.response?.perfis) {
          loadedProfiles = profilesRes.value.response.perfis.map((p) => p.tipoPerfil);
        } else if (matchedCollab.perfis && matchedCollab.perfis.length > 0) {
          loadedProfiles = matchedCollab.perfis.map((p) => p.tipoPerfil);
        } else {
          loadedProfiles = ['Solicitante'];
        }

        setEmployee({
          id: matchedCollab.id,
          nome: matchedCollab.nome,
          email: matchedCollab.email,
          cpf: matchedCollab.cpf,
          cargo: 'Colaborador',
          vinculoTipo: 'Filial',
          vinculoNome: matchedCollab.filialNome || (matchedCollab.filialId ? `Filial #${matchedCollab.filialId}` : 'Matriz Seara'),
          perfis: loadedProfiles.length > 0 ? loadedProfiles : ['Solicitante'],
        });
        return;
      }

      if (mockEmployee) {
        setEmployee({
          id: mockEmployee.id,
          nome: mockEmployee.name,
          email: mockEmployee.email,
          cpf: mockEmployee.cpf,
          cargo: mockEmployee.role || 'Analista',
          vinculoTipo: mockEmployee.supplier ? 'Fornecedor' : 'Filial',
          vinculoNome: mockEmployee.supplier || mockEmployee.branch || 'Matriz Seara',
          perfis: mockEmployee.profiles || ['Solicitante'],
        });
        return;
      }

      showToast({ type: 'warning', title: 'Colaborador não localizado', description: 'Redirecionando para a listagem.' });
      navigate('/colaboradores', { replace: true });
    }).catch(() => {
      if (!isMounted) return;
      if (mockEmployee) {
        setEmployee({
          id: mockEmployee.id,
          nome: mockEmployee.name,
          email: mockEmployee.email,
          cpf: mockEmployee.cpf,
          cargo: mockEmployee.role || 'Analista',
          vinculoTipo: mockEmployee.supplier ? 'Fornecedor' : 'Filial',
          vinculoNome: mockEmployee.supplier || mockEmployee.branch || 'Matriz Seara',
          perfis: mockEmployee.profiles || ['Solicitante'],
        });
      } else {
        showToast({ type: 'error', title: 'Erro ao carregar colaborador' });
        navigate('/colaboradores', { replace: true });
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [employeeId, navigate, showToast]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="card"
          message="Carregando dados do colaborador"
          submessage="Consultando perfil e permissões..."
        />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const isSolicitante = employee.perfis.includes('Solicitante');
  const isAprovador = employee.perfis.includes('Aprovador');
  const isMotorista = employee.perfis.includes('Motorista');

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
                <strong>{employee.cargo}</strong>
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
              {isSolicitante && (
                <div className={`${styles.permissionCard} ${styles.permissionEnabled}`}>
                  <div className={styles.permissionStatus} aria-hidden="true">
                    <CheckIcon width={18} height={18} />
                  </div>
                  <div className={styles.permissionContent}>
                    <div>
                      <strong>Solicitação de Corridas</strong>
                      <p>Permite solicitar viagens corporativas e acompanhar status de atendimento.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Solicitar nova corrida</span>
                      <span>Histórico individual</span>
                      <span>Consultar itinerário</span>
                    </div>
                  </div>
                </div>
              )}

              {isAprovador && (
                <div className={`${styles.permissionCard} ${styles.permissionEnabled}`}>
                  <div className={styles.permissionStatus} aria-hidden="true">
                    <CheckIcon width={18} height={18} />
                  </div>
                  <div className={styles.permissionContent}>
                    <div>
                      <strong>Gestão e Aprovação</strong>
                      <p>Permite gerenciar solicitações, selecionar fornecedores e auditar custos.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Aprovar solicitações</span>
                      <span>Gerenciar contratos</span>
                      <span>Painel executivo</span>
                    </div>
                  </div>
                </div>
              )}

              {isMotorista && (
                <div className={`${styles.permissionCard} ${styles.permissionEnabled}`}>
                  <div className={styles.permissionStatus} aria-hidden="true">
                    <CheckIcon width={18} height={18} />
                  </div>
                  <div className={styles.permissionContent}>
                    <div>
                      <strong>Operação de transporte</strong>
                      <p>Permite acessar corridas vinculadas ao fornecedor e atualizar execução.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Visualizar corridas atribuídas</span>
                      <span>Atualizar execução</span>
                      <span>Itinerário no mapa</span>
                    </div>
                  </div>
                </div>
              )}
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
              {['Solicitante', 'Aprovador', 'Motorista'].map((p) => {
                const hasProfile = employee.perfis.includes(p);
                return (
                  <label key={p} className={styles.profileOption}>
                    <span>
                      <strong>{p}</strong>
                      <small>{hasProfile ? 'Perfil ativo' : 'Inativo'}</small>
                    </span>
                    <input type="checkbox" checked={hasProfile} readOnly aria-label={`Perfil ${p}`} />
                  </label>
                );
              })}
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
              <span>{employee.vinculoTipo}</span>
              <strong>{employee.vinculoNome}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

