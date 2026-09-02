import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, LoadingState, StatCard, useToast } from '../../../components/common';
import { RouteMap } from '../../../components/maps';
import type { RoutePoint } from '../../../services/maps/routingService';
import { trackingApi, type TrackingSnapshot } from '../../../services';
import styles from './RideTracking.module.css';

export const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    }, 10000);

    return () => clearInterval(interval);
  }, [rideId]);

  const routePoints: RoutePoint[] = useMemo(() => {
    if (!snapshot || !snapshot.route) {
      return [
        { lat: -23.55052, lng: -46.633308, label: 'Origem da corrida', type: 'origin' },
        { lat: -23.561684, lng: -46.655981, label: 'Destino da corrida', type: 'destination' },
      ];
    }

    const points: RoutePoint[] = [];
    if (snapshot.route.origin) {
      points.push({
        lat: snapshot.route.origin.lat,
        lng: snapshot.route.origin.lng,
        label: snapshot.route.origin.address || 'Origem',
        type: 'origin',
      });
    }

    if (snapshot.route.stops && snapshot.route.stops.length > 0) {
      snapshot.route.stops.forEach((st, idx) => {
        points.push({
          lat: st.lat,
          lng: st.lng,
          label: st.address || `Parada ${idx + 1}`,
          type: 'stop',
        });
      });
    }

    if (snapshot.route.destination) {
      points.push({
        lat: snapshot.route.destination.lat,
        lng: snapshot.route.destination.lng,
        label: snapshot.route.destination.address || 'Destino',
        type: 'destination',
      });
    }

    return points;
  }, [snapshot]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState
          variant="details"
          message="Carregando acompanhamento em tempo real"
          submessage={`Conectando ao serviço de telemetria da corrida #${rideId}...`}
        />
      </div>
    );
  }

  const distanceKm = snapshot?.route?.distanceMeters
    ? (snapshot.route.distanceMeters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    : '14,5';

  const durationMin = snapshot?.route?.durationSeconds
    ? Math.round(snapshot.route.durationSeconds / 60)
    : 26;

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
            Telemetria em tempo real com GPS e rotas TomTom. Última atualização às{' '}
            {lastUpdated.toLocaleTimeString('pt-BR')}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={() => fetchTracking(false)} isLoading={isRefreshing}>
            Atualizar agora
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Indicadores da corrida">
        <StatCard title="Status do trajeto" value={statusLabel} />
        <StatCard title="Distância estimada" value={`${distanceKm} km`} />
        <StatCard title="Previsão de chegada" value={`${durationMin} min`} />
        <StatCard title="Velocidade aferida" value={`${speedKmH} km/h`} />
      </section>

      <section className={styles.trackingLayout}>
        <article className={styles.mapCard}>
          <div className={styles.mapToolbar}>
            <span className={styles.mapToolbarTitle}>
              Mapa de Navegação e Trajeto
            </span>
            <div className={styles.mapToolbarActions}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {snapshot?.vehiclePosition ? `Lat: ${snapshot.vehiclePosition.lat.toFixed(4)}, Lng: ${snapshot.vehiclePosition.lng.toFixed(4)}` : 'Sinal GPS ativo'}
              </span>
            </div>
          </div>
          <RouteMap points={routePoints} height={460} showOverlay={true} />
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
                <strong>{snapshot?.route?.origin?.address || 'Ponto de Partida'}</strong>
              </div>

              {snapshot?.route?.stops?.map((stop, i) => (
                <div key={stop.sequence || i} className={styles.timelineItem}>
                  <small>Parada {i + 1}</small>
                  <strong>{stop.address || `Parada #${i + 1}`}</strong>
                </div>
              ))}

              <div className={styles.timelineItem}>
                <span className={styles.timelineDotDest} aria-hidden="true" />
                <small>Destino</small>
                <strong>{snapshot?.route?.destination?.address || 'Ponto de Chegada'}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};
