import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  SearchableSelect,
  type SearchableSelectOption,
  type SelectOption,
  useToast,
} from '../../../components/common';
import { MultiSelect, type MultiSelectOption } from '../../../components/common/MultiSelect/MultiSelect';
import CheckIcon from '../../../assets/icons/check.svg?react';
import {
  contractApi,
  contractIaApi,
  ridesApi,
  montarRegrasContrato,
  QUALQUER_VEICULO,
  type ExtracaoResultadoIa,
  type FornecedorDto,
  type TipoCorridaDto,
  type TipoVeiculoDto,
} from '../../../services';
import { branchSearchText, supplierToOption, useBranches, useSupplierSearch } from '../../../hooks/useSelectionLists';
import { resolveEmpresaId } from '../../../utils/apiHelpers';
import styles from './ContractCreate.module.css';

export interface EditableRegra {
  id: string;
  nr_prioridade: number;
  nm_tipo_regra: string;
  nm_tipo_veiculo: string;
  nr_valor_km?: number | null;
  nr_valor_fixo?: number | null;
  nr_percentual?: number | null;
  origem: 'ia' | 'manual';
}

const TIPO_REGRA_OPTIONS: SelectOption[] = [
  { value: 'VALOR_POR_KM', label: 'Valor por KM (R$/km)' },
  { value: 'VIAGEM_FIXA', label: 'Tarifa Fixa (R$)' },
  { value: 'ACRESCIMO_ZONA_RURAL', label: 'Acréscimo Zona Rural (%)' },
  { value: 'TEMPO_ESPERA', label: 'Hora de Espera (R$/h)' },
  { value: 'PARADAS_ADICIONAIS', label: 'Parada Adicional (não cobrada)' },
  { value: 'PEDAGIO', label: 'Pedágio (lançado na corrida)' },
];

export const ContractCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingIa, setIsExtractingIa] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [iaResult, setIaResult] = useState<ExtracaoResultadoIa | null>(null);

  const {
    suppliers: suppliersList,
    setSuppliers: setSuppliersList,
    search: searchSuppliers,
    findSuppliers,
    isRemote: isSupplierSearchRemote,
    isLoading: isSearchingSuppliers,
  } = useSupplierSearch();
  const branchesList = useBranches();
  const [selectedSupplier, setSelectedSupplier] = useState<FornecedorDto | null>(null);
  const selectedSupplierId = selectedSupplier ? String(selectedSupplier.id) : '';
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [tiposCorrida, setTiposCorrida] = useState<TipoCorridaDto[]>([]);
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculoDto[]>([]);
  const [selectedTipoCorridaIds, setSelectedTipoCorridaIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    inicio: new Date().toISOString().slice(0, 10),
    vencimento: '',
    fileName: '',
  });

  const [regras, setRegras] = useState<EditableRegra[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Filiais e fornecedores vêm de useBranches e useSupplierSearch.
    Promise.allSettled([
      ridesApi.getTiposCorrida(),
      ridesApi.getTiposVeiculo(),
    ]).then(
      ([tiposCorridaRes, tiposVeiculoRes]) => {
        if (tiposCorridaRes.status === 'fulfilled') {
          const list = tiposCorridaRes.value?.response ?? [];
          setTiposCorrida(list);
          setSelectedTipoCorridaIds(list.map((tipo) => String(tipo.id)));
        }
        if (tiposVeiculoRes.status === 'fulfilled') {
          setTiposVeiculo(tiposVeiculoRes.value?.response ?? []);
        }
      }
    );
  }, []);

  const tipoCorridaOptions = useMemo<MultiSelectOption[]>(
    () => tiposCorrida.map((tipo) => ({ value: String(tipo.id), label: tipo.nome })),
    [tiposCorrida]
  );

  const tipoVeiculoOptions = useMemo<SelectOption[]>(
    () => [
      { value: QUALQUER_VEICULO, label: QUALQUER_VEICULO },
      ...tiposVeiculo.map((tipo) => ({ value: tipo.nome, label: tipo.nome })),
    ],
    [tiposVeiculo]
  );

  // A IA devolve o nome do veículo como está no PDF; sem correspondência no catálogo
  // a regra vale para qualquer veículo.
  const normalizarTipoVeiculo = (nome?: string | null): string =>
    tiposVeiculo.find((tipo) => tipo.nome.toLowerCase() === (nome ?? '').trim().toLowerCase())
      ?.nome ?? QUALQUER_VEICULO;

  const supplierOptions = useMemo<SearchableSelectOption[]>(
    () => suppliersList.map(supplierToOption),
    [suppliersList]
  );

  // O código da filial se repete entre empresas: a opção guarda os dois.
  const branchOptions = useMemo<SearchableSelectOption[]>(() => {
    return branchesList.map((b) => ({
      value: `${b.empresaId ?? ''}:${b.id}`,
      label: `${b.nome}${b.cnpj ? ` - CNPJ: ${b.cnpj}` : ''}`,
      searchText: branchSearchText(b),
    }));
  }, [branchesList]);
  const selectedBranch = branchesList.find((b) => `${b.empresaId ?? ''}:${b.id}` === selectedBranchId);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.inicio) errors.inicio = 'Data de início da vigência é obrigatória';
    if (!selectedFile) errors.file = 'O arquivo PDF do contrato é obrigatório';
    if (!selectedSupplierId) errors.fornecedor = 'Selecione o fornecedor contratado';
    if (!selectedBranchId) errors.filial = 'Selecione a filial atendida';
    if (selectedTipoCorridaIds.length === 0) {
      errors.tiposCorrida = 'Selecione ao menos um tipo de corrida atendido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExtrairComIa = async () => {
    if (!selectedFile) {
      showToast({
        type: 'warning',
        title: 'Nenhum arquivo anexado',
        description: 'Selecione um arquivo PDF para analisar com IA.',
      });
      return;
    }

    try {
      setIsExtractingIa(true);
      const resultado = await contractIaApi.extrairDados(selectedFile);
      setIaResult(resultado);

      if (resultado.datasNormalizadas?.dataVigenciaInicio) {
        updateField('inicio', resultado.datasNormalizadas.dataVigenciaInicio);
      }
      if (resultado.datasNormalizadas?.dataVigenciaFim) {
        updateField('vencimento', resultado.datasNormalizadas.dataVigenciaFim);
      }

      if (resultado.fornecedor?.nm_fornecedor || resultado.fornecedor?.cnpj_cpf) {
        const docCnpj = resultado.fornecedor.cnpj_cpf?.replace(/\D/g, '') || '';
        const docNome = (resultado.fornecedor.nm_fornecedor || '').toLowerCase();

        // Para o admin master a lista não vem carregada: busca o fornecedor do PDF no servidor.
        const candidatos = isSupplierSearchRemote
          ? await findSuppliers(docCnpj || resultado.fornecedor.nm_fornecedor || '').catch(() => [])
          : suppliersList;

        const match = candidatos.find((s) => {
          const sCnpj = (s.cnpjCpf || '').replace(/\D/g, '');
          if (docCnpj && sCnpj && sCnpj === docCnpj) return true;
          if (docNome && s.nome && s.nome.toLowerCase().includes(docNome)) return true;
          return false;
        });

        if (match) {
          if (isSupplierSearchRemote) setSuppliersList(candidatos);
          setSelectedSupplier(match);
        }
      }

      if (resultado.regras && resultado.regras.length > 0) {
        const loadedRegras: EditableRegra[] = resultado.regras.map((r, idx) => ({
          id: `ia-${idx}-${Date.now()}`,
          nr_prioridade: r.nr_prioridade || idx + 1,
          nm_tipo_regra: r.nm_tipo_regra || 'VALOR_POR_KM',
          nm_tipo_veiculo: normalizarTipoVeiculo(r.nm_tipo_veiculo),
          nr_valor_km: r.nr_valor_km ?? null,
          nr_valor_fixo: r.nr_valor_fixo ?? null,
          nr_percentual: r.nr_percentual ?? null,
          origem: 'ia',
        }));
        setRegras(loadedRegras);
      }

      const confiancaPct = Math.round((resultado.extracao?.confianca_geral ?? 0) * 100);
      showToast({
        type: 'success',
        title: 'Extração por IA concluída!',
        description: `Dados identificados com ${confiancaPct}% de confiança. Você pode conferir e ajustar as informações abaixo.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha na extração de dados com IA';
      showToast({
        type: 'error',
        title: 'Aviso de processamento por IA',
        description: `${msg}. Você pode preencher as informações do contrato manualmente.`,
      });
    } finally {
      setIsExtractingIa(false);
    }
  };

  const handleAddRegraManual = () => {
    const nextPriority = regras.length + 1;
    const novaRegra: EditableRegra = {
      id: `manual-${Date.now()}-${Math.random()}`,
      nr_prioridade: nextPriority,
      nm_tipo_regra: 'VALOR_POR_KM',
      nm_tipo_veiculo: QUALQUER_VEICULO,
      nr_valor_km: 3.5,
      nr_valor_fixo: null,
      nr_percentual: null,
      origem: 'manual',
    };
    setRegras((prev) => [...prev, novaRegra]);
  };

  const handleRemoveRegra = (id: string) => {
    setRegras((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRegra = (id: string, updates: Partial<EditableRegra>) => {
    setRegras((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, ...updates };
      })
    );
  };

  const montagemRegras = useMemo(
    () => montarRegrasContrato(regras, tiposVeiculo),
    [regras, tiposVeiculo]
  );

  const salvar = async (publicar: boolean) => {
    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Erro de validação',
        description:
          'Anexe o PDF e confira a vigência, o fornecedor, a filial e os tipos de corrida atendidos.',
      });
      return;
    }

    if (!selectedFile) return;

    const filial = selectedBranch;
    const { regras: regrasPayload, ignoradas } = montagemRegras;

    try {
      setIsLoading(true);

      const createRes = await contractApi.create({
        arquivo: selectedFile,
        dataVigenciaInicio: form.inicio,
        dataVigenciaFim: form.vencimento ? form.vencimento : undefined,
        empresaId: resolveEmpresaId(filial?.empresaId),
        filialId: Number(filial?.id),
        fornecedorId: Number(selectedSupplierId),
        tipoCorridaIds: selectedTipoCorridaIds.map(Number),
      });

      const createdId = createRes?.response?.id;

      if (createdId && regrasPayload.length > 0) {
        try {
          await contractApi.substituirRegras(createdId, regrasPayload);
        } catch (ruleErr) {
          const detalhe = ruleErr instanceof Error ? ruleErr.message : 'erro desconhecido';
          showToast({
            type: 'error',
            title: 'Contrato salvo como rascunho, mas as regras não foram gravadas',
            description: `${detalhe}. Confira as regras no detalhe do contrato antes de publicá-lo.`,
          });
          navigate(`/terceiros/contratos/${createdId}`);
          return;
        }
      }

      if (ignoradas.length > 0) {
        showToast({
          type: 'warning',
          title: 'Algumas cláusulas não viram regra de preço',
          description: `${[...new Set(ignoradas)].join('; ')}.`,
        });
      }

      if (createdId && publicar) {
        try {
          await contractApi.publicar(createdId);
        } catch (pubErr) {
          const detalhe = pubErr instanceof Error ? pubErr.message : 'erro desconhecido';
          showToast({
            type: 'error',
            title: 'Contrato salvo como rascunho, mas não foi publicado',
            description: `${detalhe}.`,
          });
          navigate(`/terceiros/contratos/${createdId}`);
          return;
        }
      }

      showToast({
        type: 'success',
        title: publicar ? 'Contrato publicado com sucesso!' : 'Contrato salvo como rascunho',
        description: publicar
          ? `O arquivo ${selectedFile.name} já vale para o cálculo das corridas.`
          : `O arquivo ${selectedFile.name} só entra no cálculo das corridas depois de publicado.`,
      });
      navigate('/terceiros/contratos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar contrato';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void salvar(false);
  };

  const selectedSupplierObj = selectedSupplier;

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Cadastrar Contrato de Terceiro</h2>
          <p>
            Anexe o contrato em PDF, extraia informações com IA ou preencha/ajuste manualmente o
            período, fornecedor, filial e regras tarifárias.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.layout}>
        <div className={styles.mainColumn}>
          {/* Card 1: Upload do PDF & IA */}
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>1. Instrumento Contratual (PDF) & Análise por IA</h3>
                <p>
                  Envie o contrato digitalizado. Você pode extrair datas, fornecedor e cláusulas com
                  o microserviço <code>frota-ia</code>.
                </p>
              </div>
            </div>

            <label className={styles.uploadBox}>
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
              <span className={styles.uploadIcon} aria-hidden="true">
                <CheckIcon width={22} height={22} />
              </span>
              <strong>{form.fileName || 'Selecionar documento em PDF *'}</strong>
              <small>Formato aceito: PDF até 20MB.</small>
            </label>
            {validationErrors.file && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
                {validationErrors.file}
              </p>
            )}

            {selectedFile && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtrairComIa}
                  isLoading={isExtractingIa}
                  disabled={isLoading}
                >
                  Analisar e Extrair Dados com IA (frota-ia)
                </Button>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Lê o PDF e preenche automaticamente vigência, regras e fornecedor sugerido.
                </span>
              </div>
            )}

            {iaResult && (
              <div className={styles.iaBanner}>
                <div className={styles.iaHeader}>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                    Resultado da Leitura Inteligente
                  </strong>
                  <span
                    className={`${styles.iaBadge} ${
                      (iaResult.extracao?.confianca_geral ?? 0) >= 0.7
                        ? styles.iaBadgeHigh
                        : styles.iaBadgeMid
                    }`}
                  >
                    Confiança: {Math.round((iaResult.extracao?.confianca_geral ?? 0) * 100)}%
                  </span>
                </div>

                {iaResult.fornecedor && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <strong>Fornecedor no texto:</strong>{' '}
                    {iaResult.fornecedor.nm_fornecedor || 'Não especificado'}
                    {iaResult.fornecedor.cnpj_cpf ? ` (CNPJ/CPF: ${iaResult.fornecedor.cnpj_cpf})` : ''}
                  </div>
                )}

                {iaResult.extracao?.observacoes && iaResult.extracao.observacoes.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    <em>Observações: {iaResult.extracao.observacoes.join('; ')}</em>
                  </div>
                )}
              </div>
            )}
          </article>

          {/* Card 2: Período e Vinculação (Editáveis) */}
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3>2. Vigência e Fornecedor Vinculado</h3>
                <p>
                  Confira as datas e vincule ao fornecedor credenciado e à filial correspondente.
                </p>
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

            <div className={styles.formGrid}>
              <SearchableSelect
                label="Fornecedor Vinculado *"
                placeholder="Selecione o fornecedor"
                searchPlaceholder={isSupplierSearchRemote ? 'Digite o nome ou o CNPJ/CPF' : 'Digite para buscar'}
                value={selectedSupplierId}
                options={supplierOptions}
                onSearch={searchSuppliers}
                isLoading={isSearchingSuppliers}
                selectedLabel={selectedSupplier ? supplierToOption(selectedSupplier).label : undefined}
                onChange={(val) => {
                  setSelectedSupplier(suppliersList.find((s) => String(s.id) === val) ?? null);
                  setValidationErrors((current) => ({ ...current, fornecedor: '' }));
                }}
                error={validationErrors.fornecedor}
                disabled={isLoading || isExtractingIa}
              />

              <SearchableSelect
                label="Filial de Vinculação *"
                placeholder="Selecione a filial"
                searchPlaceholder="Digite o nome, o código, o CNPJ ou a cidade"
                value={selectedBranchId}
                options={branchOptions}
                onChange={(val) => {
                  setSelectedBranchId(val);
                  setValidationErrors((current) => ({ ...current, filial: '' }));
                }}
                error={validationErrors.filial}
                disabled={isLoading || isExtractingIa}
              />
            </div>

            <MultiSelect
              label="Tipos de Corrida Atendidos *"
              placeholder="Selecione os tipos de corrida"
              values={selectedTipoCorridaIds}
              options={tipoCorridaOptions}
              onChange={(values) => {
                setSelectedTipoCorridaIds(values);
                setValidationErrors((current) => ({ ...current, tiposCorrida: '' }));
              }}
              error={validationErrors.tiposCorrida}
              disabled={isLoading || isExtractingIa}
            />
          </article>

          {/* Card 3: Cláusulas e Regras Tarifárias (Totalmente Editáveis) */}
          <article className={styles.card}>
            <div className={styles.rulesSection}>
              <div className={styles.rulesHeaderRow}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    3. Cláusulas e Regras Tarifárias ({regras.length})
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Você pode alterar os valores identificados pela IA ou adicionar novas regras
                    manualmente.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRegraManual}
                  disabled={isLoading || isExtractingIa}
                >
                  + Nova Cláusula Manual
                </Button>
              </div>

              {regras.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhuma cláusula tarifária cadastrada no momento. Você pode extrair com IA ao
                  anexar o PDF ou clicar em <strong>"+ Nova Cláusula Manual"</strong> para definir os
                  valores.
                </div>
              ) : (
                <div className={styles.rulesTableWrapper}>
                  <table className={styles.rulesTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '70px' }}>Item</th>
                        <th style={{ minWidth: '180px' }}>Tipo de Regra</th>
                        <th style={{ minWidth: '160px' }}>Tipo de Veículo</th>
                        <th style={{ minWidth: '140px' }}>Valor Aplicado</th>
                        <th style={{ width: '90px' }}>Origem</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regras.map((regra, index) => {
                        const isPercentual = regra.nm_tipo_regra === 'ACRESCIMO_ZONA_RURAL';
                        const isKm = regra.nm_tipo_regra === 'VALOR_POR_KM';
                        const currentVal = isKm
                          ? (regra.nr_valor_km ?? '')
                          : isPercentual
                          ? (regra.nr_percentual ?? '')
                          : (regra.nr_valor_fixo ?? '');

                        return (
                          <tr key={regra.id}>
                            <td>
                              <strong>#{regra.nr_prioridade || index + 1}</strong>
                            </td>
                            <td>
                              <select
                                className={styles.tableSelect}
                                value={regra.nm_tipo_regra}
                                onChange={(e) =>
                                  handleUpdateRegra(regra.id, {
                                    nm_tipo_regra: e.target.value,
                                    origem: 'manual',
                                  })
                                }
                                disabled={isLoading || isExtractingIa}
                              >
                                {TIPO_REGRA_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className={styles.tableSelect}
                                value={regra.nm_tipo_veiculo}
                                onChange={(e) =>
                                  handleUpdateRegra(regra.id, {
                                    nm_tipo_veiculo: e.target.value,
                                    origem: 'manual',
                                  })
                                }
                                disabled={isLoading || isExtractingIa}
                              >
                                {tipoVeiculoOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  {isPercentual ? '%' : 'R$'}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  className={styles.tableInput}
                                  value={currentVal}
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    const num = e.target.value === '' ? null : Number(e.target.value);
                                    if (isKm) {
                                      handleUpdateRegra(regra.id, {
                                        nr_valor_km: num,
                                        origem: 'manual',
                                      });
                                    } else if (isPercentual) {
                                      handleUpdateRegra(regra.id, {
                                        nr_percentual: num,
                                        origem: 'manual',
                                      });
                                    } else {
                                      handleUpdateRegra(regra.id, {
                                        nr_valor_fixo: num,
                                        origem: 'manual',
                                      });
                                    }
                                  }}
                                  disabled={isLoading || isExtractingIa}
                                />
                              </div>
                              {isKm && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Bandeirada R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className={styles.tableInput}
                                    value={regra.nr_valor_fixo ?? ''}
                                    placeholder="0.00"
                                    aria-label="Bandeirada (valor fixo da regra por km)"
                                    onChange={(e) =>
                                      handleUpdateRegra(regra.id, {
                                        nr_valor_fixo: e.target.value === '' ? null : Number(e.target.value),
                                        origem: 'manual',
                                      })
                                    }
                                    disabled={isLoading || isExtractingIa}
                                  />
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                className={`${styles.originBadge} ${
                                  regra.origem === 'ia' ? styles.originIa : styles.originManual
                                }`}
                              >
                                {regra.origem === 'ia' ? 'IA' : 'Manual'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => handleRemoveRegra(regra.id)}
                                disabled={isLoading || isExtractingIa}
                                title="Remover regra"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Aside: Resumo e Ações de Salvar */}
        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Resumo do Instrumento</span>

            <div className={styles.sideSummaryList}>
              <div className={styles.sideSummaryItem}>
                <span>Documento</span>
                <strong>{form.fileName || 'Nenhum selecionado'}</strong>
              </div>

              <div className={styles.sideSummaryItem}>
                <span>Fornecedor</span>
                <strong>{selectedSupplierObj ? selectedSupplierObj.nome : 'A definir'}</strong>
              </div>

              <div className={styles.sideSummaryItem}>
                <span>Início da Vigência</span>
                <strong>
                  {form.inicio ? new Date(form.inicio).toLocaleDateString('pt-BR') : '—'}
                </strong>
              </div>

              <div className={styles.sideSummaryItem}>
                <span>Término da Vigência</span>
                <strong>
                  {form.vencimento ? new Date(form.vencimento).toLocaleDateString('pt-BR') : 'Indeterminado'}
                </strong>
              </div>

              <div className={styles.sideSummaryItem}>
                <span>Cláusulas Tarifárias</span>
                <strong>{regras.length} regra(s) configurada(s)</strong>
              </div>
            </div>

            <div className={styles.primaryActions}>
              <Button
                type="button"
                onClick={() => void salvar(true)}
                isLoading={isLoading}
                disabled={isExtractingIa || montagemRegras.regras.length === 0}
                title={
                  montagemRegras.regras.length === 0
                    ? 'Cadastre ao menos uma regra de preço para publicar'
                    : undefined
                }
              >
                Salvar e Publicar
              </Button>
              <Button type="submit" variant="outline" isLoading={isLoading} disabled={isExtractingIa}>
                Salvar como Rascunho
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/terceiros/contratos')}
                disabled={isLoading || isExtractingIa}
              >
                Voltar para Contratos
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
