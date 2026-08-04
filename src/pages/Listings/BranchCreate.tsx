import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
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

export const BranchCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    zipCode: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    costCentersCount: '1',
    suppliersCount: '0',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Nome da filial é obrigatório';
    
    const cleanCnpj = form.cnpj.replace(/\D/g, '');
    if (!cleanCnpj) {
      errors.cnpj = 'CNPJ é obrigatório';
    } else if (cleanCnpj.length !== 14) {
      errors.cnpj = 'CNPJ deve conter 14 dígitos';
    }

    const cleanCep = form.zipCode.replace(/\D/g, '');
    if (!cleanCep) {
      errors.zipCode = 'CEP é obrigatório';
    } else if (cleanCep.length !== 8) {
      errors.zipCode = 'CEP deve conter 8 dígitos';
    }

    if (!form.address.trim()) errors.address = 'Endereço é obrigatório';
    if (!form.neighborhood.trim()) errors.neighborhood = 'Bairro é obrigatório';
    if (!form.city.trim()) errors.city = 'Cidade é obrigatória';
    if (!form.state) errors.state = 'Estado (UF) é obrigatório';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    let formatted = raw;
    if (raw.length > 12) {
      formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
    } else if (raw.length > 8) {
      formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    } else if (raw.length > 5) {
      formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    } else if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}.${raw.slice(2)}`;
    }
    updateField('cnpj', formatted);
  };

  const handleCepChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    updateField('zipCode', formatted);

    // Autofill simulated values
    if (raw.length === 8) {
      if (raw === '89010000') {
        setForm((current) => ({
          ...current,
          address: 'Rua XV de Novembro',
          neighborhood: 'Centro',
          city: 'Blumenau',
          state: 'SC',
        }));
      } else if (raw === '01310000') {
        setForm((current) => ({
          ...current,
          address: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
        }));
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, preencha os campos obrigatórios.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Filial cadastrada',
        description: `A filial ${form.name} foi adicionada à base de dados.`,
      });
      setIsLoading(false);
      navigate('/filiais');
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Filial</h2>
          <p>Adicione um novo polo operacional ou escritório administrativo da Seara JBS.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Identificação da Filial</h3>
              <p>Preencha os dados institucionais e de registro.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Nome da filial"
              placeholder="Ex: Seara Itajaí"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => handleCnpjChange(e.target.value)}
              error={validationErrors.cnpj}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Endereço</h3>
              <p>Informe a localização física desta nova filial.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="CEP"
              placeholder="00000-000"
              value={form.zipCode}
              onChange={(e) => handleCepChange(e.target.value)}
              error={validationErrors.zipCode}
              required
              disabled={isLoading}
            />

            <Input
              label="Logradouro (Rua, Av.)"
              placeholder="Rua, Avenida, etc."
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              error={validationErrors.address}
              required
              disabled={isLoading}
            />

            <Input
              label="Bairro"
              placeholder="Digite o bairro"
              value={form.neighborhood}
              onChange={(e) => updateField('neighborhood', e.target.value)}
              error={validationErrors.neighborhood}
              required
              disabled={isLoading}
            />

            <Input
              label="Cidade"
              placeholder="Digite a cidade"
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
              <h3>Configuração de Frota e Custos</h3>
              <p>Ajuste os parâmetros operacionais iniciais.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Quantidade de Centros de Custo"
              type="number"
              min="0"
              value={form.costCentersCount}
              onChange={(e) => updateField('costCentersCount', e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Fornecedores vinculados inicialmente"
              type="number"
              min="0"
              value={form.suppliersCount}
              onChange={(e) => updateField('suppliersCount', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Filial</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/filiais')}
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
