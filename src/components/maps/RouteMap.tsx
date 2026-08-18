import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { originIcon, destinationIcon, stopIcon } from './mapIcons';
import { routingService, type RoutePoint, type RouteResult } from '../../services/maps/routingService';
import styles from './RouteMap.module.css';

interface RouteMapProps {
  points: RoutePoint[];
  height?: string | number;
  showOverlay?: boolean;
  onRouteCalculated?: (result: RouteResult) => void;
  className?: string;
}


const MapBoundsAdjuster = ({ coordinates }: { coordinates: Array<[number, number]> }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length >= 2) {
      const bounds = L.latLngBounds(coordinates.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
    }
  }, [coordinates, map]);

  return null;
};

export const RouteMap = ({
  points,
  height = 380,
  showOverlay = true,
  onRouteCalculated,
  className = '',
}: RouteMapProps) => {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const validPoints = points.filter(
    (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
  );

  const defaultCenter: [number, number] = validPoints.length > 0
    ? [validPoints[0].lat, validPoints[0].lng]
    : [-23.55052, -46.633308];

  useEffect(() => {
    let isCancelled = false;

    if (validPoints.length >= 2) {
      setIsLoading(true);
      routingService
        .calcularRota(validPoints)
        .then((res) => {
          if (!isCancelled) {
            setRoute(res);
            onRouteCalculated?.(res);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            const fallback = routingService.calcularDistanciaFallback(validPoints);
            setRoute(fallback);
            onRouteCalculated?.(fallback);
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    } else if (validPoints.length === 1) {
      setRoute({
        distanceKm: 0,
        durationMinutes: 0,
        coordinates: [[validPoints[0].lat, validPoints[0].lng]],
      });
    } else {
      setRoute(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(validPoints)]);

  const displayCoords = route?.coordinates && route.coordinates.length > 0
    ? route.coordinates
    : validPoints.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div
      className={`${styles.mapContainer} ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {showOverlay && route && route.distanceKm > 0 && (
        <div className={styles.routeBadgeOverlay}>
          <div className={styles.badgeItem}>
            <span className={styles.badgeLabel}>Distância</span>
            <span className={styles.badgeValue}>{route.distanceKm.toLocaleString('pt-BR')} km</span>
          </div>
          <div className={styles.badgeItem}>
            <span className={styles.badgeLabel}>Tempo Est.</span>
            <span className={styles.badgeValue}>{route.durationMinutes} min</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Calculando melhor rota...</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {displayCoords.length >= 2 && (
          <>
            {}
            <Polyline
              positions={displayCoords}
              pathOptions={{ color: '#991B1B', weight: 8, opacity: 0.3 }}
            />
            {}
            <Polyline
              positions={displayCoords}
              pathOptions={{ color: '#E21B22', weight: 5, opacity: 0.9 }}
            />
          </>
        )}

        {validPoints.map((point, index) => {
          const isOrigin = index === 0;
          const isDest = index === validPoints.length - 1;
          const icon = isOrigin ? originIcon : isDest ? destinationIcon : stopIcon(index);

          return (
            <Marker key={`${point.lat}-${point.lng}-${index}`} position={[point.lat, point.lng]} icon={icon}>
              <Popup>
                <strong>{point.label || (isOrigin ? 'Origem' : isDest ? 'Destino' : `Parada #${index}`)}</strong>
              </Popup>
            </Marker>
          );
        })}

        {displayCoords.length > 0 && <MapBoundsAdjuster coordinates={displayCoords} />}
      </MapContainer>
    </div>
  );
};
