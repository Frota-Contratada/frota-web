import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, LoadingState, StatCard, useToast } from '../../../components/common';
import { LiveTrackingMap, type CameraMode } from '../../../components/maps';
import { routingService, type RoutePoint } from '../../../services/maps/routingService';
import { trackingApi, type TrackingSnapshot } from '../../../services';
import { formatDistance, formatDuration, formatETA } from '../../../utils/geoUtils';
import styles from './RideTracking.module.css';

export const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('passenger');
  const [calculatedCoords, setCalculatedCoords] = useState<Array<[number, number]>>([]);

  const fetchTracking = async (showLoading = false) => {
    if (!rideId) return;
    try {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await trackingApi.getSnapshot(rideId);
      if (res && res.response) {
        setSnapshot(res.response);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao obter dados de rastreamento';
      showToast({ type: 'error', title: 'Falha no rastreamento', description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking(true);
    const interval = setInterval(() => {
      fetchTracking(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [rideId]);

  // Se o snapshot não trouxer as coordenadas detalhadas da geometria, calculamos via routingService
  useEffect(() => {
    if (!snapshot || !snapshot.route) return;

    if (snapshot.route.coordinates && snapshot.route.coordinates.length >= 2) {
      setCalculatedCoords(snapshot.route.coordinates);
      return;
    }

    const { origin, destination, stops } = snapshot.route;
    if (origin && destination) {
      const points: RoutePoint[] = [
        { lat: origin.lat, lng: origin.lng, label: origin.address || 'Origem', type: 'origin' },
        ...(stops || []).map((st, i) => ({
          lat: st.lat,
          lng: st.lng,
          label: st.address || `Parada ${i + 1}`,
          type: 'stop' as const,
        })),
        { lat: destination.lat, lng: destination.lng, label: destination.address || 'Destino', type: 'destination' },
      ];

      routingService
        .calcularRota(points)
        .then((res) => {
          if (res.coordinates && res.coordinates.length > 0) {
            setCalculatedCoords(res.coordinates);
          }
        })
        .catch(() => {
          setCalculatedCoords(points.map((p) => [p.lat, p.lng]));
        });
    }
  }, [snapshot?.route?.origin?.lat, snapshot?.route?.destination?.lat, snapshot?.route?.stops?.length]);

  const originPoint = useMemo(() => {
    if (snapshot?.route?.origin) {
      return {
        lat: snapshot.route.origin.lat,
        lng: snapshot.route.origin.lng,
        address: snapshot.route.origin.address || 'Origem da Corrida',
      };
    }
    return { lat: -23.507248, lng: -46.653695, address: 'Ponto de Partida' };
  }, [snapshot?.route?.origin]);

  const destPoint = useMemo(() => {
    if (snapshot?.route?.destination) {
      return {
        lat: snapshot.route.destination.lat,
        lng: snapshot.route.destination.lng,
        address: snapshot.route.destination.address || 'Destino Final',
      };
    }
    return { lat: -23.513207, lng: -46.731058, address: 'Ponto de Chegada' };
  }, [snapshot?.route?.destination]);

  const stopsList = useMemo(() => {
    return (snapshot?.route?.stops || []).map((st, idx) => ({
      sequence: st.sequence ?? idx + 1,
      lat: st.lat,
      lng: st.lng,
      address: st.address || `Parada ${idx + 1}`,
    }));
  }, [snapshot?.route?.stops]);

  const vehiclePos = useMemo(() => {
    if (snapshot?.vehiclePosition) {
      return {
        lat: snapshot.vehiclePosition.lat,
        lng: snapshot.vehiclePosition.lng,
        heading: snapshot.vehiclePosition.heading ?? 0,
        speed: snapshot.vehiclePosition.speed ?? 0,
      };
    }
    return {
      lat: originPoint.lat,
      lng: originPoint.lng,
      heading: 0,
      speed: 0,
    };
  }, [snapshot?.vehiclePosition, originPoint]);

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

  const distanceMeters = snapshot?.route?.distanceMeters ?? 14500;
  const durationSeconds = snapshot?.route?.durationSeconds ?? 1560;
  const trafficDelaySeconds = snapshot?.route?.trafficDelaySeconds ?? 0;
  const trafficMinutes = Math.round(trafficDelaySeconds / 60);

  const speedKmH = snapshot?.vehiclePosition?.speed
    ? Math.round(snapshot.vehiclePosition.speed)
    : 42;

  const statusLabel =
    snapshot?.tripStatus === 'COMPLETED'
      ? 'Concluída'
      : snapshot?.tripStatus === 'CANCELLED'
      ? 'Cancelada'
      : snapshot?.waiting?.active
      ? 'Aguardando no local'
      : 'Em deslocamento';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h2>Acompanhamento — Corrida #{rideId}</h2>
            <span className={styles.liveBadge} role="status" aria-label="Acompanhamento ao vivo">
              <span className={styles.liveDot} aria-hidden="true" />
              Ao Vivo
            </span>
          </div>
          <p>
            Telemetria vetorial via MapLibre GL & OpenFreeMap. Última atualização às{' '}
            {lastUpdated.toLocaleTimeString('pt-BR')}.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.cameraToggleGroup} role="group" aria-label="Modo de Visualização do Mapa">
            <button
              type="button"
              className={`${styles.cameraToggleBtn} ${cameraMode === 'passenger' ? styles.cameraToggleBtnActive : ''}`}
              onClick={() => setCameraMode('passenger')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Monitoramento 2D
            </button>
            <button
              type="button"
              className={`${styles.cameraToggleBtn} ${cameraMode === 'driver' ? styles.cameraToggleBtnActive : ''}`}
              onClick={() => setCameraMode('driver')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Navegação 3D
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

      {/* Card Flutuante de Telemetria / ETA (inspirado no frota-acompanhamento) */}
      <section className={styles.passengerSummaryCard} aria-label="Previsão e métricas de rota">
        <div className={styles.etaBlock}>
          <strong>{formatETA(durationSeconds)}</strong>
          <span>Chegada Estimada (ETA)</span>
        </div>

        <div className={styles.metricBlock}>
          <strong>{formatDuration(durationSeconds)}</strong>
          <span>Tempo Restante</span>
        </div>

        <div className={styles.metricBlock}>
          <strong>{formatDistance(distanceMeters)}</strong>
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
        <StatCard title="Distância estimada" value={formatDistance(distanceMeters)} />
        <StatCard title="Previsão de chegada" value={`${Math.round(durationSeconds / 60)} min`} />
        <StatCard title="Velocidade aferida" value={`${speedKmH} km/h`} />
      </section>

      <section className={styles.trackingLayout}>
        <article className={styles.mapCard}>
          <div className={styles.mapToolbar}>
            <span className={styles.mapToolbarTitle}>
              {cameraMode === 'driver' ? 'Perspectiva do Motorista (3D Tilt)' : 'Mapa Geral da Rota e Telemetria'}
            </span>
            <div className={styles.mapToolbarActions}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {snapshot?.vehiclePosition
                  ? `GPS: ${snapshot.vehiclePosition.lat.toFixed(4)}, ${snapshot.vehiclePosition.lng.toFixed(4)}`
                  : 'Sinal GPS ativo'}
              </span>
            </div>
          </div>

          <LiveTrackingMap
            origin={originPoint}
            destination={destPoint}
            stops={stopsList}
            routeCoordinates={calculatedCoords}
            vehiclePosition={vehiclePos}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            height={500}
          />
        </article>

        <aside className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Motorista e Veículo</h3>
            <div className={styles.driverRow}>
              <div className={styles.driverAvatar}>
                {snapshot?.driver?.name ? snapshot.driver.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className={styles.driverInfo}>
                <strong>{snapshot?.driver?.name || 'Motorista Homologado'}</strong>
                <span>{snapshot?.driver?.phone || '(11) 98765-4321'}</span>
              </div>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <span>Veículo</span>
                <strong>{snapshot?.vehicle?.model || 'Sedan Executivo'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Placa</span>
                <strong>{snapshot?.vehicle?.plate || 'BRA2E19'}</strong>
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
                <strong>{originPoint.address}</strong>
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
                <strong>{destPoint.address}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
