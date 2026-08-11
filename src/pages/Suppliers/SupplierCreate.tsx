import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branches } from '../Listings/listingsData';
import styles from '../Rides/RideReview.module.css';
import contractsStyles from '../Contracts/Contracts.module.css';

const branchOptions = branches.map((b) => ({ label: b.name, value: b.name }));

export const SupplierCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    document: '',
    linkedBranches: [] as string[],
    vehicles: '0',
    fileName: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: unknown) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleDocumentChange = (val: string) => {
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
    updateField('document', formatted);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Razão Social / Nome é obrigatório';

    const cleanDoc = form.document.replace(/\D/g, '');
    if (!cleanDoc) {
      errors.document = 'CNPJ é obrigatório';
    } else if (cleanDoc.length !== 14) {
      errors.document = 'CNPJ deve conter 14 dígitos';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
        title: 'Fornecedor cadastrado',
        description: `O fornecedor ${form.name} foi cadastrado com sucesso.`,
      });
      setIsLoading(false);
      navigate('/terceiros/fornecedores');
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Fornecedor</h2>
          <p>Adicione um novo parceiro prestador de serviço de frota ou mobilidade.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Dados Cadastrais</h3>
              <p>Preencha as informações institucionais do fornecedor.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Razão Social / Nome Fantasia"
              placeholder="Ex: Mobilidade Prime LTDA"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={form.document}
              onChange={(e) => handleDocumentChange(e.target.value)}
              error={validationErrors.document}
              required
              disabled={isLoading}
            />

            <Input
              label="Quantidade inicial de veículos"
              type="number"
              min="0"
              value={form.vehicles}
              onChange={(e) => updateField('vehicles', e.target.value)}
              disabled={isLoading}
            />

            <Select
              label="Filial Principal de Vínculo"
              placeholder="Selecione a filial"
              value={form.linkedBranches[0] || ''}
              options={branchOptions}
              onChange={(val) => updateField('linkedBranches', [val])}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Documentação Cadastral</h3>
              <p>Anexe a ficha cadastral ou contrato de parceria em formato PDF.</p>
            </div>
          </div>

          <label className={contractsStyles.uploadBox} style={{ marginTop: '1rem' }}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => updateField('fileName', e.target.files?.[0]?.name ?? '')}
              disabled={isLoading}
            />
            <strong>{form.fileName || 'Anexar documento cadastral (PDF)'}</strong>
            <small>Formato aceito: PDF até 10MB.</small>
          </label>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Fornecedor</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/terceiros/fornecedores')}
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
