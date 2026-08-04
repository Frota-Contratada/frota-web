import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import SetaSmIcon from '../../assets/icons/seta-sm.svg?react';
import { Button, useToast } from '../../components/common';
import { rideRequests } from '../Listings/listingsData';
import { suppliers } from '../Suppliers/suppliersData';
import styles from './RideReview.module.css';

type ReviewStep = 1 | 2 | 3;

type InfoItemProps = {
  label: string;
  value: string;
};

const steps: { id: ReviewStep; title: string }[] = [
  { id: 1, title: 'Informações da corrida' },
  { id: 2, title: 'Selecionar fornecedor' },
  { id: 3, title: 'Revisar tudo' },
];

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className={styles.infoItem}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const RideReview = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const request = rideRequests.find((item) => item.id === Number(requestId));
  const availableSuppliers = suppliers.filter((supplier) => supplier.status === 'aprovado');
  const initialSupplier = availableSuppliers.find((supplier) => supplier.name === request?.supplier) ?? availableSuppliers[0];
  const [currentStep, setCurrentStep] = useState<ReviewStep>(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplier?.id ?? 0);

  const selectedSupplier = useMemo(
    () => availableSuppliers.find((supplier) => supplier.id === selectedSupplierId) ?? availableSuppliers[0],
    [availableSuppliers, selectedSupplierId]
  );

  if (!request) {
    return <Navigate to="/corridas/solicitacoes" replace />;
  }

  const costCenter = '3144 - Conta 4442';
  const estimatedKm = `${request.estimatedDistanceKm.toLocaleString('pt-BR')} km`;
  const selectedSupplierName = selectedSupplier?.name ?? 'Fornecedor não selecionado';

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, 3) as ReviewStep);
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1) as ReviewStep);

  const finishReview = () => {
    showToast({
      type: 'success',
      title: 'Solicitação aprovada',
      description: `${selectedSupplierName} foi vinculado à solicitação #${request.id}.`,
    });
    navigate('/corridas/solicitacoes');
  };

  const rejectReview = () => {
    showToast({
      type: 'warning',
      title: 'Solicitação reprovada',
      description: `A solicitação #${request.id} foi devolvida para ajustes.`,
    });
    navigate('/corridas/solicitacoes');
  };

  return (
    <div className={styles.page}>
      <nav className={styles.stepper} aria-label="Etapas da revisão">
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
                  <h3>Informações da corrida</h3>
                  <p>Dados informados pelo solicitante e calculados pelo sistema.</p>
                </div>
                <span className={styles.requestCode}>#{request.id}</span>
              </div>

              <div className={styles.infoGrid}>
                <InfoItem label="Solicitante" value={request.requester} />
                <InfoItem label="Data da corrida" value={request.rideAt} />
                <InfoItem label="Tipo de corrida" value={request.rideType} />
                <InfoItem label="Distância estimada" value={estimatedKm} />
                <InfoItem label="Valor estimado" value={request.estimatedValue} />
                <InfoItem label="Centro de custo" value={costCenter} />
                <InfoItem label="Passageiros" value={String(request.passengers)} />
                <InfoItem label="Fornecedor sugerido" value={request.supplier} />
              </div>

              <div className={styles.routeCard}>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.originDot} aria-hidden="true" />Origem</span>
                  <strong>{request.origin}</strong>
                </div>
                <span className={styles.routeArrowWrapper} aria-hidden="true">
                  <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
                </span>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.destinationDot} aria-hidden="true" />Destino</span>
                  <strong>{request.destination}</strong>
                </div>
              </div>

              <div className={styles.reasonBox}>
                <span>Motivo</span>
                <p>{request.reason}</p>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Selecionar fornecedor</h3>
                  <p>Escolha um terceiro ativo para executar a corrida.</p>
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
                  <h3>Revisar tudo</h3>
                  <p>Valide os principais dados antes de finalizar.</p>
                </div>
              </div>

              <div className={styles.reviewSummaryGrid}>
                <InfoItem label="Solicitante" value={request.requester} />
                <InfoItem label="Fornecedor selecionado" value={selectedSupplierName} />
                <InfoItem label="Data" value={request.rideAt} />
                <InfoItem label="Valor estimado" value={request.estimatedValue} />
              </div>

              <div className={styles.routeCard}>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.originDot} aria-hidden="true" />Origem</span>
                  <strong>{request.origin}</strong>
                </div>
                <span className={styles.routeArrowWrapper} aria-hidden="true">
                  <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
                </span>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.destinationDot} aria-hidden="true" />Destino</span>
                  <strong>{request.destination}</strong>
                </div>
              </div>
            </>
          )}
        </article>

        <aside className={styles.sidePanel} aria-label="Resumo da revisão">
          <div className={styles.mapCard}>
            <div className={styles.mapHeader}>
              <span>Trajeto</span>
              <strong>{estimatedKm}</strong>
            </div>
            <div className={styles.mapPreview} aria-hidden="true">
              <span className={styles.mapPinStart} />
              <span className={styles.mapPinEnd} />
              <span className={styles.mapRoute} />
            </div>
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações da revisão</span>

            <div className={styles.primaryActions}>
              {currentStep < 3 ? (
                <Button onClick={goNext}>Próximo</Button>
              ) : (
                <Button leftIcon={<CheckIcon width={16} height={16} />} onClick={finishReview}>Finalizar revisão</Button>
              )}
              {currentStep > 1 && <Button variant="outline" onClick={goBack}>Voltar</Button>}
            </div>

            <div className={styles.dangerZone}>
              <Button className={styles.rejectButton} variant="outline" leftIcon={<ErroIcon width={14} height={14} />} onClick={rejectReview}>
                Reprovar solicitação
              </Button>
              <Button variant="ghost" onClick={() => navigate('/corridas/solicitacoes')}>
                Cancelar revisão
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
