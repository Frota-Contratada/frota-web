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

export const EmployeeEdit = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);
  const [costCentersList, setCostCentersList] = useState<CentroCustoDto[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'Colaborador',
    branch: '',
    costCenterId: '1',
    profiles: ['Solicitante'] as string[],
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
      !isNaN(numericId) ? driverApi.getById(numericId) : Promise.reject(),
      !isNaN(numericId) ? collaboratorApi.getProfiles(numericId) : Promise.reject(),
    ]).then(([branchesRes, ccRes, collabsRes, driverRes, profilesRes]) => {
      if (!isMounted) return;

      const branches = branchesRes.status === 'fulfilled' ? extractListData<FilialDto>(branchesRes.value) : [];
      const costCenters = ccRes.status === 'fulfilled' ? extractListData<CentroCustoDto>(ccRes.value) : [];
      const collabs = collabsRes.status === 'fulfilled' ? extractListData<ColaboradorDto>(collabsRes.value) : [];

      setBranchesList(branches);
      setCostCentersList(costCenters);

      if (driverRes.status === 'fulfilled' && driverRes.value?.response) {
        const d: MotoristaDto = driverRes.value.response;
        setForm({
          name: d.nome || '',
          email: d.email || '',
          cpf: d.cpf ? formatCpf(d.cpf) : '',
          role: 'Motorista',
          branch: branches[0]?.id ? String(branches[0].id) : '1',
          costCenterId: costCenters[0]?.id ? String(costCenters[0].id) : '1',
          profiles: ['Motorista'],
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

        setForm({
          name: matchedCollab.nome || '',
          email: matchedCollab.email || '',
          cpf: matchedCollab.cpf ? formatCpf(matchedCollab.cpf) : '',
          role: 'Colaborador',
          branch: matchedCollab.filialId ? String(matchedCollab.filialId) : (branches[0]?.id ? String(branches[0].id) : '1'),
          costCenterId: matchedCollab.centroCustoId ? String(matchedCollab.centroCustoId) : (costCenters[0]?.id ? String(costCenters[0].id) : '1'),
          profiles: loadedProfiles.length > 0 ? loadedProfiles : ['Solicitante'],
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

  const handleProfileChange = (profile: string) => {
    setForm((current) => {
      const active = current.profiles.includes(profile);
      const next = active
        ? current.profiles.filter((p) => p !== profile)
        : [...current.profiles, profile];

      return { ...current, profiles: next };
    });
    setValidationErrors((current) => ({ ...current, profiles: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (form.profiles.length === 0) {
      errors.profiles = 'Selecione pelo menos um perfil de acesso';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, selecione pelo menos um perfil.' });
      return;
    }

    try {
      setIsLoading(true);
      const numericId = Number(employeeId);

      if (!isNaN(numericId)) {
        const filialId = Number(form.branch) || 1;
        const centroCustoId = Number(form.costCenterId) || 1;

        if (form.profiles.includes('Solicitante')) {
          await collaboratorApi.turnSolicitante(numericId, { filialId, centroCustoId }).catch(() => {});
        }
        if (form.profiles.includes('Aprovador')) {
          await collaboratorApi.turnAprovador(numericId, { filialId, centroCustoId }).catch(() => {});
        }
      }

      showToast({
        type: 'success',
        title: 'Perfis de acesso atualizados',
        description: `Os perfis de ${form.name} foram sincronizados com sucesso.`,
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
              <p>Determine quais funções o colaborador poderá desempenhar na plataforma.</p>
            </div>
          </div>

          <div className={localStyles.profilesSection}>
            <div className={localStyles.profilesGrid}>
              {[
                { id: 'Solicitante', title: 'Solicitante', desc: 'Pode solicitar corridas corporativas e consultar o próprio histórico.' },
                { id: 'Aprovador', title: 'Aprovador', desc: 'Permite gerenciar solicitações, escolher fornecedores e auditar corridas.' },
                { id: 'Motorista', title: 'Motorista', desc: 'Permite acessar corridas vinculadas e atualizar a execução em tempo real.' },
              ].map((p) => {
                const isSelected = form.profiles.includes(p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${localStyles.profileOption} ${isSelected ? localStyles.profileSelected : ''}`}
                    onClick={() => handleProfileChange(p.id)}
                    disabled={isLoading}
                  >
                    <span className={localStyles.profileOptionHeader}>
                      <span className={localStyles.checkboxControl} aria-hidden="true" />
                      <strong>{p.title}</strong>
                    </span>
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

