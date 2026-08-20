import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { suppliers as defaultSuppliers } from './contractsData';
import { contractApi, supplierApi, extractListData, type FornecedorDto } from '../../services';
import styles from '../Rides/RideReview.module.css';
import contractsStyles from './Contracts.module.css';

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
  const [suppliersList, setSuppliersList] = useState<FornecedorDto[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    codigo: '',
    fornecedorId: '',
    tipo: 'Transporte executivo',
    inicio: new Date().toISOString().slice(0, 10),
    vencimento: '',
    valorMensal: '',
    responsavel: '',
    escopo: '',
    sla: '',
    reajuste: '',
    fileName: '',
  });

  useEffect(() => {
    supplierApi.list().then((res) => {
      const apiSuppliers = extractListData<FornecedorDto>(res);
      if (apiSuppliers.length > 0) {
        setSuppliersList(apiSuppliers);
        setForm((prev) => ({ ...prev, fornecedorId: String(apiSuppliers[0].id) }));
      }
    }).catch(() => {});
  }, []);

  const supplierOptions = suppliersList.length > 0
    ? suppliersList.map((s) => ({ label: `${s.nome} (${s.cnpjCpf})`, value: String(s.id) }))
    : defaultSuppliers.map((s, idx) => ({ label: s, value: String(idx + 1) }));

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.codigo.trim()) errors.codigo = 'Código do contrato é obrigatório';
    if (!form.fornecedorId) errors.fornecedorId = 'Fornecedor é obrigatório';
    if (!form.valorMensal.trim()) errors.valorMensal = 'Valor mensal é obrigatório';
    if (!form.responsavel.trim()) errors.responsavel = 'Responsável é obrigatório';

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
      const cleanValue = Number(form.valorMensal.replace(/\D/g, '')) / 100 || Number(form.valorMensal.replace(/\D/g, '')) || 5000;
      const fileToSend = selectedFile || new File(['mock content'], `${form.codigo || 'contrato'}.pdf`, { type: 'application/pdf' });

      await contractApi.create({
        arquivo: fileToSend,
        fornecedorId: Number(form.fornecedorId) || 1,
        tipoContrato: form.tipo,
        valorMensal: cleanValue,
        dataInicioVigencia: new Date(form.inicio || Date.now()).toISOString(),
        dataFimVigencia: form.vencimento ? new Date(form.vencimento).toISOString() : undefined,
        descricao: form.escopo || undefined,
      });

      showToast({
        type: 'success',
        title: 'Contrato registrado',
        description: `O contrato ${form.codigo} foi registrado com sucesso.`,
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
              value={form.fornecedorId}
              options={supplierOptions}
              onChange={(val) => updateField('fornecedorId', val)}
              error={validationErrors.fornecedorId}
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
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                updateField('fileName', file?.name ?? '');
              }}
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
