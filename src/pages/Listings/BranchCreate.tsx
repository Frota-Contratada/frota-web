import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, useToast } from '../../components/common';
import { LocationPickerMap } from '../../components/maps';
import { branchApi, collaboratorApi, geoService, extractListData, type ColaboradorDto } from '../../services';
import { useAuthStore } from '../../stores/authStore';
import styles from '../Rides/RideReview.module.css';

const stateOptions = [
  { label: 'São Paulo - SP', value: 'SP' },
  { label: 'Santa Catarina - SC', value: 'SC' },
  { label: 'Paraná - PR', value: 'PR' },
  { label: 'Pernambuco - PE', value: 'PE' },
  { label: 'Rio de Janeiro - RJ', value: 'RJ' },
  { label: 'Minas Gerais - MG', value: 'MG' },
  { label: 'Rio Grande do Sul - RS', value: 'RS' },
  { label: 'Mato Grosso do Sul - MS', value: 'MS' },
  { label: 'Goiás - GO', value: 'GO' },
];

export const BranchCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [collaboratorsList, setCollaboratorsList] = useState<ColaboradorDto[]>([]);

  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    administradorId: currentUser?.id ? String(currentUser.id) : '',
    zipCode: '',
    address: '',
    number: '100',
    neighborhood: '',
    city: '',
    state: '',
    costCentersCount: '1',
    suppliersCount: '0',
    latitude: -26.9078,
    longitude: -48.6619,
  });

  useEffect(() => {
    collaboratorApi.list().then((res) => {
      const collabs = extractListData<ColaboradorDto>(res);
      if (collabs.length > 0) {
        setCollaboratorsList(collabs);
        setForm((prev) => ({
          ...prev,
          administradorId: prev.administradorId || String(collabs[0].id),
        }));
      }
    }).catch(() => {});
  }, []);

  const adminOptions = [
    ...(currentUser?.id
      ? [{ label: `${currentUser.name} (Você - Atual)`, value: String(currentUser.id) }]
      : []),
    ...collaboratorsList
      .filter((c) => String(c.id) !== String(currentUser?.id))
      .map((c) => ({ label: `${c.nome} (${c.email})`, value: String(c.id) })),
  ];

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof form, value: string | number) => {
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
          showToast({
            type: 'success',
            title: 'Endereço localizado',
            description: `${endereco.cidade} - ${endereco.uf}`,
          });
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showToast({ type: 'error', title: 'Erro de validação', description: 'Por favor, preencha os campos obrigatórios.' });
      return;
    }

    const adminId = Number(form.administradorId || currentUser?.id || 1);

    try {
      setIsLoading(true);
      await branchApi.create({
        nome: form.name,
        cnpj: form.cnpj.replace(/\D/g, ''),
        administradorId: adminId,
        endereco: {
          cep: form.zipCode.replace(/\D/g, ''),
          logradouro: form.address,
          numero: form.number || '100',
          bairro: form.neighborhood,
          cidade: form.city,
          uf: form.state,
          latitude: form.latitude,
          longitude: form.longitude,
        },
      });

      showToast({
        type: 'success',
        title: 'Filial cadastrada',
        description: `A filial ${form.name} foi adicionada à base de dados.`,
      });
      navigate('/filiais');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar filial';
      showToast({ type: 'error', title: message });
    } finally {
      setIsLoading(false);
    }
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

            {adminOptions.length > 0 && (
              <Select
                label="Administrador Responsável da Filial"
                value={form.administradorId}
                options={adminOptions}
                onChange={(val) => updateField('administradorId', val)}
                required
              />
            )}
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Endereço e Localização</h3>
              <p>Informe o CEP para autopreenchimento e ajuste o pin no mapa.</p>
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
              disabled={isLoading || isSearchingCep}
              rightIcon={isSearchingCep ? <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Buscando...</span> : undefined}
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
              label="Número"
              placeholder="100"
              value={form.number}
              onChange={(e) => updateField('number', e.target.value)}
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

          <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Ponto da Filial no Mapa
            </span>
            <LocationPickerMap
              latitude={form.latitude}
              longitude={form.longitude}
              label={form.name || 'Nova Filial'}
              height={300}
              onChange={handleLocationChange}
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
