import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../assets/icons/check.svg?react';
import ErroIcon from '../../assets/icons/erro.svg?react';
import SetaSmIcon from '../../assets/icons/seta-sm.svg?react';
import { Button, LoadingState, useToast } from '../../components/common';
import { RouteMap } from '../../components/maps';
import type { RoutePoint } from '../../services/maps/routingService';
import { ridesApi, supplierApi, extractListData, type SolicitacaoDto, type FornecedorDto } from '../../services';
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

  const [solicitacao, setSolicitacao] = useState<SolicitacaoDto | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<FornecedorDto[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(0);
  const [currentStep, setCurrentStep] = useState<ReviewStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (requestId && !isNaN(Number(requestId))) {
      Promise.allSettled([
        ridesApi.getById(Number(requestId)),
        supplierApi.list(),
      ]).then(([reqRes, suppRes]) => {
        if (!isMounted) return;
        if (reqRes.status === 'fulfilled' && reqRes.value.response) {
          setSolicitacao(reqRes.value.response);
        }
        if (suppRes.status === 'fulfilled') {
          const supps = extractListData<FornecedorDto>(suppRes.value);
          if (supps.length > 0) {
            setAvailableSuppliers(supps);
            setSelectedSupplierId(supps[0].id);
          }
        }
      }).finally(() => {
        if (isMounted) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      navigate('/corridas/solicitacoes');
    }

    return () => {
      isMounted = false;
    };
  }, [requestId, navigate]);

  const selectedSupplier = useMemo(
    () => availableSuppliers.find((supplier) => supplier.id === selectedSupplierId) ?? availableSuppliers[0],
    [availableSuppliers, selectedSupplierId]
  );

  const selectedSupplierName = selectedSupplier?.nome || 'Fornecedor Selecionado';

  const originText = solicitacao?.origem
    ? `${solicitacao.origem.logradouro}, ${solicitacao.origem.cidade} - ${solicitacao.origem.uf}`
    : 'Origem da Corrida';

  const destinationText = solicitacao?.destino
    ? `${solicitacao.destino.logradouro}, ${solicitacao.destino.cidade} - ${solicitacao.destino.uf}`
    : 'Destino da Corrida';

  const costCentersText = (solicitacao?.centrosCusto || solicitacao?.CentrosCusto) && (solicitacao?.centrosCusto || solicitacao?.CentrosCusto)!.length > 0
    ? (solicitacao?.centrosCusto || solicitacao?.CentrosCusto)!.map((cc) => cc.centroCustoNome || `CC #${cc.centroCustoId}`).join(', ')
    : 'Centro de custo padrão';

  const estimatedKm = solicitacao?.distanciaEstimadaKm || solicitacao?.distanciaKm
    ? `${Number(solicitacao.distanciaEstimadaKm || solicitacao.distanciaKm).toLocaleString('pt-BR')} km`
    : 'A calcular';

  const estimatedValue = solicitacao?.valorEstimado
    ? `R$ ${Number(solicitacao.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'R$ 0,00';

  const routePoints: RoutePoint[] = useMemo(() => {
    const pts: RoutePoint[] = [];
    if (solicitacao?.origem?.latitude && solicitacao?.origem?.longitude) {
      pts.push({
        lat: solicitacao.origem.latitude,
        lng: solicitacao.origem.longitude,
        label: `Origem: ${originText}`,
        type: 'origin',
      });
    }
    if (solicitacao?.destino?.latitude && solicitacao?.destino?.longitude) {
      pts.push({
        lat: solicitacao.destino.latitude,
        lng: solicitacao.destino.longitude,
        label: `Destino: ${destinationText}`,
        type: 'destination',
      });
    }
    return pts;
  }, [solicitacao, originText, destinationText]);

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, 3) as ReviewStep);
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1) as ReviewStep);

  const finishReview = async () => {
    if (!solicitacao) return;
    try {
      setIsSubmitting(true);
      await ridesApi.aprovar(solicitacao.id);
      showToast({
        type: 'success',
        title: 'Solicitação aprovada',
        description: `A solicitação #${solicitacao.id} foi aprovada com sucesso.`,
      });
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao aprovar a solicitação no servidor';
      showToast({
        type: 'error',
        title: 'Erro na aprovação',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rejectReview = async () => {
    if (!solicitacao) return;
    try {
      setIsSubmitting(true);
      await ridesApi.rejeitar(solicitacao.id, 'Reprovado na revisão de rota');
      showToast({
        type: 'warning',
        title: 'Solicitação reprovada',
        description: `A solicitação #${solicitacao.id} foi recusada.`,
      });
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao recusar a solicitação no servidor';
      showToast({
        type: 'error',
        title: 'Erro na reprovação',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando dados da solicitação"
          submessage="Buscando detalhes do trajeto e opções de fornecedores..."
        />
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Solicitação não encontrada</h2>
          <Button variant="outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/corridas/solicitacoes')}>
            Voltar para solicitações
          </Button>
        </div>
      </div>
    );
  }

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
                  <p>Confira os dados enviados para a solicitação de transporte.</p>
                </div>
              </div>

              <div className={styles.infoGrid}>
                <InfoItem label="Solicitante" value={solicitacao.solicitanteNome || 'Colaborador Solicitante'} />
                <InfoItem label="Quem vai usar" value={solicitacao.solicitanteNome || 'Colaborador Solicitante'} />
                <InfoItem label="Tipo de corrida" value={solicitacao.tipoCorrida?.nome || 'Executiva'} />
                <InfoItem
                  label="Data e horário"
                  value={solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleString('pt-BR') : '—'}
                />
                <InfoItem label="Passageiros" value={`${solicitacao.Passageiros?.length || 1} pessoa(s)`} />
                <InfoItem label="Centro de custo" value={costCentersText} />
                <InfoItem label="Valor Estimado" value={estimatedValue} />
                <InfoItem label="Distância Estimada" value={estimatedKm} />
              </div>

              <div className={styles.routeCard}>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.originDot} aria-hidden="true" />Origem</span>
                  <strong>{originText}</strong>
                </div>

                <span className={styles.routeArrowWrapper} aria-hidden="true">
                  <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
                </span>

                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.destinationDot} aria-hidden="true" />Destino</span>
                  <strong>{destinationText}</strong>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Selecionar fornecedor</h3>
                  <p>Escolha um fornecedor credenciado para atender a corrida.</p>
                </div>
              </div>

              <div className={styles.supplierGrid} role="radiogroup" aria-label="Selecionar fornecedor">
                {availableSuppliers.map((supplier) => {
                  const isSelected = supplier.id === selectedSupplierId;
                  const name = supplier.nome || `Fornecedor #${supplier.id}`;

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
                        <strong>{name}</strong>
                      </span>
                      <span>{supplier.cnpjCpf ? `CNPJ: ${supplier.cnpjCpf}` : 'Fornecedor Ativo'}</span>
                      <span>Disponível para atendimento imediato</span>
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
                <InfoItem label="Solicitante" value={solicitacao.solicitanteNome || 'Colaborador Solicitante'} />
                <InfoItem label="Fornecedor selecionado" value={selectedSupplierName} />
                <InfoItem
                  label="Data da corrida"
                  value={solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleString('pt-BR') : '—'}
                />
                <InfoItem label="Valor estimado" value={estimatedValue} />
                <InfoItem label="Distância estimada" value={estimatedKm} />
                <InfoItem label="Centro de custo" value={costCentersText} />
              </div>

              <div className={styles.routeCard}>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.originDot} aria-hidden="true" />Origem</span>
                  <strong>{originText}</strong>
                </div>
                <span className={styles.routeArrowWrapper} aria-hidden="true">
                  <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
                </span>
                <div className={styles.routePoint}>
                  <span className={styles.routeLabel}><i className={styles.destinationDot} aria-hidden="true" />Destino</span>
                  <strong>{destinationText}</strong>
                </div>
              </div>
            </>
          )}
        </article>

        <aside className={styles.sidePanel} aria-label="Resumo da revisão">
          <div style={{ marginBottom: '1.25rem' }}>
            <RouteMap points={routePoints} height={260} />
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Ações da revisão</span>

            <div className={styles.primaryActions}>
              {currentStep < 3 ? (
                <Button onClick={goNext}>Próximo</Button>
              ) : (
                <Button leftIcon={<CheckIcon width={16} height={16} />} onClick={finishReview} isLoading={isSubmitting}>
                  Finalizar revisão
                </Button>
              )}
              {currentStep > 1 && (
                <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
                  Voltar
                </Button>
              )}
            </div>

            <div className={styles.dangerZone}>
              <Button
                className={styles.rejectButton}
                variant="outline"
                leftIcon={<ErroIcon width={14} height={14} />}
                onClick={rejectReview}
                isLoading={isSubmitting}
              >
                Reprovar solicitação
              </Button>
              <Button variant="ghost" onClick={() => navigate('/corridas/solicitacoes')} disabled={isSubmitting}>
                Cancelar revisão
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
