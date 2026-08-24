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

const normalizeProfile = (p: string) => {
  const upper = p.toUpperCase();
  if (upper.includes('SOLICITANTE_EMERGENCIA')) return 'Solicitante de Emergência';
  if (upper.includes('SOLICITANTE')) return 'Solicitante';
  if (upper.includes('APROVADOR')) return 'Aprovador';
  if (upper.includes('MOTORISTA')) return 'Motorista';
  if (upper.includes('ADMIN_MASTER')) return 'Administrador Master';
  if (upper.includes('ADMIN_FILIAL')) return 'Administrador de Filial';
  return p;
};

interface EmployeeViewData {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  cargo: string;
  vinculoTipo: string;
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

    if (isNaN(numericId)) {
      setIsLoading(false);
      navigate('/colaboradores', { replace: true });
      return;
    }

    Promise.allSettled([
      collaboratorApi.list(),
      collaboratorApi.getProfiles(numericId),
      driverApi.getById(numericId),
    ])
      .then(([collabsRes, profilesRes, driverRes]) => {
        if (!isMounted) return;

        const collabs =
          collabsRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabsRes.value) : [];
        const matchedCollab = collabs.find((c) => Number(c.id) === numericId);

        let loadedProfiles: string[] = [];
        if (profilesRes.status === 'fulfilled' && profilesRes.value?.response?.perfis) {
          loadedProfiles = profilesRes.value.response.perfis.map((p) => normalizeProfile(p.tipoPerfil));
        }

        if (matchedCollab) {
          if (loadedProfiles.length === 0 && matchedCollab.perfis && matchedCollab.perfis.length > 0) {
            loadedProfiles = matchedCollab.perfis.map((p) => normalizeProfile(p.tipoPerfil));
          }

          setEmployee({
            id: matchedCollab.id,
            nome: matchedCollab.nome,
            email: matchedCollab.email,
            cpf: matchedCollab.cpf || null,
            cargo: matchedCollab.cargo || 'Colaborador',
            vinculoTipo: 'Filial',
            vinculoNome: matchedCollab.filialNome || (matchedCollab.filialId ? `Filial #${matchedCollab.filialId}` : 'Filial Londrina'),
            perfis: loadedProfiles,
          });
          return;
        }

        if (driverRes.status === 'fulfilled' && driverRes.value?.response) {
          const d: MotoristaDto = driverRes.value.response;
          setEmployee({
            id: d.id,
            nome: d.nome,
            email: d.email,
            cpf: d.cpf || null,
            cargo: 'Motorista Profissional',
            vinculoTipo: 'Fornecedor',
            vinculoNome: d.fornecedorNome || (d.fornecedorId ? `Fornecedor #${d.fornecedorId}` : 'Transportes Aurora'),
            perfis: ['Motorista'],
          });
          return;
        }

        showToast({
          type: 'error',
          title: 'Colaborador não encontrado',
          description: `O registro de ID #${employeeId} não existe no banco de dados.`,
        });
        navigate('/colaboradores', { replace: true });
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erro ao buscar colaborador';
        showToast({ type: 'error', title: msg });
        navigate('/colaboradores', { replace: true });
      })
      .finally(() => {
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
          submessage="Consultando perfil e permissões no servidor..."
        />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  const isSolicitante = employee.perfis.some((p) => p.toLowerCase().includes('solicitante'));
  const isAprovador = employee.perfis.some((p) => p.toLowerCase().includes('aprovador'));
  const isMotorista = employee.perfis.some((p) => p.toLowerCase().includes('motorista'));
  const isAdmin = employee.perfis.some((p) => p.toLowerCase().includes('administrador') || p.toLowerCase().includes('admin'));

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.employeeIdentity}>
          <span className={styles.avatar} aria-label={`Avatar de ${employee.nome}`}>
            {getInitials(employee.nome)}
          </span>
          <div>
            <span className={styles.eyebrow}>Visão Geral do Colaborador</span>
            <h2>{employee.nome}</h2>
            <p>{employee.email}</p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <StatusBadge status="aprovado" />
          <Button variant="outline" onClick={() => navigate(`/colaboradores/${employee.id}/editar`)}>
            Editar dados
          </Button>
          <Button variant="outline" onClick={() => navigate('/colaboradores')}>
            Voltar
          </Button>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Dados Cadastrais</h3>
                <p>Informações de registro e identificação institucional.</p>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span>CPF</span>
                <strong>{employee.cpf ? formatCpf(employee.cpf) : 'Não informado'}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Cargo</span>
                <strong>{employee.cargo}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Vínculo Institucional</span>
                <strong>{employee.vinculoTipo}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Unidade / Lotação</span>
                <strong>{employee.vinculoNome}</strong>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Permissões e Acessos</h3>
                <p>Funcionalidades disponíveis de acordo com os papéis do colaborador.</p>
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
                      <p>Permite solicitar viagens corporativas e acompanhar o status de atendimento.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Solicitar corrida</span>
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
                      <strong>Gestão e Aprovação de Despesas</strong>
                      <p>Permite aprovar ou reprovar solicitações de viagens e auditar centros de custo.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Aprovar solicitações</span>
                      <span>Gerenciar contratos</span>
                      <span>Auditoria</span>
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
                      <strong>Operação de Transporte</strong>
                      <p>Permite acessar corridas atribuídas pelo fornecedor e registrar o trajeto.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Corridas atribuídas</span>
                      <span>Atualizar execução</span>
                      <span>Navegação no mapa</span>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className={`${styles.permissionCard} ${styles.permissionEnabled}`}>
                  <div className={styles.permissionStatus} aria-hidden="true">
                    <CheckIcon width={18} height={18} />
                  </div>
                  <div className={styles.permissionContent}>
                    <div>
                      <strong>Administração Geral do Sistema</strong>
                      <p>Permite controle total sobre filiais, fornecedores, colaboradores e políticas.</p>
                    </div>
                    <div className={styles.permissionTags}>
                      <span>Gestão de filiais</span>
                      <span>Gestão de fornecedores</span>
                      <span>Controle de acessos</span>
                    </div>
                  </div>
                </div>
              )}

              {!isSolicitante && !isAprovador && !isMotorista && !isAdmin && (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
                  Nenhum perfil operacional ativo atribuído a este colaborador.
                </p>
              )}
            </div>
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Perfis Atribuídos</h3>
                <p>Papéis ativos no sistema.</p>
              </div>
            </div>

            <div className={styles.profileList}>
              {employee.perfis.length > 0 ? (
                employee.perfis.map((p) => (
                  <div key={p} className={styles.profileOption} style={{ padding: '0.75rem 1rem' }}>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{p}</strong>
                      <small style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Ativo no sistema</small>
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Nenhum perfil específico vinculado.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

