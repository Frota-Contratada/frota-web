import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branches } from './listingsData';
import styles from '../Rides/RideReview.module.css';

const stateOptions = [
  { label: 'São Paulo - SP', value: 'SP' },
  { label: 'Santa Catarina - SC', value: 'SC' },
  { label: 'Paraná - PR', value: 'PR' },
  { label: 'Pernambuco - PE', value: 'PE' },
  { label: 'Rio de Janeiro - RJ', value: 'RJ' },
  { label: 'Minas Gerais - MG', value: 'MG' },
  { label: 'Rio Grande do Sul - RS', value: 'RS' },
];

export const BranchEdit = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const { showToast } = useToast();
  const branch = branches.find((item) => item.id === Number(branchId));

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: branch?.name || '',
    address: branch?.address || '',
    neighborhood: branch?.neighborhood || '',
    city: branch?.city || '',
    state: branch?.state || 'SC',
    zipCode: branch?.zipCode || '',
    costCenters: branch ? String(branch.costCenters) : '1',
    suppliers: branch ? String(branch.suppliers) : '1',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!branch) {
    return <Navigate to="/filiais" replace />;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome da filial é obrigatório';
    if (!form.address.trim()) errors.address = 'Endereço é obrigatório';
    if (!form.city.trim()) errors.city = 'Cidade é obrigatória';
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
        title: 'Filial atualizada',
        description: `As informações de ${form.name} foram atualizadas com sucesso.`,
      });
      setIsLoading(false);
      navigate(`/filiais/${branch.id}`);
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Filial — {branch.name}</h2>
          <p>Altere o endereço, identificação ou configurações operacionais desta unidade.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Identificação e Endereço</h3>
              <p>Dados de localização da unidade.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome da filial"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="CEP"
              value={form.zipCode}
              onChange={(e) => updateField('zipCode', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Endereço"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              error={validationErrors.address}
              required
              disabled={isLoading}
            />

            <Input
              label="Bairro"
              value={form.neighborhood}
              onChange={(e) => updateField('neighborhood', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Cidade"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              error={validationErrors.city}
              required
              disabled={isLoading}
            />

            <Select
              label="Estado (UF)"
              value={form.state}
              options={stateOptions}
              onChange={(val) => updateField('state', val)}
              required
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Parâmetros Operacionais</h3>
              <p>Ajuste o número de centros de custos e terceiros vinculados.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Centros de Custo"
              type="number"
              min="0"
              value={form.costCenters}
              onChange={(e) => updateField('costCenters', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Fornecedores Vinculados"
              type="number"
              min="0"
              value={form.suppliers}
              onChange={(e) => updateField('suppliers', e.target.value)}
              disabled={isLoading}
            />
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
                onClick={() => navigate(`/filiais/${branch.id}`)}
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
