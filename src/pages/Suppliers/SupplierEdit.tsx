import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { formatDocument, suppliers } from './suppliersData';
import { branches } from '../Listings/listingsData';
import styles from '../Rides/RideReview.module.css';

const branchOptions = branches.map((b) => ({ label: b.name, value: b.name }));

const statusOptions = [
  { label: 'Aprovado / Ativo', value: 'aprovado' },
  { label: 'Pendente de aprovação', value: 'pendente' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Inativo / Cancelado', value: 'cancelado' },
];

export const SupplierEdit = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { showToast } = useToast();
  const supplier = suppliers.find((s) => s.id === Number(supplierId));

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: supplier?.name || '',
    document: supplier ? formatDocument(supplier.document) : '',
    vehicles: supplier ? String(supplier.vehicles) : '0',
    status: supplier?.status || 'aprovado',
    linkedBranch: branchOptions[0]?.value || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!supplier) {
    return <Navigate to="/terceiros/fornecedores" replace />;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome é obrigatório';
    if (!form.document.trim()) errors.document = 'Documento é obrigatório';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, corrija os erros do formulário.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Fornecedor atualizado',
        description: `As informações de ${form.name} foram salvas.`,
      });
      setIsLoading(false);
      navigate(`/terceiros/fornecedores/${supplier.id}`);
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Fornecedor — {supplier.name}</h2>
          <p>Altere os dados cadastrais e o status operacional deste fornecedor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais</h3>
              <p>Altere os dados do fornecedor.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Razão Social / Nome"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="CNPJ / CPF"
              value={form.document}
              onChange={(e) => updateField('document', e.target.value)}
              error={validationErrors.document}
              required
              disabled={isLoading}
            />

            <Input
              label="Veículos cadastrados"
              type="number"
              min="0"
              value={form.vehicles}
              onChange={(e) => updateField('vehicles', e.target.value)}
              disabled={isLoading}
            />

            <Select
              label="Status Operacional"
              value={form.status}
              options={statusOptions}
              onChange={(val) => updateField('status', val as any)}
            />

            <Select
              label="Filial Principal"
              value={form.linkedBranch}
              options={branchOptions}
              onChange={(val) => updateField('linkedBranch', val)}
            />
          </div>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Alterações</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/terceiros/fornecedores/${supplier.id}`)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
