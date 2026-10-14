import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, LoadingState, useToast } from '../../../components/common';
import { AcompanhamentoEmbed } from '../../../components/tracking/AcompanhamentoEmbed';
import {
  ridesApi,
  trackingApi,
  TrackingSocketClient,
  type TrackingSnapshot,
  type TrackingPosition,
  type CanonicalRoute,
  type TrackingWaiting,
} from '../../../services';
import { formatDistance, formatDuration, formatETA } from '../../../utils/geoUtils';
import styles from './RideTracking.module.css';

export const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnectedWs, setIsConnectedWs] = useState(false);
  const [trackingRole, setTrackingRole] = useState<'driver' | 'passenger'>('driver');

  const socketClientRef = useRef<TrackingSocketClient | null>(null);

  const fetchTracking = async (showLoading = false) => {
    if (!rideId) return;
    try {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);

      let res;
      try {
        res = await trackingApi.getSnapshot(rideId);
      } catch (err: any) {
        if (Number(rideId) > 0) {
          try {
            const solRes = await ridesApi.getById(Number(rideId));
            const tripId = solRes.response?.corrida?.id ?? solRes.response?.Corrida?.[0]?.id;
            if (tripId && String(tripId) !== String(rideId)) {
              res = await trackingApi.getSnapshot(String(tripId));
            } else {
              throw err;
            }
          } catch {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (res && res.response) {
        setSnapshot(res.response);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao obter dados de rastreamento';
      setLoadError(msg);
      showToast({ type: 'error', title: 'Falha no rastreamento', description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking(true);

    if (!rideId) return;

    const client = new TrackingSocketClient({
      onConnect: () => {
        setIsConnectedWs(true);
      },
      onDisconnect: () => {
        setIsConnectedWs(false);
      },
      onError: () => {
        setIsConnectedWs(false);
      },
      onVehicleLocation: (position: TrackingPosition) => {
        setSnapshot((prev) => (prev ? { ...prev, vehiclePosition: position, updatedAt: position.timestamp } : prev));
        setLastUpdated(new Date());
      },
      onPassengerLocation: (position: TrackingPosition) => {
        setSnapshot((prev) => (prev ? { ...prev, passengerPosition: position } : prev));
      },
      onRouteReplaced: (route: CanonicalRoute) => {
        setSnapshot((prev) => (prev ? { ...prev, route } : prev));
        setLastUpdated(new Date());
      },
      onWaitingChanged: (waiting: TrackingWaiting) => {
        setSnapshot((prev) => (prev ? { ...prev, waiting } : prev));
        setLastUpdated(new Date());
      },
      onTripStatusChanged: ({ tripStatus }) => {
        setSnapshot((prev) => (prev ? { ...prev, tripStatus } : prev));
        setLastUpdated(new Date());
      },
    });

    socketClientRef.current = client;
    client.connect(rideId, 'passenger');

    return () => {
      client.disconnect();
      socketClientRef.current = null;
    };
  }, [rideId]);

  const originPoint = useMemo(() => {
    if (snapshot?.route?.origin) {
      return {
        lat: snapshot.route.origin.lat,
        lng: snapshot.route.origin.lng,
        address: snapshot.route.origin.label || 'Origem da Corrida',
      };
    }
    return null;
  }, [snapshot?.route?.origin]);

  const destPoint = useMemo(() => {
    if (snapshot?.route?.destination) {
      return {
        lat: snapshot.route.destination.lat,
        lng: snapshot.route.destination.lng,
        address: snapshot.route.destination.label || 'Destino Final',
      };
    }
    return null;
  }, [snapshot?.route?.destination]);

  const stopsList = useMemo(() => {
    return (snapshot?.route?.stops || []).map((st) => ({
      sequence: st.sequence,
      lat: st.lat,
      lng: st.lng,
      address: st.label || `Parada #${st.sequence}`,
    }));
  }, [snapshot?.route?.stops]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando acompanhamento"
          submessage={`Consultando dados da corrida #${rideId}...`}
        />
      </div>
    );
  }

  if (loadError && !snapshot) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <h3>Não foi possível carregar o rastreamento da corrida #{rideId}</h3>
          <p>{loadError}</p>
          <div className={styles.errorActions}>
            <Button variant="primary" onClick={() => fetchTracking(true)} isLoading={isLoading}>
              Tentar novamente
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={isLoading}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const distanceMeters = snapshot?.route?.distanceMeters ?? null;
  const durationSeconds = snapshot?.route?.durationSeconds ?? null;
  const speedKmH =
    snapshot?.vehiclePosition?.speed != null ? Math.round(snapshot.vehiclePosition.speed * 3.6) : null;

  const getStatusBadge = (status?: string, isWaiting?: boolean) => {
    if (isWaiting) {
      return { label: 'Aguardando passageiro', className: styles.statusBadgeWarning };
    }
    switch (status) {
      case 'in_progress':
        return { label: 'Em andamento', className: styles.statusBadgeActive };
      case 'finished':
        return { label: 'Concluída', className: styles.statusBadgeNeutral };
      case 'canceled':
        return { label: 'Cancelada', className: styles.statusBadgeDanger };
      case 'scheduled':
        return { label: 'Agendada', className: styles.statusBadgeInfo };
      default:
        return { label: status ? status.toUpperCase() : 'Não informado', className: styles.statusBadgeNeutral };
    }
  };

  const statusInfo = getStatusBadge(snapshot?.tripStatus, snapshot?.waiting?.active);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h2>Acompanhamento da Corrida #{rideId}</h2>
            <span className={statusInfo.className}>
              {statusInfo.label}
            </span>
            {isConnectedWs && (
              <span className={styles.connectionBadge}>
                <span className={styles.liveDot} aria-hidden="true" />
                Tempo real
              </span>
            )}
          </div>
          <p className={styles.subtitle}>
            Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => fetchTracking(false)} isLoading={isRefreshing}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Indicadores operacionais da viagem">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Chegada Prevista</span>
          <strong className={styles.kpiValue}>
            {durationSeconds != null ? formatETA(durationSeconds) : '—'}
          </strong>
          <span className={styles.kpiSub}>
            {durationSeconds != null ? `${formatDuration(durationSeconds)} restantes` : 'Sem estimativa'}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Distância Restante</span>
          <strong className={styles.kpiValue}>
            {distanceMeters != null ? formatDistance(distanceMeters) : '—'}
          </strong>
          <span className={styles.kpiSub}>Extensão total do trajeto</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Velocidade do Veículo</span>
          <strong className={styles.kpiValue}>
            {speedKmH != null ? `${speedKmH} km/h` : '—'}
          </strong>
          <span className={styles.kpiSub}>
            {speedKmH != null ? 'Telemetria ativa' : 'Veículo parado ou offline'}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Status da Condução</span>
          <strong className={styles.kpiValue}>
            {snapshot?.waiting?.active ? 'Em espera' : 'Em deslocamento'}
          </strong>
          <span className={styles.kpiSub}>
            {snapshot?.startedAt ? `Iniciada às ${new Date(snapshot.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Horário não disponível'}
          </span>
        </div>
      </section>

      {/* Layout Principal: Micro-frontend frota-acompanhamento + Painel Lateral */}
      <section className={styles.trackingLayout}>
        <article className={styles.mapCard}>
          <div className={styles.mapToolbar}>
            <div className={styles.mapToolbarTitle}>
              <span>frota-acompanhamento (Micro-frontend ao vivo)</span>
            </div>
            <div className={styles.mapToolbarActions} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: trackingRole === 'driver' ? 'var(--brand-primary, #2c2c9e)' : '#f8fafc',
                    color: trackingRole === 'driver' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                  }}
                  onClick={() => setTrackingRole('driver')}
                >
                  ▶ Visão Motorista (Simulador Play)
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: trackingRole === 'passenger' ? 'var(--brand-primary, #2c2c9e)' : '#f8fafc',
                    color: trackingRole === 'passenger' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                  }}
                  onClick={() => setTrackingRole('passenger')}
                >
                  Visão Passageiro
                </button>
              </div>

              <span className={styles.gpsLabel}>
                Porta: 3001
              </span>
            </div>
          </div>

          <div className={styles.mapContainer} style={{ minHeight: '620px', height: '620px' }}>
            <AcompanhamentoEmbed
              rideId={rideId || ''}
              role={trackingRole}
              snapshot={snapshot}
            />
          </div>
        </article>

        <aside className={styles.sidePanel}>
          {/* Card Motorista e Veículo */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Motorista e Veículo</h3>
            <div className={styles.driverRow}>
              <div className={styles.driverAvatar}>
                {snapshot?.driver?.displayName ? snapshot.driver.displayName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className={styles.driverInfo}>
                <strong>{snapshot?.driver?.displayName || 'Motorista em designação'}</strong>
                <span>Identificador: #{snapshot?.driver?.id || '—'}</span>
              </div>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <span>Veículo</span>
                <strong>{snapshot?.vehicle?.description || 'Sedan Executivo'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Placa</span>
                <strong className={styles.plateBadge}>{snapshot?.vehicle?.plate || '—'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Aguardando passageiro</span>
                <strong>{snapshot?.waiting?.active ? 'Sim' : 'Não'}</strong>
              </div>
            </div>
          </div>

          {/* Card Itinerário */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Itinerário</h3>
            <div className={styles.routeTimeline}>
              <div className={styles.timelineItem}>
                <span className={styles.timelineDotOrigin} aria-hidden="true" />
                <span className={styles.timelineStage}>Origem</span>
                <strong className={styles.timelineAddress}>{originPoint?.address || '—'}</strong>
              </div>

              {stopsList.map((stop, i) => (
                <div key={stop.sequence || i} className={styles.timelineItem}>
                  <span className={styles.timelineDotStop} aria-hidden="true" />
                  <span className={styles.timelineStage}>Parada {i + 1}</span>
                  <strong className={styles.timelineAddress}>{stop.address}</strong>
                </div>
              ))}

              <div className={styles.timelineItem}>
                <span className={styles.timelineDotDest} aria-hidden="true" />
                <span className={styles.timelineStage}>Destino</span>
                <strong className={styles.timelineAddress}>{destPoint?.address || '—'}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
