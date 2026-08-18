import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branchApi, driverApi, supplierApi, type FornecedorDto, type FilialDto } from '../../services';
import styles from '../Rides/RideReview.module.css';
import localStyles from './EmployeeCreate.module.css';

const roleOptions = [
  { label: 'Diretor', value: 'Diretor' },
  { label: 'Gerente', value: 'Gerente' },
  { label: 'Coordenador', value: 'Coordenador' },
  { label: 'Analista', value: 'Analista' },
  { label: 'Motorista', value: 'Motorista' },
  { label: 'Assistente', value: 'Assistente' },
];

const connectionTypeOptions = [
  { label: 'Filial (Interno)', value: 'filial' },
  { label: 'Fornecedor (Terceirizado)', value: 'fornecedor' },
];

export const EmployeeCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState<FornecedorDto[]>([]);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number>(1);

  useEffect(() => {
    supplierApi.list().then((res) => {
      if (res.response && Array.isArray(res.response) && res.response.length > 0) {
        setSuppliersList(res.response);
        setSelectedFornecedorId(res.response[0].id);
      }
    }).catch(() => {});

    branchApi.list().then((res) => {
      if (res.response && Array.isArray(res.response)) {
        setBranchesList(res.response);
      }
    }).catch(() => {});
  }, []);

  const supplierOptions = suppliersList.map((s) => ({ label: `${s.nome} (${s.cnpjCpf})`, value: String(s.id) }));
  const branchOptions = branchesList.map((b) => ({ label: `${b.nome} (${b.cnpj})`, value: String(b.id) }));

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: '',
    connectionType: 'filial',
    branch: '',
    supplier: '',
    searaCode: '',
    profiles: [] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    if (form.profiles.length === 0) {
      errors.profiles = 'Selecione pelo menos um perfil de acesso';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, preencha os campos obrigatórios.' });
      return;
    }

    try {
      setIsLoading(true);
      await driverApi.create({
        nome: form.name,
        email: form.email,
        cpf: form.cpf.replace(/\D/g, ''),
        fornecedorId: selectedFornecedorId || 1,
      });

      showToast({
        type: 'success',
        title: 'Colaborador cadastrado',
        description: `O colaborador ${form.name} foi adicionado com sucesso.`,
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
          <p>Adicione um novo colaborador interno ou motorista parceiro no sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais</h3>
              <p>Preencha as informações básicas de identificação e alocação do profissional.</p>
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
              placeholder="nome.sobrenome@empresa.com"
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

            <Input
              label="Código Seara (opcional)"
              placeholder="Ex: SE-12345"
              value={form.searaCode}
              onChange={(e) => updateField('searaCode', e.target.value)}
              disabled={isLoading}
            />

            <Select
              label="Tipo de vínculo"
              value={form.connectionType}
              options={connectionTypeOptions}
              onChange={(val) => {
                updateField('connectionType', val);
                updateField('branch', '');
                updateField('supplier', '');
              }}
              required
            />

            {form.connectionType === 'filial' ? (
              <Select
                label="Filial de trabalho"
                placeholder="Selecione a filial"
                value={form.branch}
                options={branchOptions}
                onChange={(val) => updateField('branch', val)}
                required
              />
            ) : (
              <Select
                label="Fornecedor associado"
                placeholder="Selecione o fornecedor"
                value={form.supplier}
                options={supplierOptions}
                onChange={(val) => updateField('supplier', val)}
                required
              />
            )}
          </div>

          <div className={localStyles.divider} />

          <div className={styles.cardHeader} style={{ marginTop: '2rem' }}>
            <div>
              <h3>Perfis de Acesso</h3>
              <p>Determine quais funções e telas o usuário poderá acessar na plataforma.</p>
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
