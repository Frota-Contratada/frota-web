import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branches, employees, formatCpf } from './listingsData';
import { suppliers } from '../Suppliers/suppliersData';
import styles from '../Rides/RideReview.module.css';

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

const branchOptions = branches.map((b) => ({ label: b.name, value: b.name }));
const supplierOptions = suppliers.map((s) => ({ label: s.name, value: s.name }));

export const EmployeeEdit = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { showToast } = useToast();
  const employee = employees.find((item) => item.id === Number(employeeId));

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    cpf: employee ? formatCpf(employee.cpf) : '',
    role: employee?.role || 'Analista',
    connectionType: employee?.supplier ? 'fornecedor' : 'filial',
    branch: employee?.branch || '',
    supplier: employee?.supplier || '',
    searaCode: employee?.searaCode || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!employee) {
    return <Navigate to="/colaboradores" replace />;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome completo é obrigatório';
    if (!form.email.trim()) errors.email = 'Email corporativo é obrigatório';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, corrija os erros.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Dados cadastrais atualizados',
        description: `As informações de ${form.name} foram salvas com sucesso.`,
      });
      setIsLoading(false);
      navigate(`/colaboradores/${employee.id}`);
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Dados Cadastrais — {employee.name}</h2>
          <p>Atualize o e-mail, cargo, vínculo e identificadores corporativos do colaborador.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Informações Pessoais e Funcionais</h3>
              <p>Campos cadastrais base do profissional.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="Email corporativo"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={validationErrors.email}
              required
              disabled={isLoading}
            />

            <Input
              label="CPF"
              value={form.cpf}
              onChange={(e) => updateField('cpf', e.target.value)}
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
              label="Código Seara"
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
                value={form.branch}
                options={branchOptions}
                onChange={(val) => updateField('branch', val)}
              />
            ) : (
              <Select
                label="Fornecedor associado"
                value={form.supplier}
                options={supplierOptions}
                onChange={(val) => updateField('supplier', val)}
              />
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
                onClick={() => navigate(`/colaboradores/${employee.id}`)}
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
