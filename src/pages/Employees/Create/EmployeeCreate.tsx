import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, SearchableSelect, Select, useToast } from '../../../components/common';
import {
  collaboratorApi,
  costCenterApi,
  fetchAllPages,
  type FilialDto,
  type CentroCustoDto,
  type PerfilCadastroColaborador,
} from '../../../services';
import { usePermissions } from '../../../hooks/usePermissions';
import { branchSearchText, useBranches } from '../../../hooks/useSelectionLists';
import { cleanCpf } from '../../../utils';
import styles from '../../Rides/Review/RideReview.module.css';
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

const profileOptions: { id: PerfilCadastroColaborador; title: string; desc: string }[] = [
  { id: 'solicitante', title: 'Solicitante', desc: 'Pode solicitar viagens corporativas e consultar histórico de corridas.' },
  { id: 'aprovador', title: 'Aprovador', desc: 'Permite gerenciar solicitações, aprovar viagens e auditar despesas.' },
  { id: 'solicitante-emergencia', title: 'Solicitante de Emergência', desc: 'Permite solicitar viagens emergenciais de atendimento imediato.' },
];

// O código da filial se repete entre empresas: a opção guarda os dois.
const branchKey = (branch: FilialDto) => `${branch.empresaId ?? ''}:${branch.id}`;
const parseBranchKey = (key: string) => {
  const [empresaId, filialId] = key.split(':').map(Number);
  return { empresaId: empresaId || undefined, filialId: filialId || undefined };
};

export const EmployeeCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdminMaster } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  // Só o admin master escolhe a filial; o admin de filial cadastra na própria.
  const branchesList = useBranches(isAdminMaster);
  const [costCentersList, setCostCentersList] = useState<CentroCustoDto[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'Analista',
    branch: '',
    costCenterId: '',
    profiles: ['solicitante'] as PerfilCadastroColaborador[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Carrega todos os centros de custo da filial, não só a primeira página.
  useEffect(() => {
    const { empresaId, filialId } = parseBranchKey(form.branch);
    if (isAdminMaster && (!empresaId || !filialId)) return;

    let active = true;
    const load = isAdminMaster
      ? fetchAllPages<CentroCustoDto>((page) => costCenterApi.listAdmin({ empresaId, filialId, page, limit: 100 }))
      : fetchAllPages<CentroCustoDto>((page) => costCenterApi.listFilial({ page, limit: 100 }));

    load
      .then((costCenters) => {
        if (active) setCostCentersList(costCenters.filter((c) => c.ativo !== false));
      })
      .catch(() => {
        if (active) setCostCentersList([]);
      });
    return () => {
      active = false;
    };
  }, [isAdminMaster, form.branch]);

  const branchOptions = branchesList.map((b) => ({
    label: `${b.nome} (${b.cnpj})`,
    value: branchKey(b),
    searchText: branchSearchText(b),
  }));

  // Centros de custo com aprovador primeiro: só neles o solicitante pode ser vinculado.
  const costCenterOptions = useMemo(() => {
    return [...costCentersList]
      .sort((a, b) => Number(Boolean(b.temAprovador)) - Number(Boolean(a.temAprovador)) || a.numero - b.numero)
      .map((c) => ({
        label: `${c.nome} (Nº ${c.numero})${c.temAprovador ? ' — Com Aprovador' : ' — Sem Aprovador'}`,
        value: String(c.numero),
      }));
  }, [costCentersList]);

  const updateField = (field: keyof typeof form, value: unknown) => {
    if (field === 'branch') {
      setCostCentersList([]);
      setForm((current) => ({ ...current, branch: String(value), costCenterId: '' }));
    } else {
      setForm((current) => ({ ...current, [field]: value }));
    }
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleProfileToggle = (profile: PerfilCadastroColaborador) => {
    setForm((current) => {
      const isSelected = current.profiles.includes(profile);
      const next = isSelected
        ? current.profiles.filter((p) => p !== profile)
        : [...current.profiles, profile];

      return { ...current, profiles: next };
    });
    setValidationErrors((current) => ({ ...current, profiles: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Nome completo é obrigatório';

    if (!form.email.trim()) {
      errors.email = 'Email corporativo é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Email inválido';
    }

    const rawCpf = cleanCpf(form.cpf);
    if (rawCpf && rawCpf.length !== 11) errors.cpf = 'Informe um CPF com 11 dígitos';

    if (!form.role) errors.role = 'Cargo é obrigatório';
    if (isAdminMaster && !form.branch) errors.branch = 'Selecione a filial de vinculação';
    if (!form.costCenterId) errors.costCenterId = 'Selecione o centro de custo';

    if (form.profiles.length === 0) {
      errors.profiles = 'Selecione pelo menos um perfil de acesso';
    } else if (!form.profiles.includes('solicitante') && !form.profiles.includes('aprovador')) {
      errors.profiles = 'Selecione o perfil de solicitante ou de aprovador';
    } else if (form.profiles.includes('solicitante-emergencia') && !form.profiles.includes('solicitante')) {
      errors.profiles = 'O perfil de emergência exige também o perfil de solicitante';
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
      const { empresaId, filialId } = parseBranchKey(form.branch);
      const rawCpf = cleanCpf(form.cpf);

      await collaboratorApi.create({
        nome: form.name.trim(),
        email: form.email.trim(),
        cpf: rawCpf || undefined,
        cargo: form.role,
        ...(isAdminMaster ? { empresaId, filialId } : {}),
        centroCustoId: Number(form.costCenterId),
        perfis: form.profiles,
      });

      showToast({
        type: 'success',
        title: 'Colaborador cadastrado',
        description: `${form.name.trim()} cria a senha no primeiro acesso, com o código enviado para ${form.email.trim()}.`,
      });
      navigate('/colaboradores');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar colaborador';
      showToast({ type: 'error', title: 'Erro ao cadastrar colaborador', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Novo Colaborador</h2>
          <p>Cadastre um novo usuário corporativo e configure sua lotação e papéis operacionais.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais</h3>
              <p>Informações de identificação corporativa do colaborador.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome completo"
              placeholder="Ex: João da Silva"
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
              label="CPF (opcional)"
              mask="cpf"
              value={form.cpf}
              onChange={(e) => updateField('cpf', e.target.value)}
              error={validationErrors.cpf}
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
              <p>
                {isAdminMaster
                  ? 'Defina a filial de lotação e o centro de custo responsável.'
                  : 'O colaborador é cadastrado na sua filial. Defina o centro de custo responsável.'}
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            {isAdminMaster && (
              <SearchableSelect
                searchPlaceholder="Digite o nome, o código, o CNPJ ou a cidade"
                label="Filial de vinculação"
                value={form.branch}
                options={branchOptions}
                onChange={(val) => updateField('branch', val)}
                error={validationErrors.branch}
                disabled={isLoading || branchOptions.length === 0}
                required
              />
            )}

            <SearchableSelect
              searchPlaceholder="Digite o nome ou o número"
              label="Centro de custo"
              value={form.costCenterId}
              options={costCenterOptions}
              onChange={(val) => updateField('costCenterId', val)}
              error={validationErrors.costCenterId}
              disabled={isLoading || costCenterOptions.length === 0}
              helperText="Em centro de custo sem aprovador, marque também o perfil Aprovador: o colaborador passa a ser o aprovador dele."
              required
            />
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
              {profileOptions.map((p) => {
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
