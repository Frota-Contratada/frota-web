import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '../../../assets/icons/check.svg?react';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import SetaSmIcon from '../../../assets/icons/seta-sm.svg?react';
import { Button, Input, Select, useToast } from '../../../components/common';
import { RouteMap, AddressAutocomplete } from '../../../components/maps';
import type { RoutePoint, RouteResult } from '../../../services/maps/routingService';
import type { SugestaoEndereco } from '../../../services/maps/geoService';
import {
  ridesApi,
  costCenterApi,
  supplierApi,
  collaboratorApi,
  extractListData,
  type MotivoSolicitacaoDto,
  type TipoCorridaDto,
  type CentroCustoDto,
  type FornecedorDto,
  type ColaboradorDto,
} from '../../../services';
import { useAuthStore } from '../../../stores/authStore';
import { cleanCpf, normalizeUf } from '../../../utils';
import styles from '../Review/RideReview.module.css';

type RequestStep = 1 | 2 | 3;

type InfoItemProps = {
  label: string;
  value: string;
};

const steps: { id: RequestStep; title: string }[] = [
  { id: 1, title: 'Dados da corrida' },
  { id: 2, title: 'Selecionar fornecedor' },
  { id: 3, title: 'Revisar solicitação' },
];

const defaultRideTypeOptions = [
  { label: 'Executiva', value: 'Executiva' },
  { label: 'Operacional', value: 'Operacional' },
  { label: 'Intermunicipal', value: 'Intermunicipal' },
  { label: 'Rota fixa', value: 'Rota fixa' },
  { label: 'Frota dedicada', value: 'Frota dedicada' },
];

const rideForOptions = [
  { label: 'Para mim', value: 'Para mim' },
  { label: 'Para outro colaborador', value: 'Para outro colaborador' },
  { label: 'Para visitante/terceiro', value: 'Para visitante/terceiro' },
];

const defaultReasonOptions = [
  { label: 'Reunião externa', value: 'Reunião externa' },
  { label: 'Visita técnica', value: 'Visita técnica' },
  { label: 'Viagem corporativa', value: 'Viagem corporativa' },
  { label: 'Transferência operacional', value: 'Transferência operacional' },
  { label: 'Recepção de fornecedor', value: 'Recepção de fornecedor' },
];

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className={styles.infoItem}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const RideRequestCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<RequestStep>(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState(0);
  const [backendMotivos, setBackendMotivos] = useState<MotivoSolicitacaoDto[]>([]);
  const [backendTiposCorrida, setBackendTiposCorrida] = useState<TipoCorridaDto[]>([]);
  const [backendCentrosCusto, setBackendCentrosCusto] = useState<CentroCustoDto[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<FornecedorDto[]>([]);
  const [collaboratorsList, setCollaboratorsList] = useState<ColaboradorDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userName = currentUser?.name || 'Usuário Atual';

  const [originLocation, setOriginLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
    cidade?: string;
    uf?: string;
  }>({
    address: '',
    lat: 0,
    lng: 0,
    cidade: '',
    uf: '',
  });

  const [destinationLocation, setDestinationLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
    cidade?: string;
    uf?: string;
  }>({
    address: '',
    lat: 0,
    lng: 0,
    cidade: '',
    uf: '',
  });

  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number>(0);
  const [calculatedDurationMin, setCalculatedDurationMin] = useState<number>(0);
  const [simulatedValue, setSimulatedValue] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [form, setForm] = useState({
    requester: userName,
    rideFor: 'Para mim',
    beneficiaryName: userName,
    origin: '',
    destination: '',
    rideAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    rideType: 'Executiva',
    costCenterIds: [] as string[],
    passengers: '1',
    passengerCpfs: [''],
    reason: 'Reunião externa',
  });

  useEffect(() => {
    if (currentUser?.name) {
      setForm((prev) => ({
        ...prev,
        requester: currentUser.name,
        beneficiaryName: prev.rideFor === 'Para mim' ? currentUser.name : prev.beneficiaryName,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    Promise.allSettled([
      ridesApi.getMotivos(),
      ridesApi.getTiposCorrida(),
      costCenterApi.list(),
      supplierApi.list(),
      collaboratorApi.list(),
    ]).then(([motivosRes, tiposRes, ccRes, suppRes, collabRes]) => {
      if (motivosRes.status === 'fulfilled') {
        const motivos = extractListData<MotivoSolicitacaoDto>(motivosRes.value);
        if (motivos.length > 0) setBackendMotivos(motivos);
      }
      if (tiposRes.status === 'fulfilled') {
        const tipos = extractListData<TipoCorridaDto>(tiposRes.value);
        if (tipos.length > 0) setBackendTiposCorrida(tipos);
      }
      if (ccRes.status === 'fulfilled') {
        const ccs = extractListData<CentroCustoDto>(ccRes.value);
        setBackendCentrosCusto(ccs);
        if (ccs.length > 0) {
          setForm((prev) => ({
            ...prev,
            costCenterIds: prev.costCenterIds.length > 0 ? prev.costCenterIds : [String(ccs[0].numero)],
          }));
        }
      }
      if (suppRes.status === 'fulfilled') {
        const supps = extractListData<FornecedorDto>(suppRes.value);
        if (supps.length > 0) {
          setAvailableSuppliers(supps);
          setSelectedSupplierId((prev) => prev || supps[0].id);
        }
      }
      if (collabRes.status === 'fulfilled') {
        const collabs = extractListData<ColaboradorDto>(collabRes.value);
        if (collabs.length > 0) setCollaboratorsList(collabs);
      }
    }).catch(() => {});
  }, []);

  const runSimulation = async (originLat?: number, originLng?: number, destLat?: number, destLng?: number) => {
    const latO = originLat ?? originLocation.lat;
    const lngO = originLng ?? originLocation.lng;
    const latD = destLat ?? destinationLocation.lat;
    const lngD = destLng ?? destinationLocation.lng;

    if (!form.origin || !form.destination || !latO || !latD) return;

    try {
      setIsSimulating(true);
      const selectedTipo = backendTiposCorrida.find((t) => t.nome === form.rideType);
      const res = await ridesApi.simular({
        dataCorrida: form.rideAt ? new Date(form.rideAt).toISOString() : new Date().toISOString(),
        tipoCorridaId: selectedTipo?.id ?? 1,
        origem: {
          logradouro: form.origin,
          cidade: originLocation.cidade || 'São Paulo',
          uf: normalizeUf(originLocation.uf),
          latitude: latO,
          longitude: lngO,
        },
        destino: {
          logradouro: form.destination,
          cidade: destinationLocation.cidade || originLocation.cidade || 'São Paulo',
          uf: normalizeUf(destinationLocation.uf || originLocation.uf),
          latitude: latD,
          longitude: lngD,
        },
      });

      if (res?.response) {
        if (typeof res.response.valorEstimado === 'number') {
          setSimulatedValue(res.response.valorEstimado);
        }
        if (typeof res.response.distanciaKm === 'number') {
          setCalculatedDistanceKm(res.response.distanciaKm);
        }
        if (typeof res.response.duracaoMinutos === 'number') {
          setCalculatedDurationMin(res.response.duracaoMinutos);
        }
      }
    } catch {
      setSimulatedValue(null);
    } finally {
      setIsSimulating(false);
    }
  };

  const beneficiaryOptions = useMemo(() => {
    if (collaboratorsList.length > 0) {
      return collaboratorsList.map((c) => ({ label: c.nome, value: c.nome }));
    }
    return [{ label: userName, value: userName }];
  }, [collaboratorsList, userName]);

  const selectedSupplier = useMemo(
    () => availableSuppliers.find((supplier) => supplier.id === selectedSupplierId),
    [availableSuppliers, selectedSupplierId]
  );

  const estimatedKm = calculatedDistanceKm > 0 ? `${calculatedDistanceKm.toLocaleString('pt-BR')} km` : 'A calcular';
  const estimatedValue = simulatedValue !== null
    ? `R$ ${simulatedValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : isSimulating
      ? 'Calculando simulação...'
      : 'A simular';

  const rideTypeOptions = backendTiposCorrida.length > 0
    ? backendTiposCorrida.map((t) => ({ label: t.nome, value: t.nome }))
    : defaultRideTypeOptions;

  const reasonOptions = backendMotivos.length > 0
    ? backendMotivos.map((m) => ({ label: m.nome, value: m.nome }))
    : defaultReasonOptions;

  const toggleCostCenter = (ccNumero: string) => {
    setForm((current) => {
      const exists = current.costCenterIds.includes(ccNumero);
      if (exists) {
        if (current.costCenterIds.length === 1) {
          showToast({
            type: 'warning',
            title: 'Centro de custo',
            description: 'Pelo menos um centro de custo deve permanecer selecionado.',
          });
          return current;
        }
        return {
          ...current,
          costCenterIds: current.costCenterIds.filter((id) => id !== ccNumero),
        };
      }
      return {
        ...current,
        costCenterIds: [...current.costCenterIds, ccNumero],
      };
    });
  };

  const selectedSupplierName = selectedSupplier?.nome ?? 'Fornecedor não selecionado';
  const requesterEmployee = collaboratorsList.find((c) => c.nome === form.requester);
  const selectedBeneficiary = collaboratorsList.find((c) => c.nome === form.beneficiaryName);
  const selectedBeneficiaryCpf = selectedBeneficiary?.cpf ?? currentUser?.cpf ?? '';
  const isRideForSelf = form.rideFor === 'Para mim';

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectOrigin = (sug: SugestaoEndereco) => {
    setOriginLocation({
      address: sug.displayName,
      lat: sug.latitude,
      lng: sug.longitude,
      cidade: sug.cidade || '',
      uf: sug.uf || '',
    });
    updateField('origin', sug.displayName);
    if (destinationLocation.address) {
      runSimulation(sug.latitude, sug.longitude, destinationLocation.lat, destinationLocation.lng);
    }
  };

  const handleSelectDestination = (sug: SugestaoEndereco) => {
    setDestinationLocation({
      address: sug.displayName,
      lat: sug.latitude,
      lng: sug.longitude,
      cidade: sug.cidade || '',
      uf: sug.uf || '',
    });
    updateField('destination', sug.displayName);
    if (originLocation.address) {
      runSimulation(originLocation.lat, originLocation.lng, sug.latitude, sug.longitude);
    }
  };

  const handleRouteCalculated = (res: RouteResult) => {
    if (res.distanceKm > 0) {
      setCalculatedDistanceKm(res.distanceKm);
      setCalculatedDurationMin(res.durationMinutes);
      runSimulation();
    }
  };

  const routePoints: RoutePoint[] = useMemo(() => {
    const pts: RoutePoint[] = [];
    if (originLocation.lat && originLocation.lng) {
      pts.push({ lat: originLocation.lat, lng: originLocation.lng, label: 'Origem: ' + form.origin, type: 'origin' });
    }
    if (destinationLocation.lat && destinationLocation.lng) {
      pts.push({ lat: destinationLocation.lat, lng: destinationLocation.lng, label: 'Destino: ' + form.destination, type: 'destination' });
    }
    return pts;
  }, [originLocation, destinationLocation, form.origin, form.destination]);

  const updateRideFor = (value: string) => {
    setForm((current) => {
      const beneficiaryName = value === 'Para mim' ? current.requester : '';
      const beneficiaryCpf = value === 'Para mim' ? requesterEmployee?.cpf ?? currentUser?.cpf ?? '' : '';

      return {
        ...current,
        rideFor: value,
        beneficiaryName,
        passengerCpfs: current.passengerCpfs.map((cpf, index) => (index === 0 ? beneficiaryCpf : cpf)),
      };
    });
  };

  const updateBeneficiary = (value: string) => {
    const beneficiary = collaboratorsList.find((c) => c.nome === value);

    setForm((current) => ({
      ...current,
      beneficiaryName: value,
      passengerCpfs: current.passengerCpfs.map((cpf, index) => (index === 0 ? beneficiary?.cpf ?? '' : cpf)),
    }));
  };

  const updatePassengers = (value: string) => {
    const count = Math.max(1, Number(value) || 1);

    setForm((current) => ({
      ...current,
      passengers: String(count),
      passengerCpfs: Array.from({ length: count }, (_, index) => (index === 0 ? selectedBeneficiaryCpf : current.passengerCpfs[index] ?? '')),
    }));
  };

  const updatePassengerCpf = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      passengerCpfs: current.passengerCpfs.map((cpf, cpfIndex) => (cpfIndex === index ? value : cpf)),
    }));
  };

  const passengerCount = Math.max(1, Number(form.passengers) || 1);

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      const requiredFields = [
        form.requester,
        form.rideFor,
        form.beneficiaryName,
        form.rideType,
        form.origin,
        form.destination,
        form.rideAt,
        form.passengers,
        form.reason,
      ];
      const hasEmptyField = requiredFields.some((field) => field.trim().length === 0);
      const hasMissingCostCenter = form.costCenterIds.length === 0;
      const hasMissingCpf = passengerCount > 1 && Array.from({ length: passengerCount }, (_, index) => {
        const cpf = index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index] ?? '';
        return cleanCpf(cpf).length !== 11;
      }).some(Boolean);

      if (hasEmptyField || hasMissingCostCenter || hasMissingCpf) {
        showToast({
          type: 'warning',
          title: 'Campos obrigatórios',
          description: hasMissingCostCenter
            ? 'Selecione ao menos um centro de custo antes de continuar.'
            : 'Preencha todos os campos marcados com * antes de continuar.',
        });
        return false;
      }
    }

    if (currentStep === 2 && !selectedSupplier) {
      showToast({
        type: 'warning',
        title: 'Fornecedor obrigatório',
        description: 'Selecione um fornecedor antes de continuar.',
      });
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    runSimulation();
    setCurrentStep((step) => Math.min(step + 1, 3) as RequestStep);
  };
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1) as RequestStep);

  const submitRequest = async () => {
    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);
      const selectedTipo = backendTiposCorrida.find((t) => t.nome === form.rideType);
      const selectedMotivo = backendMotivos.find((m) => m.nome === form.reason);
      const selectedCcIds = form.costCenterIds.length > 0
        ? form.costCenterIds.map((id) => Number(id)).filter(Boolean)
        : [backendCentrosCusto[0]?.numero || 101];

      const origemCidade = originLocation.cidade || destinationLocation.cidade || 'São Paulo';
      const origemUf = normalizeUf(originLocation.uf || destinationLocation.uf);
      const destinoCidade = destinationLocation.cidade || originLocation.cidade || 'São Paulo';
      const destinoUf = normalizeUf(destinationLocation.uf || originLocation.uf);

      const passengerList = Array.from({ length: passengerCount }, (_, index) => {
        const cpfRaw = index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index] ?? '';
        const name = index === 0 ? form.beneficiaryName : `Passageiro ${index + 1}`;
        const clean = cleanCpf(cpfRaw);
        return {
          nome: name,
          cpf: clean || undefined,
          solicitante: index === 0 && isRideForSelf,
        };
      });

      const companionCpfs = form.passengerCpfs
        .slice(1)
        .map(cleanCpf)
        .filter((c) => c.length === 11);

      await ridesApi.create({
        dataCorrida: new Date(form.rideAt).toISOString(),
        tipoCorridaId: selectedTipo?.id ?? 1,
        motivoSolicitacaoId: selectedMotivo?.id ?? 1,
        fornecedorId: selectedSupplierId || undefined,
        origem: {
          logradouro: form.origin,
          cidade: origemCidade,
          uf: origemUf,
          latitude: originLocation.lat,
          longitude: originLocation.lng,
        },
        destino: {
          logradouro: form.destination,
          cidade: destinoCidade,
          uf: destinoUf,
          latitude: destinationLocation.lat,
          longitude: destinationLocation.lng,
        },
        centrosCustoIds: selectedCcIds,
        passageiros: passengerList,
        cpfsAcompanhantes: companionCpfs.length > 0 ? companionCpfs : undefined,
      });

      showToast({
        type: 'success',
        title: 'Solicitação criada com sucesso',
        description: `A corrida para ${form.destination} foi enviada.`,
      });
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar solicitação de corrida';
      showToast({
        type: 'error',
        title: 'Erro ao solicitar corrida',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCcObjects = backendCentrosCusto.filter((c) => form.costCenterIds.includes(String(c.numero)));
  const costCenterSummaryLabel = selectedCcObjects.length > 0
    ? selectedCcObjects.map((cc) => `${cc.nome} (Nº ${cc.numero})`).join(', ')
    : form.costCenterIds.map((id) => `CC-${id}`).join(', ') || 'Nenhum';

  return (
    <div className={styles.page}>
      <nav className={styles.stepper} aria-label="Etapas da solicitação">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <div
              key={step.id}
              className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className={styles.stepNumber}>{isDone ? <CheckIcon width={14} height={14} /> : step.id}</span>
              <span className={styles.stepLabel}>{step.title}</span>
            </div>
          );
        })}
      </nav>

      <section className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          {currentStep === 1 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Dados da corrida</h3>
                  <p>Informe origem, destino e detalhes necessários para solicitar a corrida.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <Input label="Solicitante" value={form.requester} disabled required />
                <Select label="Corrida para" value={form.rideFor} options={rideForOptions} onChange={updateRideFor} required />
                <Select label="Nome de quem vai usar" value={form.beneficiaryName} options={beneficiaryOptions} onChange={updateBeneficiary} disabled={isRideForSelf} required />
                <Select label="Tipo de corrida" value={form.rideType} options={rideTypeOptions} onChange={(value) => updateField('rideType', value)} required />

                <AddressAutocomplete
                  label="Local de partida (Origem)"
                  placeholder="Digite endereço, local ou CEP de partida"
                  value={form.origin}
                  onChange={(val) => updateField('origin', val)}
                  onSelectAddress={handleSelectOrigin}
                  required
                />

                <AddressAutocomplete
                  label="Destino final"
                  placeholder="Digite endereço, local ou CEP de destino"
                  value={form.destination}
                  onChange={(val) => updateField('destination', val)}
                  onSelectAddress={handleSelectDestination}
                  required
                />

                <Input label="Data e horário" type="datetime-local" value={form.rideAt} onChange={(event) => updateField('rideAt', event.target.value)} required />
                <Input label="Passageiros" type="number" min="1" value={form.passengers} onChange={(event) => updatePassengers(event.target.value)} required />
                <Select label="Motivo" value={form.reason} options={reasonOptions} onChange={(value) => updateField('reason', value)} required />

                <div className={styles.costCenterSection}>
                  <div className={styles.costCenterHeader}>
                    <strong>Centros de custo *</strong>
                    <span>{form.costCenterIds.length} selecionado{form.costCenterIds.length === 1 ? '' : 's'} (rateio igual)</span>
                  </div>
                  <div className={styles.costCenterChips} role="group" aria-label="Centros de custo">
                    {backendCentrosCusto.map((cc) => {
                      const isSelected = form.costCenterIds.includes(String(cc.numero));
                      return (
                        <button
                          key={cc.numero}
                          type="button"
                          className={`${styles.costCenterChip} ${isSelected ? styles.costCenterChipActive : ''}`}
                          onClick={() => toggleCostCenter(String(cc.numero))}
                          aria-pressed={isSelected}
                        >
                          {isSelected && (
                            <span className={styles.costCenterCheckIcon}>
                              <CheckIcon width={12} height={12} />
                            </span>
                          )}
                          <span>{cc.nome} (Nº {cc.numero})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {passengerCount > 1 && (
                <div className={styles.passengerSection}>
                  <div className={styles.sectionInlineHeader}>
                    <strong>CPFs dos passageiros</strong>
                    <span>{passengerCount} passageiros</span>
                  </div>
                  <div className={styles.passengerGrid}>
                    {Array.from({ length: passengerCount }, (_, index) => (
                      <Input
                        key={`passenger-cpf-${index}`}
                        label={index === 0 ? 'CPF do colaborador 1' : `CPF do passageiro ${index + 1}`}
                        mask="cpf"
                        value={index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index] ?? ''}
                        disabled={index === 0}
                        required
                        onChange={(event) => updatePassengerCpf(index, event.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Selecionar fornecedor</h3>
                  <p>Escolha o fornecedor responsável pela execução da corrida.</p>
                </div>
              </div>

              <div className={styles.supplierGrid} role="radiogroup" aria-label="Selecionar fornecedor">
                {availableSuppliers.map((supplier) => {
                  const isSelected = supplier.id === selectedSupplierId;

                  return (
                    <button
                      key={supplier.id}
                      type="button"
                      className={`${styles.supplierOption} ${isSelected ? styles.supplierSelected : ''}`}
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <span className={styles.supplierOptionHeader}>
                        <span className={styles.radioControl} aria-hidden="true" />
                        <strong>{supplier.nome}</strong>
                      </span>
                      <span>{supplier.cnpjCpf ? `CNPJ: ${supplier.cnpjCpf}` : 'Fornecedor Credenciado'}</span>
                      <span>{supplier.quantidadeVeiculosAtivos ? `${supplier.quantidadeVeiculosAtivos} veículos disponíveis` : 'Ativo para atendimento'}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Revisar solicitação</h3>
                  <p>Confira os dados e o trajeto antes de confirmar a solicitação.</p>
                </div>
              </div>

              <div className={styles.reviewSummaryGrid}>
                <InfoItem label="Solicitante" value={form.requester} />
                <InfoItem label="Corrida para" value={form.rideFor} />
                <InfoItem label="Quem vai usar" value={form.beneficiaryName} />
                <InfoItem label="Fornecedor selecionado" value={selectedSupplierName} />
                <InfoItem label="Centro de custo" value={costCenterSummaryLabel} />
                <InfoItem label="Tipo de corrida" value={form.rideType} />
                <InfoItem label="Data e horário" value={form.rideAt.replace('T', ' ')} />
                <InfoItem label="Valor estimado" value={estimatedValue} />
                <InfoItem label="Distância estimada" value={estimatedKm} />
                <InfoItem label="Tempo estimado" value={`${calculatedDurationMin} minutos`} />
                <InfoItem label="Passageiros" value={form.passengers} />
              </div>

              <div className={styles.routeCard}>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.originDot} aria-hidden="true" />Origem</span>
                  <strong>{form.origin}</strong>
                </div>
                <span className={styles.routeArrowWrapper} aria-hidden="true">
                  <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
                </span>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.destinationDot} aria-hidden="true" />Destino</span>
                  <strong>{form.destination}</strong>
                </div>
              </div>

              {passengerCount > 1 && (
                <div className={styles.passengerSummary}>
                  <span>CPFs dos passageiros</span>
                  <div className={styles.passengerCpfList}>
                    {Array.from({ length: passengerCount }, (_, index) => {
                      const cpf = index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index];

                      return (
                        <div className={styles.passengerCpfItem} key={`summary-cpf-${index}`}>
                          <span>Passageiro {index + 1}</span>
                          <strong>{cpf || 'CPF não informado'}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.reasonBox}>
                <span>Motivo</span>
                <p>{form.reason}</p>
              </div>
            </>
          )}
        </article>

        <aside className={styles.sidePanel} aria-label="Ações da solicitação">
          <div style={{ marginBottom: '1.25rem' }}>
            <RouteMap
              points={routePoints}
              height={260}
              onRouteCalculated={handleRouteCalculated}
            />
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações da solicitação</span>

            <div className={styles.primaryActions}>
              {currentStep < 3 ? (
                <Button onClick={goNext}>Próximo</Button>
              ) : (
                <Button leftIcon={<CheckIcon width={16} height={16} />} onClick={submitRequest} isLoading={isSubmitting}>Confirmar solicitação</Button>
              )}
              {currentStep > 1 && <Button variant="outline" onClick={goBack}>Voltar</Button>}
            </div>

            <div className={styles.dangerZone}>
              <Button variant="ghost" leftIcon={<ErroIcon width={14} height={14} />} onClick={() => navigate('/corridas/solicitacoes')}>
                Cancelar solicitação
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
