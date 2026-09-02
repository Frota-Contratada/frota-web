import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, useToast } from '../../components/common';
import CheckIcon from '../../assets/icons/check.svg?react';
import { contractApi } from '../../services';
import styles from '../Rides/Review/RideReview.module.css';
import contractsStyles from './Contracts.module.css';

export const ContractCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    inicio: new Date().toISOString().slice(0, 10),
    vencimento: '',
    fileName: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.inicio) errors.inicio = 'Data de início da vigência é obrigatória';
    if (!selectedFile) errors.file = 'O arquivo PDF do contrato é obrigatório';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, preencha os campos obrigatórios e anexe o PDF.' });
      return;
    }

    if (!selectedFile) return;

    try {
      setIsLoading(true);

      await contractApi.create({
        arquivo: selectedFile,
        dataVigenciaInicio: new Date(form.inicio).toISOString(),
        dataFimVigencia: form.vencimento ? new Date(form.vencimento).toISOString() : undefined,
      });

      showToast({
        type: 'success',
        title: 'Contrato registrado com sucesso',
        description: `O arquivo ${selectedFile.name} foi salvo na plataforma.`,
      });
      navigate('/terceiros/contratos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar contrato';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Contrato de Terceiro</h2>
          <p>Registre um novo instrumento contratual em formato PDF com período de vigência.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Período de Vigência</h3>
              <p>Informe as datas contratuais válidas para prestação do serviço.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Data de Início da Vigência *"
              type="date"
              value={form.inicio}
              onChange={(e) => updateField('inicio', e.target.value)}
              error={validationErrors.inicio}
              required
              disabled={isLoading}
            />

            <Input
              label="Data de Término da Vigência (opcional)"
              type="date"
              value={form.vencimento}
              onChange={(e) => updateField('vencimento', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Instrumento Contratual (PDF)</h3>
              <p>Envie a versão digitalizada e assinada do contrato.</p>
            </div>
          </div>

          <label className={contractsStyles.uploadBox} style={{ marginTop: '1rem' }}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                updateField('fileName', file?.name ?? '');
              }}
              disabled={isLoading}
            />
            <span className={contractsStyles.uploadIcon} aria-hidden="true">
              <CheckIcon width={22} height={22} />
            </span>
            <strong>{form.fileName || 'Selecionar documento em PDF *'}</strong>
            <small>Formato aceito: PDF até 20MB.</small>
          </label>
          {validationErrors.file && (
            <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {validationErrors.file}
            </p>
          )}
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading}>Salvar Contrato</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/terceiros/contratos')}
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

