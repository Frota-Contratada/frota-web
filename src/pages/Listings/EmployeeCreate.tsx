import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branchApi, costCenterApi, collaboratorApi, extractListData, type FilialDto, type CentroCustoDto } from '../../services';
import styles from '../Rides/RideReview.module.css';
import localStyles from './EmployeeCreate.module.css';

const roleOptions = [
  { label: 'Analista', value: 'Analista' },
  { label: 'Coordenador', value: 'Coordenador' },
  { label: 'Gerente', value: 'Gerente' },
  { label: 'Diretor', value: 'Diretor' },
  { label: 'Assistente', value: 'Assistente' },
  { label: 'Especialista', value: 'Especialista' },
  { label: 'Consultor', value: 'Consultor' },
];

export const EmployeeCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);
  const [costCentersList, setCostCentersList] = useState<CentroCustoDto[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'Analista',
    branch: '',
    costCenterId: '',
    profiles: ['Solicitante'] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.allSettled([
      branchApi.list(),
      costCenterApi.list(),
    ]).then(([branchesRes, ccRes]) => {
      const branches = branchesRes.status === 'fulfilled' ? extractListData<FilialDto>(branchesRes.value) : [];
      const costCenters = ccRes.status === 'fulfilled' ? extractListData<CentroCustoDto>(ccRes.value) : [];

      setBranchesList(branches);
      setCostCentersList(costCenters);

      if (branches.length > 0) {
        setForm((curr) => ({
          ...curr,
          branch: curr.branch || String(branches[0].id),
        }));
      }
      if (costCenters.length > 0) {
        setForm((curr) => ({
          ...curr,
          costCenterId: curr.costCenterId || String(costCenters[0].id),
        }));
      }
    }).catch(() => {});
  }, []);

  const branchOptions = branchesList.map((b) => ({ label: `${b.nome} (${b.cnpj})`, value: String(b.id) }));
  const costCenterOptions = costCentersList.map((c) => ({ label: `${c.nome} ${c.codigo ? `(${c.codigo})` : ''}`, value: String(c.id) }));

  const updateField = (field: keyof typeof form, value: unknown) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleProfileToggle = (profile: string) => {
    setForm((current) => {
      const isSelected = current.profiles.includes(profile);
      const next = isSelected
        ? current.profiles.filter((p) => p !== profile)
        : [...current.profiles, profile];

      return { ...current, profiles: next };
    });
    setValidationErrors((current) => ({ ...current, profiles: '' }));
  };

  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 9) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    } else if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    updateField('cpf', formatted);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Nome completo é obrigatório';

    if (!form.email.trim()) {
      errors.email = 'Email corporativo é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Email inválido';
    }

    const cleanCpf = form.cpf.replace(/\D/g, '');
    if (!cleanCpf) {
      errors.cpf = 'CPF é obrigatório';
    } else if (cleanCpf.length !== 11) {
      errors.cpf = 'CPF deve conter 11 dígitos';
    }

    if (!form.role) errors.role = 'Cargo é obrigatório';
    if (!form.branch) errors.branch = 'Selecione a filial de vinculação';
    if (!form.costCenterId) errors.costCenterId = 'Selecione o centro de custo';

    if (form.profiles.length === 0) {
      errors.profiles = 'Selecione pelo menos um perfil de acesso';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, preencha os campos obrigatórios.' });
      return;
    }

    try {
      setIsLoading(true);

      showToast({
        type: 'success',
        title: 'Colaborador cadastrado',
        description: `O colaborador ${form.name} foi adicionado à plataforma com sucesso.`,
      });
      navigate('/colaboradores');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar colaborador';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Colaborador</h2>
          <p>Adicione um novo colaborador interno da Seara e configure seus papéis operacionais.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais</h3>
              <p>Informações básicas de identificação corporativa do colaborador.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome completo"
              placeholder="Digite o nome completo"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="Email corporativo"
              placeholder="nome.sobrenome@frota.com.br"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={validationErrors.email}
              required
              disabled={isLoading}
            />

            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              error={validationErrors.cpf}
              required
              disabled={isLoading}
            />

            <Select
              label="Cargo"
              value={form.role}
              options={roleOptions}
              onChange={(val) => updateField('role', val)}
              required
            />
          </div>

          <div className={localStyles.divider} />

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Alocação Operacional</h3>
              <p>Defina a filial de lotação e o centro de custo responsável.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            {branchOptions.length > 0 && (
              <Select
                label="Filial de vinculação *"
                value={form.branch}
                options={branchOptions}
                onChange={(val) => updateField('branch', val)}
                error={validationErrors.branch}
                required
              />
            )}

            {costCenterOptions.length > 0 && (
              <Select
                label="Centro de custo *"
                value={form.costCenterId}
                options={costCenterOptions}
                onChange={(val) => updateField('costCenterId', val)}
                error={validationErrors.costCenterId}
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
                { id: 'Solicitante', title: 'Solicitante', desc: 'Pode solicitar viagens corporativas e consultar histórico de corridas.' },
                { id: 'Aprovador', title: 'Aprovador', desc: 'Permite gerenciar solicitações, aprovar viagens e auditar despesas.' },
                { id: 'Solicitante de Emergência', title: 'Solicitante de Emergência', desc: 'Permite solicitar viagens emergenciais de atendimento imediato.' },
              ].map((p) => {
                const isSelected = form.profiles.includes(p.id);

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
                      <span className={`${localStyles.profileStatusBadge} ${isSelected ? localStyles.badgeActive : localStyles.badgeInactive}`}>
                        {isSelected ? 'Selecionado' : 'Não selecionado'}
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
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Colaborador</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/colaboradores')}
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
