import { useEffect, useRef, useState } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Spinner } from '../common';
import { originIcon, destinationIcon, stopIcon, createTomTomMarkerElement } from './mapIcons';
import { routingService, type RoutePoint, type RouteResult } from '../../services/maps/routingService';
import { TOMTOM_CONFIG } from '../../services/maps/tomtomConfig';
import styles from './RouteMap.module.css';

interface RouteMapProps {
  points: RoutePoint[];
  height?: string | number;
  showOverlay?: boolean;
  onRouteCalculated?: (result: RouteResult) => void;
  className?: string;
}

const LeafletBoundsAdjuster = ({ coordinates }: { coordinates: Array<[number, number]> }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length >= 2) {
      const bounds = L.latLngBounds(coordinates.map(([lat, lng]) => [lat, lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    } else if (coordinates.length === 1) {
      map.flyTo(coordinates[0], 14, { animate: true });
    }
  }, [JSON.stringify(coordinates), map]);

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
  const tomtomContainerRef = useRef<HTMLDivElement | null>(null);
  const tomtomMapRef = useRef<tt.Map | null>(null);
  const tomtomMarkersRef = useRef<tt.Marker[]>([]);

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

  useEffect(() => {
    if (!TOMTOM_CONFIG.hasKey || !tomtomContainerRef.current) return;

    if (!tomtomMapRef.current) {
      const mapInstance = tt.map({
        key: TOMTOM_CONFIG.apiKey,
        container: tomtomContainerRef.current,
        center: [defaultCenter[1], defaultCenter[0]],
        zoom: 13,
        stylesVisibility: {
          trafficFlow: true,
          trafficIncidents: true,
        },
      });

      mapInstance.addControl(new tt.NavigationControl());
      mapInstance.addControl(new tt.FullscreenControl());

      tomtomMapRef.current = mapInstance;
    }

    const map = tomtomMapRef.current;

    tomtomMarkersRef.current.forEach((m) => m.remove());
    tomtomMarkersRef.current = [];

    validPoints.forEach((point, index) => {
      const isOrigin = index === 0;
      const isDest = index === validPoints.length - 1;
      const markerType = isOrigin ? 'origin' : isDest ? 'destination' : 'stop';
      const markerEl = createTomTomMarkerElement(markerType, index);

      const labelText = point.label || (isOrigin ? 'Origem' : isDest ? 'Destino' : `Parada #${index}`);
      const popup = new tt.Popup({ offset: [0, -35] }).setHTML(`<strong>${labelText}</strong>`);

      const marker = new tt.Marker({ element: markerEl })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map);

      tomtomMarkersRef.current.push(marker);
    });

    const drawRouteOnMap = () => {
      const coords = route?.coordinates && route.coordinates.length > 0
        ? route.coordinates
        : validPoints.map((p) => [p.lat, p.lng] as [number, number]);

      if (map.getLayer('route-casing')) map.removeLayer('route-casing');
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route-source')) map.removeSource('route-source');

      if (coords.length >= 2) {
        const geojsonCoordinates = coords.map(([lat, lng]) => [lng, lat]);

        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: geojsonCoordinates,
            },
          },
        });

        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#1E1B4B',
            'line-width': 9,
            'line-opacity': 0.2,
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#E21B22',
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });

        const bounds = new tt.LngLatBounds();
        geojsonCoordinates.forEach((c) => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      } else if (coords.length === 1) {
        map.easeTo({ center: [coords[0][1], coords[0][0]], zoom: 14 });
      }
    };

    if (map.loaded()) {
      drawRouteOnMap();
    } else {
      map.once('load', drawRouteOnMap);
    }
  }, [TOMTOM_CONFIG.hasKey, route, JSON.stringify(validPoints)]);

  useEffect(() => {
    return () => {
      if (tomtomMapRef.current) {
        tomtomMapRef.current.remove();
        tomtomMapRef.current = null;
      }
    };
  }, []);

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
          <Spinner size="sm" variant="primary" />
          <span>Calculando melhor rota no TomTom...</span>
        </div>
      )}

      {TOMTOM_CONFIG.hasKey ? (
        <div ref={tomtomContainerRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          className={styles.leafletMap}
        >
          <TileLayer
            attribution={TOMTOM_CONFIG.getTileAttribution()}
            url={TOMTOM_CONFIG.getTileUrl()}
            subdomains={TOMTOM_CONFIG.getTileSubdomains()}
            maxZoom={TOMTOM_CONFIG.getTileMaxZoom()}
          />

          {displayCoords.length >= 2 && (
            <>
              <Polyline
                positions={displayCoords}
                pathOptions={{
                  color: '#1E1B4B',
                  weight: 8,
                  opacity: 0.15,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={displayCoords}
                pathOptions={{
                  color: '#E21B22',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
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

          {displayCoords.length > 0 && <LeafletBoundsAdjuster coordinates={displayCoords} />}
        </MapContainer>
      )}
    </div>
  );
};
