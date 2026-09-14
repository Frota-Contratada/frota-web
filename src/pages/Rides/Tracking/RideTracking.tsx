import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, LoadingState, StatCard, useToast } from '../../../components/common';
import { LiveTrackingMap, type CameraMode } from '../../../components/maps';
import { AcompanhamentoEmbed } from '../../../components/tracking';
import {
  trackingApi,
  TrackingSocketClient,
  type TrackingSnapshot,
  type TrackingEnvelope,
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
  const [cameraMode, setCameraMode] = useState<CameraMode>('passenger');
  const [viewMode, setViewMode] = useState<'embed' | 'internal'>('embed');
  const [lastSocketEvent, setLastSocketEvent] = useState<TrackingEnvelope | null>(null);
  const [isConnectedWs, setIsConnectedWs] = useState(false);

  const socketClientRef = useRef<TrackingSocketClient | null>(null);

  const fetchTracking = async (showLoading = false) => {
    if (!rideId) return;
    try {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      setLoadError(null);

      const res = await trackingApi.getSnapshot(rideId);
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

  // Inicialização e conexão ao WebSocket do TrackingGateway
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
      onRawEvent: (envelope) => {
        setLastSocketEvent(envelope);
      },
    });

    socketClientRef.current = client;
    client.connect(rideId, 'passenger');

    return () => {
      client.disconnect();
      socketClientRef.current = null;
    };
  }, [rideId]);

  // Handler para comandos recebidos da ponte de acompanhamento
  const handleIframeCommand = async (commandType: string, payload: unknown) => {
    if (!rideId) return;
    try {
      if (commandType === 'waiting.confirmed') {
        await trackingApi.startWaiting(rideId);
        showToast({ type: 'info', title: 'Espera iniciada', description: 'O tempo de espera foi acionado.' });
      } else if (commandType === 'waiting.resumeRequested') {
        await trackingApi.resumeWaiting(rideId);
        showToast({ type: 'info', title: 'Espera finalizada', description: 'A viagem foi retomada.' });
      } else if (commandType === 'trip.finishRequested') {
        await trackingApi.finishTrip(rideId);
        showToast({ type: 'success', title: 'Corrida finalizada', description: 'A corrida foi encerrada com sucesso.' });
      } else if (commandType === 'route.rerouteRequested') {
        const position = (payload as { position?: TrackingPosition })?.position;
        if (position) {
          await trackingApi.reroute(rideId, position);
          showToast({ type: 'info', title: 'Rota recalculada', description: 'Novo traçado aplicado pelo servidor.' });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar comando';
      showToast({ type: 'error', title: 'Erro de comunicação', description: msg });
    }
  };

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

  const routeCoordinates = useMemo<Array<[number, number]>>(() => {
    if (snapshot?.route?.coordinates && snapshot.route.coordinates.length > 0) {
      return snapshot.route.coordinates.map((c) => [c.lat, c.lng]);
    }
    return [];
  }, [snapshot?.route?.coordinates]);

  const vehiclePos = useMemo(() => {
    if (snapshot?.vehiclePosition) {
      return {
        lat: snapshot.vehiclePosition.lat,
        lng: snapshot.vehiclePosition.lng,
        heading: snapshot.vehiclePosition.heading ?? 0,
        speed: snapshot.vehiclePosition.speed ?? 0,
      };
    }
    return undefined;
  }, [snapshot?.vehiclePosition]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando telemetria em tempo real"
          submessage={`Conectando ao serviço de rastreamento da corrida #${rideId}...`}
        />
      </div>
    );
  }

  if (loadError && !snapshot) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
          <h3>Não foi possível carregar o rastreamento da corrida #{rideId}</h3>
          <p style={{ color: '#64748b', margin: '1rem 0' }}>{loadError}</p>
          <Button variant="primary" onClick={() => fetchTracking(true)}>
            Tentar novamente
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginLeft: '0.75rem' }}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const distanceMeters = snapshot?.route?.distanceMeters ?? null;
  const durationSeconds = snapshot?.route?.durationSeconds ?? null;
  const trafficDelaySeconds = snapshot?.route?.trafficDelaySeconds ?? 0;
  const trafficMinutes = Math.round(trafficDelaySeconds / 60);

  const speedKmH =
    snapshot?.vehiclePosition?.speed != null ? Math.round(snapshot.vehiclePosition.speed * 3.6) : null;

  const formatTripStatus = (status?: string, isWaiting?: boolean) => {
    if (isWaiting) return 'Aguardando no local';
    switch (status) {
      case 'in_progress':
        return 'Em deslocamento';
      case 'finished':
        return 'Concluída';
      case 'canceled':
        return 'Cancelada';
      case 'scheduled':
        return 'Agendada';
      default:
        return status ? status.toUpperCase() : 'Não informada';
    }
  };

  const statusLabel = formatTripStatus(snapshot?.tripStatus, snapshot?.waiting?.active);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h2>Acompanhamento — Corrida #{rideId}</h2>
            <span
              className={styles.liveBadge}
              role="status"
              aria-label={isConnectedWs ? 'Conectado em tempo real' : 'Sincronização pontual'}
              style={{ backgroundColor: isConnectedWs ? '#10b981' : '#f59e0b' }}
            >
              <span className={styles.liveDot} aria-hidden="true" />
              {isConnectedWs ? 'WebSocket Ao Vivo' : 'Sincronizado'}
            </span>
          </div>
          <p>
            Telemetria da corrida com dados autoritativos do backend. Atualizado às{' '}
            {lastUpdated.toLocaleTimeString('pt-BR')}.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.cameraToggleGroup} role="group" aria-label="Modo de Visualização">
            <button
              type="button"
              className={`${styles.cameraToggleBtn} ${viewMode === 'embed' ? styles.cameraToggleBtnActive : ''}`}
              onClick={() => setViewMode('embed')}
            >
              Frota Acompanhamento (Oficial)
            </button>
            <button
              type="button"
              className={`${styles.cameraToggleBtn} ${viewMode === 'internal' ? styles.cameraToggleBtnActive : ''}`}
              onClick={() => setViewMode('internal')}
            >
              Mapa Integrado
            </button>
          </div>

          <Button variant="outline" onClick={() => fetchTracking(false)} isLoading={isRefreshing}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      {/* Card Flutuante de Telemetria / ETA */}
      <section className={styles.passengerSummaryCard} aria-label="Previsão e métricas de rota">
        <div className={styles.etaBlock}>
          <strong>{durationSeconds != null ? formatETA(durationSeconds) : '—'}</strong>
          <span>Chegada Estimada (ETA)</span>
        </div>

        <div className={styles.metricBlock}>
          <strong>{durationSeconds != null ? formatDuration(durationSeconds) : '—'}</strong>
          <span>Tempo Restante</span>
        </div>

        <div className={styles.metricBlock}>
          <strong>{distanceMeters != null ? formatDistance(distanceMeters) : '—'}</strong>
          <span>Distância Restante</span>
        </div>

        <div>
          <div className={`${styles.trafficChip} ${trafficMinutes > 0 ? styles.trafficChipDelayed : ''}`}>
            {trafficMinutes > 0 ? `+${trafficMinutes} min no trânsito` : 'Trânsito livre'}
          </div>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Indicadores da corrida">
        <StatCard title="Status do trajeto" value={statusLabel} />
        <StatCard title="Distância estimada" value={distanceMeters != null ? formatDistance(distanceMeters) : '—'} />
        <StatCard
          title="Previsão de chegada"
          value={durationSeconds != null ? `${Math.round(durationSeconds / 60)} min` : '—'}
        />
        <StatCard title="Velocidade aferida" value={speedKmH != null ? `${speedKmH} km/h` : 'Sem telemetria'} />
      </section>

      <section className={styles.trackingLayout}>
        <article className={styles.mapCard}>
          <div className={styles.mapToolbar}>
            <span className={styles.mapToolbarTitle}>
              {viewMode === 'embed'
                ? 'Visualização Oficial: frota-acompanhamento (WebParentTripBridge)'
                : cameraMode === 'driver'
                ? 'Perspectiva do Motorista (3D Tilt)'
                : 'Mapa Geral 2D'}
            </span>
            <div className={styles.mapToolbarActions}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {snapshot?.vehiclePosition
                  ? `GPS: ${snapshot.vehiclePosition.lat.toFixed(4)}, ${snapshot.vehiclePosition.lng.toFixed(4)}`
                  : 'Aguardando telemetria do veículo'}
              </span>
            </div>
          </div>

          {viewMode === 'embed' && rideId ? (
            <AcompanhamentoEmbed
              rideId={rideId}
              role="passenger"
              snapshot={snapshot}
              lastEvent={lastSocketEvent}
              onCommand={handleIframeCommand}
            />
          ) : (
            <LiveTrackingMap
              origin={originPoint ?? undefined}
              destination={destPoint ?? undefined}
              stops={stopsList}
              routeCoordinates={routeCoordinates}
              vehiclePosition={vehiclePos}
              cameraMode={cameraMode}
              onCameraModeChange={setCameraMode}
              height={520}
            />
          )}
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Motorista e Veículo</h3>
            <div className={styles.driverRow}>
              <div className={styles.driverAvatar}>
                {snapshot?.driver?.displayName ? snapshot.driver.displayName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className={styles.driverInfo}>
                <strong>{snapshot?.driver?.displayName || 'Motorista não atribuído'}</strong>
                <span>ID: {snapshot?.driver?.id || '—'}</span>
              </div>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <span>Veículo</span>
                <strong>{snapshot?.vehicle?.description || 'Veículo cadastrado'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Placa</span>
                <strong>{snapshot?.vehicle?.plate || '—'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Aguardando passageiro?</span>
                <strong>{snapshot?.waiting?.active ? 'Sim' : 'Não'}</strong>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Itinerário da Corrida</h3>
            <div className={styles.routeTimeline}>
              <div className={styles.timelineItem}>
                <span className={styles.timelineDotOrigin} aria-hidden="true" />
                <small>Origem</small>
                <strong>{originPoint?.address || '—'}</strong>
              </div>

              {stopsList.map((stop, i) => (
                <div key={stop.sequence || i} className={styles.timelineItem}>
                  <span className={styles.timelineDotStop} aria-hidden="true" />
                  <small>Parada {i + 1}</small>
                  <strong>{stop.address}</strong>
                </div>
              ))}

              <div className={styles.timelineItem}>
                <span className={styles.timelineDotDest} aria-hidden="true" />
                <small>Destino</small>
                <strong>{destPoint?.address || '—'}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
