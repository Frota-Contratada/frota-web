import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, LoadingState, Select, useToast } from '../../../components/common';
import {
  collaboratorApi,
  branchApi,
  costCenterApi,
  extractListData,
  type FilialDto,
  type CentroCustoDto,
  type ColaboradorDto,
} from '../../../services';
import styles from '../../Rides/Review/RideReview.module.css';
import localStyles from './EmployeeEdit.module.css';

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

      const branchIdFromCollab = (profilesRes.status === 'fulfilled' && profilesRes.value?.response?.filialId)
        ? profilesRes.value.response.filialId
        : matchedCollab?.filialId;

      const ccIdFromCollab = (profilesRes.status === 'fulfilled' && profilesRes.value?.response?.centroCustoId)
        ? profilesRes.value.response.centroCustoId
        : matchedCollab?.centroCustoId;

      if (matchedCollab) {
        const branchVal = branchIdFromCollab ? String(branchIdFromCollab) : (branches[0]?.id ? String(branches[0].id) : '1');
        const availableCcs = costCenters.filter((c) => String(c.filialId) === branchVal);
        const ccVal = ccIdFromCollab
          ? String(ccIdFromCollab)
          : (availableCcs[0] ? String(availableCcs[0].id ?? availableCcs[0].numero) : '');

        if (branchVal && availableCcs.length === 0 && !isNaN(Number(branchVal))) {
          costCenterApi.list({ filialId: Number(branchVal) }).then((res) => {
            const list = extractListData<CentroCustoDto>(res);
            if (list.length > 0) {
              setCostCentersList((prev) => {
                const existingKeys = new Set(prev.map((c) => `${c.filialId}-${c.id ?? c.numero}`));
                const toAdd = list.filter((c) => !existingKeys.has(`${c.filialId}-${c.id ?? c.numero}`));
                return [...prev, ...toAdd];
              });
              setForm((current) => {
                if (current.branch === branchVal && !current.costCenterId) {
                  return { ...current, costCenterId: String(list[0].id ?? list[0].numero) };
                }
                return current;
              });
            }
          }).catch(() => {});
        }

        setForm({
          name: matchedCollab.nome || '',
          email: matchedCollab.email || '',
          role: matchedCollab.cargo || 'Colaborador',
          branch: branchVal,
          costCenterId: ccVal,
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

  const selectedBranchId = Number(form.branch) || 1;
  const filteredCostCenters = useMemo(() => {
    return costCentersList.filter((c) => Number(c.filialId) === selectedBranchId);
  }, [costCentersList, selectedBranchId]);

  const costCenterOptions = useMemo(() => {
    const options = filteredCostCenters.map((c) => {
      const ccId = c.id ?? c.numero;
      const displayNum = c.numero ?? c.id;
      return {
        label: `${c.nome} (Nº ${displayNum})${c.temAprovador ? ' — Com Aprovador' : ' — Sem Aprovador'}`,
        value: String(ccId),
      };
    });

    if (form.costCenterId && !options.some((o) => o.value === String(form.costCenterId))) {
      options.unshift({
        label: `Centro de Custo Nº ${form.costCenterId}`,
        value: String(form.costCenterId),
      });
    }

    return options;
  }, [filteredCostCenters, form.costCenterId]);

  const updateField = (field: keyof typeof form, value: unknown) => {
    if (field === 'branch') {
      const newBranchId = Number(value);
      const branchCcs = costCentersList.filter((c) => Number(c.filialId) === newBranchId);
      const nextCc = branchCcs[0] ? String(branchCcs[0].id ?? branchCcs[0].numero) : '';
      setForm((current) => ({ ...current, branch: String(value), costCenterId: nextCc }));
      if (branchCcs.length === 0 && !isNaN(newBranchId)) {
        costCenterApi.list({ filialId: newBranchId }).then((res) => {
          const list = extractListData<CentroCustoDto>(res);
          if (list.length > 0) {
            setCostCentersList((prev) => {
              const existingKeys = new Set(prev.map((c) => `${c.filialId}-${c.id ?? c.numero}`));
              const toAdd = list.filter((c) => !existingKeys.has(`${c.filialId}-${c.id ?? c.numero}`));
              return [...prev, ...toAdd];
            });
            setForm((current) => {
              if (current.branch === String(value) && !current.costCenterId) {
                return { ...current, costCenterId: String(list[0].id ?? list[0].numero) };
              }
              return current;
            });
          }
        }).catch(() => {});
      }
    } else {
      setForm((current) => ({ ...current, [field]: value }));
    }
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleProfileToggle = (profileName: string) => {
    setForm((current) => {
      const isSelected = current.profiles.includes(profileName);
      let next: string[];

      if (isSelected) {
        next = current.profiles.filter((p) => p !== profileName);
        if (profileName === 'Solicitante') {
          next = next.filter((p) => p !== 'Solicitante de Emergência');
        }
      } else {
        next = [...current.profiles, profileName];
        if (profileName === 'Solicitante de Emergência' && !next.includes('Solicitante')) {
          next.push('Solicitante');
          showToast({
            type: 'info',
            title: 'Perfil vinculado',
            description: 'O perfil de Solicitante foi selecionado automaticamente, pois é requisito para Solicitante de Emergência.',
          });
        }
      }

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
        const centroCustoId = Number(form.costCenterId);

        if (!centroCustoId || isNaN(centroCustoId)) {
          showToast({
            type: 'error',
            title: 'Centro de custo inválido',
            description: 'Por favor, selecione um centro de custo válido.',
          });
          return;
        }

        if (form.profiles.includes('Aprovador')) {
          await collaboratorApi.turnAprovador(numericId, { filialId, centroCustoId });
        }

        if (form.profiles.includes('Solicitante')) {
          await collaboratorApi.turnSolicitante(numericId, { filialId, centroCustoId });
        }

        if (form.profiles.includes('Solicitante de Emergência')) {
          await collaboratorApi.turnSolicitanteEmergencia(numericId, { filialId, centroCustoId });
        }
      }

      showToast({
        type: 'success',
        title: 'Perfis atualizados com sucesso',
        description: `Os papéis e acessos de ${form.name} foram sincronizados no backend.`,
      });
      navigate(`/colaboradores/${employeeId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar alterações';
      showToast({
        type: 'error',
        title: 'Falha ao atribuir perfil',
        description: message,
      });
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

