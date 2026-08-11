import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, StatusBadge, useToast } from '../../components/common';
import SetaSmIcon from '../../assets/icons/seta-sm.svg?react';
import { rideHistory, rideRequests, type RideStatus } from '../Listings/listingsData';
import styles from './RideReview.module.css';

const rideStatusBadgeMap: Record<RideStatus, 'em_andamento' | 'aprovado' | 'cancelado'> = {
  I: 'em_andamento',
  F: 'aprovado',
  C: 'cancelado',
};

export const RideDetails = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { showToast } = useToast();

  const ride = rideHistory.find((item) => item.id === Number(rideId));
  const associatedRequest = ride ? rideRequests.find((req) => req.id === ride.requestId) : null;

  if (!ride) {
    return <Navigate to="/corridas/historico" replace />;
  }

  const handlePrintReceipt = () => {
    showToast({
      type: 'success',
      title: 'Gerando recibo',
      description: `O recibo da corrida #${ride.id} está pronto para impressão.`,
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.detailHeader}>
        <div>
          <h2>Corrida #{ride.id}</h2>
          <p>Solicitação #{ride.requestId} • {ride.supplier}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={handlePrintReceipt}>
            Imprimir Recibo
          </Button>
          <Button variant="outline" onClick={() => navigate('/corridas/historico')}>
            Voltar ao histórico
          </Button>
        </div>
      </section>

      <div className={styles.reviewLayout}>
        <article className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Informações do Trajeto</h3>
              <p>Origem, destino e horários registrados do percurso.</p>
            </div>
            <StatusBadge status={rideStatusBadgeMap[ride.status]} />
          </div>

          <div className={styles.routeCard}>
            <div className={styles.routePoint}>
              <span className={styles.routeLabel}>
                <i className={styles.originDot} aria-hidden="true" />
                Origem
              </span>
              <strong>{associatedRequest?.origin || 'Seara Itajaí'}</strong>
            </div>

            <span className={styles.routeArrowWrapper} aria-hidden="true">
              <SetaSmIcon width={10} height={10} className={styles.routeArrow} />
            </span>

            <div className={styles.routePoint}>
              <span className={styles.routeLabel}>
                <i className={styles.destinationDot} aria-hidden="true" />
                Destino
              </span>
              <strong>{associatedRequest?.destination || 'Aeroporto / Destino Final'}</strong>
            </div>
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Execução da Corrida</h3>
              <p>Horários de início/término e medição de distância.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Horário de Início</span>
              <strong>{ride.startedAt}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Horário de Término</span>
              <strong>{ride.finishedAt ?? 'Em andamento'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Distância Percorrida</span>
              <strong>{ride.distanceKm > 0 ? `${ride.distanceKm.toLocaleString('pt-BR')} km` : '—'}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Categoria do Veículo</span>
              <strong>{ride.vehicleType}</strong>
            </div>
          </div>

          <div className={styles.cardHeader} style={{ marginTop: '2.5rem' }}>
            <div>
              <h3>Motorista e Veículo</h3>
              <p>Identificação do condutor e placa associada.</p>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Motorista</span>
              <strong>{ride.driver}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Placa do Veículo</span>
              <strong>{ride.vehiclePlate}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Fornecedor</span>
              <strong>{ride.supplier}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Status Operacional</span>
              <strong>{ride.status === 'F' ? 'Concluída' : ride.status === 'I' ? 'Em trânsito' : 'Cancelada'}</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Demonstrativo de Valores</span>

            <div className={styles.summaryList}>
              <div>
                <span>Valor da corrida</span>
                <strong>{ride.finalValue}</strong>
              </div>

              <div>
                <span>Despesas extras / Pedágio</span>
                <strong>{ride.extraExpenses}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Total Faturado</span>
                <strong style={{ color: 'var(--brand-primary)', fontSize: '1.125rem' }}>{ride.finalValue}</strong>
              </div>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <span className={styles.actionsTitle}>Dados da Solicitação</span>

            <div className={styles.summaryList}>
              <div>
                <span>Solicitante</span>
                <strong>{associatedRequest?.requester || 'Marina Oliveira'}</strong>
              </div>

              <div>
                <span>Motivo corporativo</span>
                <strong>{associatedRequest?.reason || 'Reunião Externa'}</strong>
              </div>

              <div>
                <span>Passageiros</span>
                <strong>{associatedRequest?.passengers || 1} pessoa(s)</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
