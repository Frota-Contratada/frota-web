import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CheckIcon from '../../../assets/icons/check.svg?react';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import SetaSmIcon from '../../../assets/icons/seta-sm.svg?react';
import { Button, LoadingState, Select, useToast } from '../../../components/common';
import { RouteMap } from '../../../components/maps';
import type { RoutePoint } from '../../../services/maps/routingService';
import { ridesApi, supplierApi, extractListData, type SolicitacaoDto, type FornecedorDto, type MotivoSolicitacaoDto } from '../../../services';
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

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<MotivoSolicitacaoDto[]>([]);
  const [selectedCancelReasonId, setSelectedCancelReasonId] = useState<string>('1');

  useEffect(() => {
    let isMounted = true;
    if (requestId && !isNaN(Number(requestId))) {
      Promise.allSettled([
        ridesApi.getById(Number(requestId)),
        supplierApi.list(),
        ridesApi.getMotivosCancelamento(),
      ]).then(([reqRes, suppRes, motivosCancelRes]) => {
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
        if (motivosCancelRes.status === 'fulfilled' && motivosCancelRes.value?.response) {
          const motivos = extractListData<MotivoSolicitacaoDto>(motivosCancelRes.value);
          if (motivos.length > 0) {
            setCancelReasons(motivos);
            setSelectedCancelReasonId(String(motivos[0].id));
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

  const cancelReview = async () => {
    if (!solicitacao) return;
    try {
      setIsSubmitting(true);
      const motivoId = Number(selectedCancelReasonId) || 1;
      await ridesApi.cancelar(solicitacao.id, motivoId);
      showToast({
        type: 'warning',
        title: 'Solicitação cancelada',
        description: `A solicitação #${solicitacao.id} foi cancelada com sucesso.`,
      });
      setIsCancelModalOpen(false);
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao cancelar solicitação no servidor';
      showToast({
        type: 'error',
        title: 'Erro no cancelamento',
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
      {solicitacao.valorEstimado && Number(solicitacao.valorEstimado) > 0 && (
        <div className={styles.priceNoticeBanner} role="status">
          <div>
            <strong>Aviso de Atualização Tarifária:</strong> O valor desta solicitação ({estimatedValue}) foi calculado com base na quilometragem estimada ({estimatedKm}) e na tabela de preços do fornecedor selecionado.
          </div>
        </div>
      )}

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
                <InfoItem
                  label="Data da corrida"
                  value={solicitacao.dataCorrida ? new Date(solicitacao.dataCorrida).toLocaleString('pt-BR') : '—'}
                />
                <InfoItem label="Tipo de corrida" value={solicitacao.tipoCorrida?.nome || 'Executiva'} />
                <InfoItem label="Centro de custo" value={costCentersText} />
                <InfoItem
                  label="Passageiros"
                  value={`${(solicitacao.passageiros || solicitacao.Passageiros)?.length || 1} passageiro(s)`}
                />
                <InfoItem
                  label="Motivo da solicitação"
                  value={solicitacao.motivoSolicitacao?.nome || solicitacao.motivo?.nome || 'Deslocamento a serviço'}
                />
                <InfoItem label="Status da solicitação" value={solicitacao.status || 'Pendente'} />
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
                  <p>Escolha a empresa que atenderá essa solicitação.</p>
                </div>
              </div>

              <div className={styles.supplierGrid} role="radiogroup" aria-label="Fornecedores disponíveis">
                {availableSuppliers.map((supplier) => {
                  const isSelected = supplier.id === selectedSupplierId;

                  return (
                    <label
                      key={supplier.id}
                      className={`${styles.supplierOption} ${isSelected ? styles.supplierOptionSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="supplier"
                        value={supplier.id}
                        checked={isSelected}
                        onChange={() => setSelectedSupplierId(supplier.id)}
                      />
                      <span className={styles.radioCustom} aria-hidden="true" />
                      <div className={styles.supplierMeta}>
                        <strong>{supplier.nome}</strong>
                        <span>CNPJ/CPF: {supplier.cnpjCpf}</span>
                      </div>
                    </label>
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
              <Button
                className={styles.modalCancelButton}
                variant="outline"
                leftIcon={<ErroIcon width={14} height={14} />}
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isSubmitting}
              >
                Cancelar solicitação
              </Button>
              <Button variant="ghost" onClick={() => navigate('/corridas/solicitacoes')} disabled={isSubmitting}>
                Voltar à lista
              </Button>
            </div>
          </div>
        </aside>
      </section>

      {isCancelModalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="cancel-modal-title">Cancelar solicitação #{solicitacao.id}</h3>
              <p>Confirme o cancelamento desta corrida. Esta ação invalidará o pedido de transporte.</p>
            </div>

            <Select
              label="Motivo do cancelamento *"
              value={selectedCancelReasonId}
              onChange={(val) => setSelectedCancelReasonId(val)}
              options={
                cancelReasons.length > 0
                  ? cancelReasons.map((m) => ({ label: m.nome, value: String(m.id) }))
                  : [
                      { label: 'Mudança de agenda / Reunião cancelada', value: '1' },
                      { label: 'Solicitação duplicada', value: '2' },
                      { label: 'Alteração no trajeto ou horário', value: '3' },
                      { label: 'Desistência do passageiro', value: '4' },
                    ]
              }
            />

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button
                variant="primary"
                className={styles.modalCancelButton}
                onClick={cancelReview}
                isLoading={isSubmitting}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
