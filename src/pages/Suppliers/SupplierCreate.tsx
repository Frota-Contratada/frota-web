import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { branchApi, supplierApi, extractListData, type FilialDto } from '../../services';
import { formatCnpj, cleanCnpj } from '../../utils';
import styles from '../Rides/Review/RideReview.module.css';

export const SupplierCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);

  const [form, setForm] = useState({
    name: '',
    document: '',
    filialId: '',
  });

  useEffect(() => {
    branchApi.list().then((res) => {
      const branches = extractListData<FilialDto>(res);
      if (branches.length > 0) {
        setBranchesList(branches);
        setForm((prev) => ({ ...prev, filialId: prev.filialId || String(branches[0].id) }));
      }
    }).catch(() => {});
  }, []);

  const branchOptions = branchesList.map((b) => ({ label: `${b.nome} (${b.cnpj})`, value: String(b.id) }));

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleDocumentChange = (val: string) => {
    updateField('document', formatCnpj(val));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Razão Social / Nome é obrigatório';

    const cnpjLimpo = cleanCnpj(form.document);
    if (!cnpjLimpo) {
      errors.document = 'CNPJ é obrigatório';
    } else if (cnpjLimpo.length !== 14) {
      errors.document = 'CNPJ deve conter 14 caracteres numéricos';
    }

    if (!form.filialId) errors.filialId = 'Filial de vínculo é obrigatória';

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
      await supplierApi.create({
        nome: form.name,
        cnpjCpf: cleanCnpj(form.document),
        filialId: Number(form.filialId),
      });

      showToast({
        type: 'success',
        title: 'Fornecedor cadastrado com sucesso',
        description: `O fornecedor ${form.name} foi cadastrado.`,
      });
      navigate('/terceiros/fornecedores');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar fornecedor';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
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
              label="Razão Social / Nome Fantasia *"
              placeholder="Ex: Mobilidade Prime LTDA"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={validationErrors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="CNPJ *"
              placeholder="00.000.000/0000-00"
              value={form.document}
              onChange={(e) => handleDocumentChange(e.target.value)}
              error={validationErrors.document}
              required
              disabled={isLoading}
            />

            {branchOptions.length > 0 && (
              <Select
                label="Filial de Vínculo *"
                placeholder="Selecione a filial"
                value={form.filialId}
                options={branchOptions}
                onChange={(val) => updateField('filialId', val)}
                error={validationErrors.filialId}
                required
              />
            )}
          </div>
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

