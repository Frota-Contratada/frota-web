import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, useToast } from '../../../components/common';
import CheckIcon from '../../../assets/icons/check.svg?react';
import { contractApi, contractIaApi, type ExtracaoResultadoIa } from '../../../services';
import styles from '../../Rides/Review/RideReview.module.css';
import contractsStyles from '../Contracts.module.css';

export const ContractCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingIa, setIsExtractingIa] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [iaResult, setIaResult] = useState<ExtracaoResultadoIa | null>(null);

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

  const handleExtrairComIa = async () => {
    if (!selectedFile) {
      showToast({ type: 'warning', title: 'Nenhum arquivo anexado', description: 'Selecione um arquivo PDF para analisar com IA.' });
      return;
    }

    try {
      setIsExtractingIa(true);
      const resultado = await contractIaApi.extrairDados(selectedFile);
      setIaResult(resultado);

      // Preenche datas automaticamente se encontradas pela IA
      if (resultado.datasNormalizadas?.dataVigenciaInicio) {
        updateField('inicio', resultado.datasNormalizadas.dataVigenciaInicio);
      }
      if (resultado.datasNormalizadas?.dataVigenciaFim) {
        updateField('vencimento', resultado.datasNormalizadas.dataVigenciaFim);
      }

      const confiancaPct = Math.round((resultado.extracao?.confianca_geral ?? 0) * 100);
      showToast({
        type: 'success',
        title: 'Extração por IA concluída',
        description: `Dados identificados com ${confiancaPct}% de confiança pelo modelo.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha na extração de dados com IA';
      showToast({ type: 'error', title: 'Erro no processamento do contrato', description: msg });
    } finally {
      setIsExtractingIa(false);
    }
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
        dataVigenciaInicio: form.inicio,
        dataVigenciaFim: form.vencimento ? form.vencimento : undefined,
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
          <p>Registre um novo instrumento contratual em formato PDF com período de vigência e regras extraídas por IA.</p>
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
              disabled={isLoading || isExtractingIa}
            />

            <Input
              label="Data de Término da Vigência (opcional)"
              type="date"
              value={form.vencimento}
              onChange={(e) => updateField('vencimento', e.target.value)}
              disabled={isLoading || isExtractingIa}
            />
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Instrumento Contratual (PDF) & Análise por IA</h3>
              <p>Envie o contrato digitalizado. Você pode extrair datas e cláusulas automaticamente com o microserviço <code>frota-ia</code>.</p>
            </div>
          </div>

          <label className={contractsStyles.uploadBox} style={{ marginTop: '1rem' }}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                setIaResult(null);
                updateField('fileName', file?.name ?? '');
              }}
              disabled={isLoading || isExtractingIa}
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

          {selectedFile && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button
                type="button"
                variant="outline"
                onClick={handleExtrairComIa}
                isLoading={isExtractingIa}
                disabled={isLoading}
              >
                ✨ Analisar e Extrair Dados com IA (frota-ia)
              </Button>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Preenche automaticamente vigência e regras identificadas.
              </span>
            </div>
          )}

          {/* Painel de Resultados da IA */}
          {iaResult && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#0f172a' }}>Resultado da Leitura Inteligente</h4>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    background: (iaResult.extracao?.confianca_geral ?? 0) >= 0.7 ? '#dcfce7' : '#fef3c7',
                    color: (iaResult.extracao?.confianca_geral ?? 0) >= 0.7 ? '#15803d' : '#b45309',
                  }}
                >
                  Confiança: {Math.round((iaResult.extracao?.confianca_geral ?? 0) * 100)}%
                </span>
              </div>

              {iaResult.fornecedor && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Fornecedor no contrato:</strong> {iaResult.fornecedor.nm_fornecedor || 'Não especificado'}
                  {iaResult.fornecedor.cnpj_cpf ? ` (CNPJ/CPF: ${iaResult.fornecedor.cnpj_cpf})` : ''}
                </p>
              )}

              {iaResult.tipo_contrato && iaResult.tipo_contrato.length > 0 && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Modalidade:</strong> {iaResult.tipo_contrato.join(', ')}
                </p>
              )}

              {iaResult.regras && iaResult.regras.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                    Cláusulas Financeiras Extraídas ({iaResult.regras.length}):
                  </strong>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ padding: '0.5rem' }}>Prioridade</th>
                          <th style={{ padding: '0.5rem' }}>Tipo</th>
                          <th style={{ padding: '0.5rem' }}>Veículo</th>
                          <th style={{ padding: '0.5rem' }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iaResult.regras.map((regra, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem' }}>#{regra.nr_prioridade}</td>
                            <td style={{ padding: '0.5rem' }}>{regra.nm_tipo_regra}</td>
                            <td style={{ padding: '0.5rem' }}>{regra.nm_tipo_veiculo}</td>
                            <td style={{ padding: '0.5rem' }}>
                              {regra.nr_valor_km != null
                                ? `R$ ${regra.nr_valor_km.toFixed(2)}/km`
                                : regra.nr_valor_fixo != null
                                ? `R$ ${regra.nr_valor_fixo.toFixed(2)} (fixo)`
                                : regra.nr_percentual != null
                                ? `${regra.nr_percentual}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {iaResult.extracao?.observacoes && iaResult.extracao.observacoes.length > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <em>Observações da IA: {iaResult.extracao.observacoes.join('; ')}</em>
                </div>
              )}
            </div>
          )}
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações do cadastro</span>

            <div className={styles.primaryActions}>
              <Button type="submit" isLoading={isLoading} disabled={isExtractingIa}>
                Salvar Contrato
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/terceiros/contratos')}
                disabled={isLoading || isExtractingIa}
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
