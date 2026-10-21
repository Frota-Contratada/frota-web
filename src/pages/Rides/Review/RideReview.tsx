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

import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../stores/authStore';

type ReviewStep = 1 | 2 | 3;

type SupplierOption = {
  id: number;
  nome: string;
  detalhe: string;
};

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type InfoItemProps = {
  label: string;
  value: string;
};

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
  const currentUser = useAuthStore((state) => state.user);
  const { can, isRequester, isAdminMaster } = usePermissions();

  const [solicitacao, setSolicitacao] = useState<SolicitacaoDto | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(0);
  const [hasCandidateList, setHasCandidateList] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReviewStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPrimaryApprover = useMemo(() => {
    if (!solicitacao || !currentUser?.id) return true;
    const centros = solicitacao.centrosCusto || solicitacao.CentrosCusto || [];
    if (centros.length <= 1) return true;
    const primeiroCentro = centros[0];
    const userIdNum = Number(currentUser.id);
    return Boolean(
      primeiroCentro?.aprovadorId != null &&
      (primeiroCentro.aprovadorId === userIdNum || String(primeiroCentro.aprovadorId) === currentUser.id)
    );
  }, [solicitacao, currentUser]);

  const reviewSteps = useMemo<{ id: number; title: string }[]>(() => {
    if (isPrimaryApprover) {
      return [
        { id: 1, title: 'Informações da corrida' },
        { id: 2, title: 'Selecionar fornecedor' },
        { id: 3, title: 'Revisar tudo' },
      ];
    }
    return [
      { id: 1, title: 'Informações da corrida' },
      { id: 2, title: 'Revisar tudo' },
    ];
  }, [isPrimaryApprover]);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<MotivoSolicitacaoDto[]>([]);
  const [selectedCancelReasonId, setSelectedCancelReasonId] = useState<string>('1');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasons, setRejectReasons] = useState<MotivoSolicitacaoDto[]>([]);
  const [selectedRejectReasonId, setSelectedRejectReasonId] = useState<string>('1');

  useEffect(() => {
    let isMounted = true;
    if (requestId && !isNaN(Number(requestId))) {
      Promise.allSettled([
        ridesApi.getById(Number(requestId)),
        ridesApi.getFornecedoresCandidatos(Number(requestId)),
        ridesApi.getMotivosCancelamento(),
        ridesApi.getMotivosRecusa(),
      ]).then(async ([reqRes, candRes, motivosCancelRes, motivosRecusaRes]) => {
        if (!isMounted) return;
        const request = reqRes.status === 'fulfilled' ? reqRes.value.response : undefined;
        if (request) {
          setSolicitacao(request);
        }
        if (candRes.status === 'fulfilled') {
          // Só fornecedores com contrato publicado que atende a corrida, com o valor de cada um.
          const candidatos = candRes.value?.response ?? [];
          setHasCandidateList(true);
          setAvailableSuppliers(
            candidatos.map((c) => ({
              id: c.fornecedorId,
              nome: c.fornecedorNome,
              detalhe: `Valor estimado: ${formatCurrency(Number(c.valorEstimado))}`,
            }))
          );
          const preselected = candidatos.find((c) => c.selecionado) ?? candidatos[0];
          if (preselected) setSelectedSupplierId(preselected.fornecedorId);
        } else {
          try {
            const supps = extractListData<FornecedorDto>(await supplierApi.list());
            if (!isMounted) return;
            setAvailableSuppliers(supps.map((s) => ({ id: s.id, nome: s.nome, detalhe: `CNPJ/CPF: ${s.cnpjCpf}` })));
            const preselected = supps.find((s) => s.id === request?.fornecedorId) ?? supps[0];
            if (preselected) setSelectedSupplierId(preselected.id);
          } catch {
            setAvailableSuppliers([]);
          }
        }
        if (motivosCancelRes.status === 'fulfilled' && motivosCancelRes.value?.response) {
          const motivos = extractListData<MotivoSolicitacaoDto>(motivosCancelRes.value);
          if (motivos.length > 0) {
            setCancelReasons(motivos);
            setSelectedCancelReasonId(String(motivos[0].id));
          }
        }
        if (motivosRecusaRes.status === 'fulfilled' && motivosRecusaRes.value?.response) {
          const motivos = extractListData<MotivoSolicitacaoDto>(motivosRecusaRes.value);
          if (motivos.length > 0) {
            setRejectReasons(motivos);
            setSelectedRejectReasonId(String(motivos[0].id));
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

  const originText = solicitacao?.localPartida
    || solicitacao?.origem?.descricao
    || (solicitacao?.origem
      ? `${solicitacao.origem.logradouro}${solicitacao.origem.numero ? `, ${solicitacao.origem.numero}` : ''}, ${solicitacao.origem.cidade} - ${solicitacao.origem.uf}`
      : 'Origem da Corrida');

  const destinationText = solicitacao?.localDestino
    || solicitacao?.destino?.descricao
    || (solicitacao?.destino
      ? `${solicitacao.destino.logradouro}${solicitacao.destino.numero ? `, ${solicitacao.destino.numero}` : ''}, ${solicitacao.destino.cidade} - ${solicitacao.destino.uf}`
      : 'Destino da Corrida');

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
    const orig = (solicitacao as any)?.origem || (solicitacao as any)?.enderecoOrigem;
    const origLat = orig?.latitude ?? orig?.lat ?? (solicitacao as any)?.origemLatitude;
    const origLng = orig?.longitude ?? orig?.lng ?? (solicitacao as any)?.origemLongitude;

    if (origLat != null && origLng != null && !isNaN(Number(origLat)) && !isNaN(Number(origLng))) {
      pts.push({
        lat: Number(origLat),
        lng: Number(origLng),
        label: `Origem: ${originText}`,
        type: 'origin',
      });
    }

    const dest = (solicitacao as any)?.destino || (solicitacao as any)?.enderecoDestino;
    const destLat = dest?.latitude ?? dest?.lat ?? (solicitacao as any)?.destinoLatitude;
    const destLng = dest?.longitude ?? dest?.lng ?? (solicitacao as any)?.destinoLongitude;

    if (destLat != null && destLng != null && !isNaN(Number(destLat)) && !isNaN(Number(destLng))) {
      pts.push({
        lat: Number(destLat),
        lng: Number(destLng),
        label: `Destino: ${destinationText}`,
        type: 'destination',
      });
    }
    return pts;
  }, [solicitacao, originText, destinationText]);

  const goNext = () => setCurrentStep((step) => Math.min(step + 1, reviewSteps.length) as ReviewStep);
  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1) as ReviewStep);

  const handleApprove = async () => {
    if (!solicitacao) return;

    try {
      setIsSubmitting(true);
      const fornecedorFinal = isPrimaryApprover ? (selectedSupplierId || undefined) : undefined;
      try {
        await ridesApi.aprovar(solicitacao.id, fornecedorFinal);
      } catch (firstErr: any) {
        const msg = firstErr?.message || '';
        if ((msg.includes('deve escolher um fornecedor') || msg.includes('fornecedor')) && !fornecedorFinal && selectedSupplierId) {
          await ridesApi.aprovar(solicitacao.id, selectedSupplierId);
        } else if ((msg.includes('não autorizado') || msg.includes('Não informe fornecedor')) && fornecedorFinal) {
          await ridesApi.aprovar(solicitacao.id, undefined);
        } else {
          throw firstErr;
        }
      }
      showToast({
        type: 'success',
        title: 'Solicitação aprovada',
        description: `A solicitação #${solicitacao.id} foi aprovada com sucesso.`,
      });
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao aprovar solicitação no servidor';
      showToast({
        type: 'error',
        title: 'Erro na aprovação',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!solicitacao) return;
    try {
      setIsSubmitting(true);
      const motivoId = Number(selectedRejectReasonId) || 1;
      await ridesApi.rejeitar(solicitacao.id, motivoId);
      showToast({
        type: 'warning',
        title: 'Solicitação reprovada',
        description: `A solicitação #${solicitacao.id} foi reprovada.`,
      });
      setIsRejectModalOpen(false);
      navigate('/corridas/solicitacoes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao reprovar solicitação no servidor';
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
      <nav className={styles.stepper} aria-label="Etapas da revisão">
        {reviewSteps.map((step) => {
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

          {isPrimaryApprover && currentStep === 2 && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Selecionar fornecedor</h3>
                  <p>
                    {hasCandidateList
                      ? 'Fornecedores com contrato vigente para esta corrida. O de menor valor já vem marcado.'
                      : 'Escolha a empresa que atenderá essa solicitação.'}
                  </p>
                </div>
              </div>

              {availableSuppliers.length === 0 && (
                <p>Nenhum fornecedor com contrato publicado atende esta corrida. A aprovação usa o fornecedor já gravado na solicitação, se houver.</p>
              )}

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
                        <span>{supplier.detalhe}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {((isPrimaryApprover && currentStep === 3) || (!isPrimaryApprover && currentStep === 2)) && (
            <>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Revisar tudo</h3>
                  <p>Valide os principais dados antes de finalizar.</p>
                </div>
              </div>

              <div className={styles.reviewSummaryGrid}>
                <InfoItem label="Solicitante" value={solicitacao.solicitanteNome || 'Colaborador Solicitante'} />
                {isPrimaryApprover && <InfoItem label="Fornecedor selecionado" value={selectedSupplierName} />}
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
              {(solicitacao.status === 'P' || String(solicitacao.status).toUpperCase().startsWith('P')) ? (
                <>
                  {currentStep < reviewSteps.length ? (
                    <Button onClick={goNext}>Próximo passo</Button>
                  ) : (
                    <Button
                      leftIcon={<CheckIcon width={16} height={16} />}
                      onClick={handleApprove}
                      isLoading={isSubmitting}
                    >
                      Aprovar solicitação
                    </Button>
                  )}
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
                      Voltar passo
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => navigate('/corridas/solicitacoes')}>
                  Voltar às solicitações
                </Button>
              )}
            </div>

            {(solicitacao.status === 'P' || String(solicitacao.status).toUpperCase().startsWith('P')) && (
              <div className={styles.dangerZone}>
                {can('rides:reject') && (
                  <Button
                    className={styles.rejectButton}
                    variant="outline"
                    leftIcon={<ErroIcon width={14} height={14} />}
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Reprovar solicitação
                  </Button>
                )}
                {(isRequester || isAdminMaster) && (
                  <Button
                    className={styles.modalCancelButton}
                    variant="outline"
                    leftIcon={<ErroIcon width={14} height={14} />}
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Cancelar solicitação
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate('/corridas/solicitacoes')} disabled={isSubmitting}>
                  Voltar à lista
                </Button>
              </div>
            )}
          </div>
        </aside>
      </section>

      {isRejectModalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="reject-modal-title">Reprovar solicitação #{solicitacao.id}</h3>
              <p>Selecione o motivo da reprovação desta solicitação.</p>
            </div>

            <Select
              label="Motivo da reprovação *"
              value={selectedRejectReasonId}
              onChange={(val) => setSelectedRejectReasonId(val)}
              options={rejectReasons.map((m) => ({ label: m.nome, value: String(m.id) }))}
            />

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button
                variant="primary"
                className={styles.rejectButton}
                onClick={handleReject}
                isLoading={isSubmitting}
              >
                Confirmar reprovação
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="cancel-modal-title">Cancelar solicitação #{solicitacao.id}</h3>
              <p>Confirme o cancelamento desta corrida. Esta ação cancelará o pedido de transporte.</p>
            </div>

            <Select
              label="Motivo do cancelamento *"
              value={selectedCancelReasonId}
              onChange={(val) => setSelectedCancelReasonId(val)}
              options={cancelReasons.map((m) => ({ label: m.nome, value: String(m.id) }))}
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
