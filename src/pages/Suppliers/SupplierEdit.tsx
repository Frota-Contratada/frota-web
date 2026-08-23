import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, LoadingState, Select, useToast } from '../../components/common';
import { branchApi, supplierApi, extractListData, type FilialDto } from '../../services';
import { formatCnpj, cleanCnpj } from '../../utils';
import styles from '../Rides/RideReview.module.css';

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

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [branchesList, setBranchesList] = useState<FilialDto[]>([]);
  const [form, setForm] = useState({
    name: '',
    document: '',
    vehicles: '0',
    status: 'aprovado',
    linkedBranch: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsInitialLoading(true);
    branchApi.list().then((res) => {
      const branches = extractListData<FilialDto>(res);
      if (branches.length > 0) {
        setBranchesList(branches);
      }
    }).catch(() => {});

    if (supplierId && !isNaN(Number(supplierId))) {
      supplierApi.getById(Number(supplierId)).then((res) => {
        if (res.response) {
          const s = res.response;
          setForm({
            name: s.nome || '',
            document: s.cnpjCpf ? formatCnpj(s.cnpjCpf) : '',
            vehicles: '0',
            status: 'aprovado',
            linkedBranch: '',
          });
        }
      }).catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar fornecedor';
        showToast({ type: 'error', title: message });
        navigate('/terceiros/fornecedores');
      }).finally(() => {
        setIsInitialLoading(false);
      });
    } else {
      setIsInitialLoading(false);
    }
  }, [supplierId, navigate, showToast]);

  const branchOptions = branchesList.map((b) => ({ label: `${b.nome} (${b.cnpj})`, value: String(b.id) }));

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome é obrigatório';
    const cnpjLimpo = cleanCnpj(form.document);
    if (!cnpjLimpo) {
      errors.document = 'CNPJ é obrigatório';
    } else if (cnpjLimpo.length !== 14) {
      errors.document = 'CNPJ deve conter 14 caracteres alfanuméricos';
    }
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
      navigate(`/terceiros/fornecedores/${supplierId}`);
    }, 400);
  };

  if (isInitialLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="card"
          message="Carregando dados do fornecedor"
          submessage="Preparando formulário de edição..."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Fornecedor — {form.name || 'Fornecedor'}</h2>
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
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={form.document}
              onChange={(e) => updateField('document', formatCnpj(e.target.value))}
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
              onChange={(val) => updateField('status', val)}
            />

            {branchOptions.length > 0 && (
              <Select
                label="Filial Principal"
                placeholder="Selecione a filial"
                value={form.linkedBranch}
                options={branchOptions}
                onChange={(val) => updateField('linkedBranch', val)}
              />
            )}
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
                onClick={() => navigate(`/terceiros/fornecedores/${supplierId}`)}
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
