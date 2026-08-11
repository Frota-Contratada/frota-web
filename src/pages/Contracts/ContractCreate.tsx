import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { suppliers } from './contractsData';
import styles from '../Rides/RideReview.module.css';
import contractsStyles from './Contracts.module.css';

const supplierOptions = suppliers.map((s) => ({ label: s, value: s }));

const typeOptions = [
  { label: 'Transporte executivo', value: 'Transporte executivo' },
  { label: 'Frota dedicada', value: 'Frota dedicada' },
  { label: 'Viagens intermunicipais', value: 'Viagens intermunicipais' },
  { label: 'Transporte operacional', value: 'Transporte operacional' },
  { label: 'Gestão de frota', value: 'Gestão de frota' },
];

export const ContractCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    codigo: '',
    fornecedor: '',
    tipo: 'Transporte executivo',
    inicio: '',
    vencimento: '',
    valorMensal: '',
    responsavel: '',
    escopo: '',
    sla: '',
    reajuste: '',
    fileName: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.codigo.trim()) errors.codigo = 'Código do contrato é obrigatório';
    if (!form.fornecedor) errors.fornecedor = 'Fornecedor é obrigatório';
    if (!form.valorMensal.trim()) errors.valorMensal = 'Valor mensal é obrigatório';
    if (!form.responsavel.trim()) errors.responsavel = 'Responsável é obrigatório';

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
        title: 'Contrato registrado',
        description: `O contrato ${form.codigo} foi registrado com sucesso.`,
      });
      setIsLoading(false);
      navigate('/terceiros/contratos');
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Contrato de Terceiro</h2>
          <p>Registre um novo instrumento contratual para prestação de serviços de frota.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Identificação do Contrato</h3>
              <p>Informe o código interno, fornecedor e valores negociados.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Código do contrato"
              placeholder="Ex: CTR-2026-099"
              value={form.codigo}
              onChange={(e) => updateField('codigo', e.target.value)}
              error={validationErrors.codigo}
              required
              disabled={isLoading}
            />

            <Select
              label="Fornecedor contratado"
              placeholder="Selecione o fornecedor"
              value={form.fornecedor}
              options={supplierOptions}
              onChange={(val) => updateField('fornecedor', val)}
              error={validationErrors.fornecedor}
              required
            />

            <Select
              label="Tipo de serviço"
              value={form.tipo}
              options={typeOptions}
              onChange={(val) => updateField('tipo', val)}
              required
            />

            <Input
              label="Valor mensal estimado (R$)"
              placeholder="Ex: R$ 45.000,00"
              value={form.valorMensal}
              onChange={(e) => updateField('valorMensal', e.target.value)}
              error={validationErrors.valorMensal}
              required
              disabled={isLoading}
            />

            <Input
              label="Data de Início"
              type="date"
              value={form.inicio}
              onChange={(e) => updateField('inicio', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Data de Vencimento"
              type="date"
              value={form.vencimento}
              onChange={(e) => updateField('vencimento', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Gestor / Responsável Seara"
              placeholder="Ex: Marina Costa"
              value={form.responsavel}
              onChange={(e) => updateField('responsavel', e.target.value)}
              error={validationErrors.responsavel}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Escopo, SLA e Reajuste</h3>
              <p>Descreva os compromissos de serviço e cláusulas financeiras.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <Input
              label="Escopo da prestação"
              placeholder="Descreva o escopo operacional..."
              value={form.escopo}
              onChange={(e) => updateField('escopo', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Nível de serviço (SLA)"
              placeholder="Ex: 95% de atendimento no prazo..."
              value={form.sla}
              onChange={(e) => updateField('sla', e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="Índice / Cláusula de reajuste"
              placeholder="Ex: IPCA acumulado a cada 12 meses..."
              value={form.reajuste}
              onChange={(e) => updateField('reajuste', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Anexo do Instrumento Contratual</h3>
              <p>Envie a versão digitalizada ou assinada em formato PDF.</p>
            </div>
          </div>

          <label className={contractsStyles.uploadBox} style={{ marginTop: '1rem' }}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => updateField('fileName', e.target.files?.[0]?.name ?? '')}
              disabled={isLoading}
            />
            <strong>{form.fileName || 'Selecionar documento em PDF'}</strong>
            <small>Tamanho máximo: 20MB.</small>
          </label>
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
