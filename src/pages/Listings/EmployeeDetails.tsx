import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import { Button, LoadingState, StatusBadge, useToast } from '../../components/common';
import { collaboratorApi, driverApi, extractListData, type ColaboradorDto, type MotoristaDto } from '../../services';
import styles from './EmployeeDetails.module.css';

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toLocaleUpperCase('pt-BR');

interface ProfileInfo {
  key: string;
  title: string;
  badge: string;
  description: string;
}

const getProfileDetails = (raw: string): ProfileInfo => {
  const upper = raw.toUpperCase();
  if (upper.includes('EMERGENCIA') || upper.includes('SOLICITANTE_EMERGENCIA')) {
    return {
      key: 'emergencia',
      title: 'Solicitante de Emergência',
      badge: 'Plantão',
      description: 'Autorizado para abertura de corridas imediatas em situações de urgência.',
    };
  }
  if (upper.includes('APROVADOR')) {
    return {
      key: 'aprovador',
      title: 'Aprovador de Despesas',
      badge: 'Gestão Financeira',
      description: 'Validação e autorização de solicitações de viagens por centro de custo.',
    };
  }
  if (upper.includes('ADMIN_MASTER') || upper.includes('ADMIN-MASTER') || upper.includes('ADMINISTRADOR MASTER')) {
    return {
      key: 'admin-master',
      title: 'Administrador Master',
      badge: 'Acesso Global',
      description: 'Gestão integral sobre filiais, fornecedores, contratos e usuários.',
    };
  }
  if (upper.includes('ADMIN_FILIAL') || upper.includes('ADMIN-FILIAL') || upper.includes('ADMINISTRADOR DE FILIAL')) {
    return {
      key: 'admin-filial',
      title: 'Administrador de Filial',
      badge: 'Gestão de Unidade',
      description: 'Supervisão operacional, gestão de colaboradores e contratos da filial.',
    };
  }
  if (upper.includes('ADMIN_FORNECEDOR') || upper.includes('ADMIN-FORNECEDOR') || upper.includes('ADMINISTRADOR DE FORNECEDOR')) {
    return {
      key: 'admin-fornecedor',
      title: 'Administrador de Fornecedor',
      badge: 'Parceiro',
      description: 'Gestor externo responsável pela frota e motoristas credenciados.',
    };
  }
  if (upper.includes('MOTORISTA')) {
    return {
      key: 'motorista',
      title: 'Motorista Credenciado',
      badge: 'Operação',
      description: 'Condutor credenciado para atendimento de rotas corporativas.',
    };
  }
  return {
    key: 'solicitante',
    title: 'Solicitante Corporativo',
    badge: 'Passageiro',
    description: 'Abertura de solicitações de viagens e acompanhamento de itinerários.',
  };
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
          loadedProfiles = profilesRes.value.response.perfis.map((p) => p.tipoPerfil);
        }

        if (matchedCollab) {
          if (loadedProfiles.length === 0 && matchedCollab.perfis && matchedCollab.perfis.length > 0) {
            loadedProfiles = matchedCollab.perfis.map((p) => p.tipoPerfil);
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

  const uniqueProfiles = useMemo(() => {
    if (!employee?.perfis) return [];
    const map = new Map<string, ProfileInfo>();
    for (const raw of employee.perfis) {
      const info = getProfileDetails(raw);
      map.set(info.key, info);
    }
    return Array.from(map.values());
  }, [employee?.perfis]);

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

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.employeeIdentity}>
          <span className={styles.avatar} aria-label={`Avatar de ${employee.nome}`}>
            {getInitials(employee.nome)}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2>{employee.nome}</h2>
              <StatusBadge status="aprovado" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
              <span>{employee.email}</span>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button onClick={() => navigate(`/colaboradores/${employee.id}/editar`)}>
            Gerenciar Perfis
          </Button>
          <Button variant="outline" onClick={() => navigate('/colaboradores')}>
            Voltar para Colaboradores
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
                <span>Nome Completo</span>
                <strong>{employee.nome}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>E-mail Corporativo</span>
                <strong>{employee.email}</strong>
              </div>
              <div className={styles.infoItem}>
                <span>Cargo / Função</span>
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
              <div className={styles.infoItem}>
                <span>Situação Cadastral</span>
                <strong style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className={styles.activeDot} /> Ativo e Habilitado
                </strong>
              </div>
            </div>
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Perfis Atribuídos</h3>
                <p>Papéis ativos e escopo de responsabilidade.</p>
              </div>
            </div>

            <div className={styles.profileList}>
              {uniqueProfiles.length > 0 ? (
                uniqueProfiles.map((p) => (
                  <div key={p.key} className={styles.profileCard}>
                    <div className={styles.profileCardIcon}>
                      <CheckIcon width={16} height={16} />
                    </div>
                    <div className={styles.profileCardBody}>
                      <div className={styles.profileCardTitleRow}>
                        <strong className={styles.profileCardTitle}>{p.title}</strong>
                        <span className={styles.profileBadge}>{p.badge}</span>
                      </div>
                      <span className={styles.profileCardDesc}>{p.description}</span>
                    </div>
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



