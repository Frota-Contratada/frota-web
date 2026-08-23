import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, LoadingState, Select, useToast } from '../../components/common';
import { LocationPickerMap } from '../../components/maps';
import { branchApi, geoService } from '../../services';
import { stateSelectOptions } from '../../utils';
import styles from '../Rides/RideReview.module.css';

const stateOptions = stateSelectOptions;

export const BranchEdit = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    number: '100',
    neighborhood: '',
    city: '',
    state: 'SC',
    zipCode: '',
    costCenters: '1',
    suppliers: '1',
    latitude: -26.9078,
    longitude: -48.6619,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branchId && !isNaN(Number(branchId))) {
      setIsInitialLoading(true);
      branchApi.getById(Number(branchId)).then((res) => {
        if (res.response) {
          const b = res.response;
          setForm({
            name: b.nome || '',
            address: b.endereco?.logradouro || '',
            number: b.endereco?.numero || '100',
            neighborhood: b.endereco?.bairro || '',
            city: b.endereco?.cidade || '',
            state: b.endereco?.uf || 'SC',
            zipCode: b.endereco?.cep || '',
            costCenters: '1',
            suppliers: '1',
            latitude: b.endereco?.latitude || -26.9078,
            longitude: b.endereco?.longitude || -48.6619,
          });
        }
      }).catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar filial';
        showToast({ type: 'error', title: message });
      }).finally(() => {
        setIsInitialLoading(false);
      });
    } else {
      setIsInitialLoading(false);
    }
  }, [branchId, showToast]);

  const updateField = (field: keyof typeof form, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    updateField('zipCode', formatted);

    if (raw.length === 8) {
      setIsSearchingCep(true);
      try {
        const endereco = await geoService.buscarEnderecoPorCep(raw);
        if (endereco) {
          setForm((current) => ({
            ...current,
            address: endereco.logradouro || current.address,
            neighborhood: endereco.bairro || current.neighborhood,
            city: endereco.cidade || current.city,
            state: endereco.uf || current.state,
            latitude: endereco.latitude || current.latitude,
            longitude: endereco.longitude || current.longitude,
          }));
        }
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleLocationChange = async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    updateField('latitude', latitude);
    updateField('longitude', longitude);

    const geoData = await geoService.geocodificarCoordenadas(latitude, longitude);
    if (geoData) {
      if (geoData.logradouro) updateField('address', geoData.logradouro);
      if (geoData.bairro) updateField('neighborhood', geoData.bairro);
      if (geoData.cidade) updateField('city', geoData.cidade);
      if (geoData.uf) updateField('state', geoData.uf);
      if (geoData.cep) updateField('zipCode', geoData.cep);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Nome da filial é obrigatório';
    if (!form.address.trim()) errors.address = 'Endereço é obrigatório';
    if (!form.city.trim()) errors.city = 'Cidade é obrigatória';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, corrija os erros.' });
      return;
    }

    try {
      setIsLoading(true);
      if (branchId && !isNaN(Number(branchId))) {
        await branchApi.update(Number(branchId), {
          nome: form.name,
          endereco: {
            logradouro: form.address,
            numero: form.number || '100',
            bairro: form.neighborhood,
            cidade: form.city,
            uf: form.state,
            cep: form.zipCode.replace(/\D/g, ''),
            latitude: form.latitude,
            longitude: form.longitude,
          },
        });
      }

      showToast({
        type: 'success',
        title: 'Filial atualizada',
        description: `As informações de ${form.name} foram atualizadas com sucesso.`,
      });
      navigate(`/filiais/${branchId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar filial';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="card"
          message="Carregando dados da filial"
          submessage="Preparando formulário de edição..."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Editar Filial — {form.name || 'Filial'}</h2>
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
              placeholder="00000-000"
              value={form.zipCode}
              onChange={(e) => handleCepChange(e.target.value)}
              disabled={isLoading || isSearchingCep}
              rightIcon={isSearchingCep ? <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Buscando...</span> : undefined}
            />

            <Input
              label="Endereço (Rua, Av.)"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              error={validationErrors.address}
              required
              disabled={isLoading}
            />

            <Input
              label="Número"
              value={form.number}
              onChange={(e) => updateField('number', e.target.value)}
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

          <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Localização da Filial no Mapa
            </span>
            <LocationPickerMap
              latitude={form.latitude}
              longitude={form.longitude}
              label={form.name || 'Filial'}
              height={300}
              onChange={handleLocationChange}
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
                onClick={() => navigate(`/filiais/${branchId}`)}
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
