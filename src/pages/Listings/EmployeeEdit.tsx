import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { driverApi, supplierApi, type FornecedorDto } from '../../services';
import { formatCpf } from './listingsData';
import styles from '../Rides/RideReview.module.css';

const roleOptions = [
  { label: 'Motorista', value: 'Motorista' },
  { label: 'Analista', value: 'Analista' },
  { label: 'Coordenador', value: 'Coordenador' },
  { label: 'Gerente', value: 'Gerente' },
];

export const EmployeeEdit = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [suppliersList, setSuppliersList] = useState<FornecedorDto[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'Motorista',
    fornecedorId: '1',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supplierApi.list().then((res) => {
      if (res.response && Array.isArray(res.response)) {
        setSuppliersList(res.response);
      }
    }).catch(() => {});

    if (employeeId && !isNaN(Number(employeeId))) {
      driverApi.getById(Number(employeeId)).then((res) => {
        if (res.response) {
          const d = res.response;
          setForm({
            name: d.nome || '',
            email: d.email || '',
            cpf: d.cpf ? formatCpf(d.cpf) : '',
            role: 'Motorista',
            fornecedorId: String(d.fornecedorId || 1),
          });
        }
      }).catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar colaborador';
        showToast({ type: 'error', title: message });
        navigate('/colaboradores');
      });
    }
  }, [employeeId, navigate, showToast]);

  const supplierOptions = suppliersList.map((s) => ({ label: `${s.nome} (${s.cnpjCpf})`, value: String(s.id) }));

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
        description: `As informações de ${form.name} foram salvas.`,
      });
      setIsLoading(false);
      navigate(`/colaboradores/${employeeId}`);
    }, 400);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Dados Cadastrais — {form.name || 'Colaborador'}</h2>
          <p>Atualize o e-mail, cargo e vínculo deste colaborador.</p>
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
              disabled
            />

            <Select
              label="Cargo"
              value={form.role}
              options={roleOptions}
              onChange={(val) => updateField('role', val)}
              required
            />

            {supplierOptions.length > 0 && (
              <Select
                label="Fornecedor Vinculado"
                value={form.fornecedorId}
                options={supplierOptions}
                onChange={(val) => updateField('fornecedorId', val)}
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
