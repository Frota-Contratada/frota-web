import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, LoadingState, Select, useToast } from '../../components/common';
import {
  collaboratorApi,
  driverApi,
  branchApi,
  costCenterApi,
  extractListData,
  type FilialDto,
  type CentroCustoDto,
  type ColaboradorDto,
  type MotoristaDto,
} from '../../services';
import { formatCpf } from './listingsData';
import styles from '../Rides/RideReview.module.css';
import localStyles from './EmployeeCreate.module.css';

const normalizeProfileName = (p: string): string => {
  const upper = p.toUpperCase();
  if (upper.includes('EMERGENCIA') || upper.includes('SOLICITANTE_EMERGENCIA')) return 'Solicitante de Emergência';
  if (upper.includes('APROVADOR')) return 'Aprovador';
  if (upper.includes('SOLICITANTE')) return 'Solicitante';
  if (upper.includes('ADMIN_MASTER')) return 'Administrador Master';
  if (upper.includes('ADMIN_FILIAL')) return 'Administrador de Filial';
  return p;
};

export const EmployeeEdit = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);
  const [costCentersList, setCostCentersList] = useState<CentroCustoDto[]>([]);
  const [initialProfiles, setInitialProfiles] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'Colaborador',
    branch: '',
    costCenterId: '',
    profiles: [] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    setIsInitialLoading(true);

    const numericId = Number(employeeId);

    Promise.allSettled([
      branchApi.list(),
      costCenterApi.list(),
      collaboratorApi.list(),
      !isNaN(numericId) ? collaboratorApi.getProfiles(numericId) : Promise.reject(),
    ]).then(([branchesRes, ccRes, collabsRes, profilesRes]) => {
      if (!isMounted) return;

      const branches = branchesRes.status === 'fulfilled' ? extractListData<FilialDto>(branchesRes.value) : [];
      const costCenters = ccRes.status === 'fulfilled' ? extractListData<CentroCustoDto>(ccRes.value) : [];
      const collabs = collabsRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabsRes.value) : [];

      setBranchesList(branches);
      setCostCentersList(costCenters);

      const matchedCollab = collabs.find((c) => Number(c.id) === numericId);
      let loadedProfiles: string[] = [];

      if (profilesRes.status === 'fulfilled' && profilesRes.value?.response?.perfis) {
        loadedProfiles = profilesRes.value.response.perfis.map((p) => normalizeProfileName(p.tipoPerfil));
      } else if (matchedCollab?.perfis && matchedCollab.perfis.length > 0) {
        loadedProfiles = matchedCollab.perfis.map((p) => normalizeProfileName(p.tipoPerfil));
      }

      setInitialProfiles(loadedProfiles);

      if (matchedCollab) {
        setForm({
          name: matchedCollab.nome || '',
          email: matchedCollab.email || '',
          cpf: matchedCollab.cpf ? formatCpf(matchedCollab.cpf) : '',
          role: matchedCollab.cargo || 'Colaborador',
          branch: matchedCollab.filialId ? String(matchedCollab.filialId) : (branches[0]?.id ? String(branches[0].id) : '1'),
          costCenterId: matchedCollab.centroCustoId ? String(matchedCollab.centroCustoId) : (costCenters[0]?.id ? String(costCenters[0].id) : '1'),
          profiles: loadedProfiles,
        });
        return;
      }

      showToast({ type: 'error', title: 'Colaborador não localizado', description: 'O registro não foi encontrado no servidor.' });
      navigate('/colaboradores', { replace: true });
    }).catch((err) => {
      if (!isMounted) return;
      const msg = err instanceof Error ? err.message : 'Erro ao consultar dados do colaborador';
      showToast({ type: 'error', title: 'Erro ao carregar colaborador', description: msg });
      navigate('/colaboradores', { replace: true });
    }).finally(() => {
      if (isMounted) setIsInitialLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [employeeId, navigate, showToast]);

  const branchOptions = branchesList.map((b) => ({ label: `${b.nome} (${b.cnpj})`, value: String(b.id) }));
  const costCenterOptions = costCentersList.map((c) => ({ label: `${c.nome} ${c.codigo ? `(${c.codigo})` : ''}`, value: String(c.id) }));

  const updateField = (field: keyof typeof form, value: unknown) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleProfileToggle = (profileName: string) => {
    setForm((current) => {
      const isSelected = current.profiles.includes(profileName);
      const next = isSelected
        ? current.profiles.filter((p) => p !== profileName)
        : [...current.profiles, profileName];

      return { ...current, profiles: next };
    });
    setValidationErrors((current) => ({ ...current, profiles: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (form.profiles.length === 0) {
      errors.profiles = 'Selecione pelo menos um perfil de acesso para o colaborador';
    }
    if (!form.branch) {
      errors.branch = 'Selecione uma filial';
    }
    if (!form.costCenterId) {
      errors.costCenterId = 'Selecione um centro de custo';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, revise os campos do formulário.' });
      return;
    }

    try {
      setIsLoading(true);
      const numericId = Number(employeeId);

      if (!isNaN(numericId)) {
        const filialId = Number(form.branch) || 1;
        const centroCustoId = Number(form.costCenterId) || 1;

        const promises: Promise<unknown>[] = [];

        if (form.profiles.includes('Solicitante')) {
          promises.push(collaboratorApi.turnSolicitante(numericId, { filialId, centroCustoId }));
        }
        if (form.profiles.includes('Aprovador')) {
          promises.push(collaboratorApi.turnAprovador(numericId, { filialId, centroCustoId }));
        }
        if (form.profiles.includes('Solicitante de Emergência')) {
          promises.push(collaboratorApi.turnSolicitanteEmergencia(numericId, { filialId, centroCustoId }));
        }

        await Promise.allSettled(promises);
      }

      showToast({
        type: 'success',
        title: 'Perfis atualizados com sucesso',
        description: `Os papéis e acessos de ${form.name} foram sincronizados no backend.`,
      });
      navigate(`/colaboradores/${employeeId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar alterações';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="card"
          message="Carregando dados do colaborador"
          submessage="Preparando formulário de edição..."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Gerenciar Perfis de Acesso — {form.name || 'Colaborador'}</h2>
          <p>Alterne os papéis operacionais e vincule a filial e centro de custo deste profissional.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais (Identificação)</h3>
              <p>Informações de registro corporativo do profissional (somente leitura).</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome completo"
              value={form.name}
              disabled
            />

            <Input
              label="Email corporativo"
              type="email"
              value={form.email}
              disabled
            />

            <Input
              label="CPF"
              value={form.cpf}
              disabled
            />

            <Input
              label="Cargo"
              value={form.role}
              disabled
            />
          </div>

          <div className={localStyles.divider} />

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Alocação Operacional</h3>
              <p>Defina a filial e o centro de custo aos quais as permissões estarão vinculadas.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            {branchOptions.length > 0 && (
              <Select
                label="Filial de vinculação"
                value={form.branch}
                options={branchOptions}
                onChange={(val) => updateField('branch', val)}
                required
              />
            )}

            {costCenterOptions.length > 0 && (
              <Select
                label="Centro de custo"
                value={form.costCenterId}
                options={costCenterOptions}
                onChange={(val) => updateField('costCenterId', val)}
                required
              />
            )}
          </div>

          <div className={localStyles.divider} />

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Perfis de Acesso do Colaborador</h3>
              <p>Clique sobre os perfis para atribuir ou remover funções na plataforma.</p>
            </div>
          </div>

          <div className={localStyles.profilesSection}>
            <div className={localStyles.currentProfilesBar}>
              <span>Perfis cadastrados atualmente no sistema:</span>
              {initialProfiles.length > 0 ? (
                initialProfiles.map((p) => (
                  <span key={p} className={`${localStyles.profileStatusBadge} ${localStyles.badgeActive}`}>
                    {p}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Nenhum perfil atribuído</span>
              )}
            </div>

            <div className={localStyles.profilesGrid}>
              {[
                { id: 'Solicitante', title: 'Solicitante', desc: 'Pode solicitar corridas corporativas e consultar o próprio histórico.' },
                { id: 'Aprovador', title: 'Aprovador', desc: 'Permite gerenciar solicitações, escolher fornecedores e auditar despesas.' },
                { id: 'Solicitante de Emergência', title: 'Solicitante de Emergência', desc: 'Permite solicitar viagens emergenciais de atendimento imediato.' },
              ].map((p) => {
                const hadInitially = initialProfiles.includes(p.id);
                const isSelected = form.profiles.includes(p.id);

                let badgeLabel = 'Não atribuído';
                let badgeClass = localStyles.badgeInactive;

                if (hadInitially && isSelected) {
                  badgeLabel = 'Ativo';
                  badgeClass = localStyles.badgeActive;
                } else if (!hadInitially && isSelected) {
                  badgeLabel = '+ Atribuir';
                  badgeClass = localStyles.badgeAdding;
                } else if (hadInitially && !isSelected) {
                  badgeLabel = '- Remover';
                  badgeClass = localStyles.badgeRemoving;
                }

                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${localStyles.profileOption} ${isSelected ? localStyles.profileSelected : ''}`}
                    onClick={() => handleProfileToggle(p.id)}
                    disabled={isLoading}
                  >
                    <div className={localStyles.profileOptionHeader}>
                      <div className={localStyles.profileOptionHeaderLeft}>
                        <span className={localStyles.checkboxControl} aria-hidden="true" />
                        <strong>{p.title}</strong>
                      </div>
                      <span className={`${localStyles.profileStatusBadge} ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <span className={localStyles.profileOptionDesc}>{p.desc}</span>
                  </button>
                );
              })}
            </div>
            {validationErrors.profiles && (
              <p className={localStyles.errorAlert} role="alert">{validationErrors.profiles}</p>
            )}
          </div>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Alterações</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/colaboradores/${employeeId}`)}
                disabled={isLoading}
              >
                Voltar
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

