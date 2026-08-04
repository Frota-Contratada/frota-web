import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import SetaSmIcon from '../../assets/icons/seta-sm.svg?react';
import { Button, Input, Select, useToast } from '../../components/common';
import { employees } from '../Listings/listingsData';
import { suppliers } from '../Suppliers/suppliersData';
import styles from './RideReview.module.css';

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

const rideTypeOptions = [
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

const reasonOptions = [
  { label: 'Reunião externa', value: 'Reunião externa' },
  { label: 'Visita técnica', value: 'Visita técnica' },
  { label: 'Viagem corporativa', value: 'Viagem corporativa' },
  { label: 'Transferência operacional', value: 'Transferência operacional' },
  { label: 'Recepção de fornecedor', value: 'Recepção de fornecedor' },
];

const beneficiaryOptions = employees
  .filter((employee) => !employee.deactivatedAt && !employee.supplier)
  .map((employee) => ({ label: employee.name, value: employee.name }));

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className={styles.infoItem}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const RideRequestCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const availableSuppliers = suppliers.filter((supplier) => supplier.status === 'aprovado');
  const [currentStep, setCurrentStep] = useState<RequestStep>(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState(0);
  const [form, setForm] = useState({
    requester: 'Marina Oliveira',
    rideFor: '',
    beneficiaryName: '',
    origin: '',
    destination: '',
    rideAt: '',
    rideType: '',
    costCenter: '',
    passengers: '1',
    passengerCpfs: [''],
    reason: '',
  });

  const selectedSupplier = useMemo(
    () => availableSuppliers.find((supplier) => supplier.id === selectedSupplierId),
    [availableSuppliers, selectedSupplierId]
  );

  const estimatedKm = '18,6 km';
  const estimatedValue = 'R$ 148,90';
  const selectedSupplierName = selectedSupplier?.name ?? 'Fornecedor não selecionado';
  const requesterEmployee = employees.find((employee) => employee.name === form.requester);
  const selectedBeneficiary = employees.find((employee) => employee.name === form.beneficiaryName);
  const selectedBeneficiaryCpf = selectedBeneficiary?.cpf ?? '';
  const isRideForSelf = form.rideFor === 'Para mim';

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRideFor = (value: string) => {
    setForm((current) => {
      const beneficiaryName = value === 'Para mim' ? current.requester : '';
      const beneficiaryCpf = value === 'Para mim' ? requesterEmployee?.cpf ?? '' : '';

      return {
        ...current,
        rideFor: value,
        beneficiaryName,
        passengerCpfs: current.passengerCpfs.map((cpf, index) => (index === 0 ? beneficiaryCpf : cpf)),
      };
    });
  };

  const updateBeneficiary = (value: string) => {
    const beneficiary = employees.find((employee) => employee.name === value);

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
        form.costCenter,
        form.reason,
      ];
      const hasEmptyField = requiredFields.some((field) => field.trim().length === 0);
      const hasMissingCpf = passengerCount > 1 && Array.from({ length: passengerCount }, (_, index) => {
        const cpf = index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index] ?? '';
        return cpf.trim().length === 0;
      }).some(Boolean);

      if (hasEmptyField || hasMissingCpf) {
        showToast({
          type: 'warning',
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos marcados com * antes de continuar.',
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

    setCurrentStep((step) => Math.min(step + 1, 3) as RequestStep);
  };
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1) as RequestStep);

  const submitRequest = () => {
    if (!validateCurrentStep()) return;

    showToast({
      type: 'success',
      title: 'Solicitação criada',
      description: `A corrida para ${form.destination} foi solicitada com sucesso.`,
    });
    navigate('/corridas/solicitacoes');
  };

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
                <Input label="Local de partida" value={form.origin} onChange={(event) => updateField('origin', event.target.value)} required />
                <Input label="Destino" value={form.destination} onChange={(event) => updateField('destination', event.target.value)} required />
                <Input label="Data e horário" type="datetime-local" value={form.rideAt} onChange={(event) => updateField('rideAt', event.target.value)} required />
                <Input label="Passageiros" type="number" min="1" value={form.passengers} onChange={(event) => updatePassengers(event.target.value)} required />
                <Input label="Centro de custo" value={form.costCenter} onChange={(event) => updateField('costCenter', event.target.value)} required />
                <Select label="Motivo" value={form.reason} options={reasonOptions} onChange={(value) => updateField('reason', value)} required />
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
                        value={index === 0 ? selectedBeneficiaryCpf : form.passengerCpfs[index] ?? ''}
                        maxLength={11}
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
                        <strong>{supplier.name}</strong>
                      </span>
                      <span>{supplier.vehicles} veículos disponíveis</span>
                      <span>{supplier.linkedContracts} contratos vinculados</span>
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
                  <p>Confira os dados antes de confirmar a solicitação.</p>
                </div>
              </div>

              <div className={styles.reviewSummaryGrid}>
                <InfoItem label="Solicitante" value={form.requester} />
                <InfoItem label="Corrida para" value={form.rideFor} />
                <InfoItem label="Quem vai usar" value={form.beneficiaryName} />
                <InfoItem label="Fornecedor selecionado" value={selectedSupplierName} />
                <InfoItem label="Tipo de corrida" value={form.rideType} />
                <InfoItem label="Data e horário" value={form.rideAt.replace('T', ' ')} />
                <InfoItem label="Valor estimado" value={estimatedValue} />
                <InfoItem label="Distância estimada" value={estimatedKm} />
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
          <div className={styles.mapCard}>
            <div className={styles.mapHeader}>
              <span>Estimativa</span>
              <strong>{estimatedKm}</strong>
            </div>
            <div className={styles.mapPreview} aria-hidden="true">
              <span className={styles.mapPinStart} />
              <span className={styles.mapPinEnd} />
              <span className={styles.mapRoute} />
            </div>
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações da solicitação</span>

            <div className={styles.primaryActions}>
              {currentStep < 3 ? (
                <Button onClick={goNext}>Próximo</Button>
              ) : (
                <Button leftIcon={<CheckIcon width={16} height={16} />} onClick={submitRequest}>Confirmar solicitação</Button>
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
