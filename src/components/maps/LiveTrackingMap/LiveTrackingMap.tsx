import { useEffect, useRef, useState } from 'react';
import {
  maplibregl,
  OPEN_FREE_MAP_STYLE,
  CARTO_POSITRON_RASTER_STYLE,
  MAX_ROUTE_MAP_ZOOM,
  boundsFromCoordinates,
  lineFeature,
  emptyLineFeature,
  featureCollection,
  setSourceData,
  createHtmlElement,
} from '../../../services/maps/openFreeMap';
import '../styles/mapStyles.css';
import styles from './LiveTrackingMap.module.css';

export type CameraMode = 'passenger' | 'driver';

export interface TrafficSection {
  startIndex?: number;
  endIndex?: number;
  startPointIndex?: number;
  endPointIndex?: number;
  delaySeconds?: number;
  delayInSeconds?: number;
  category?: string;
  simpleCategory?: string;
}

export interface LiveTrackingMapProps {
  origin?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  stops?: Array<{ sequence?: number; lat: number; lng: number; address?: string }>;
  routeCoordinates?: Array<[number, number]>;
  trafficSections?: TrafficSection[];
  vehiclePosition?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  cameraMode?: CameraMode;
  onCameraModeChange?: (mode: CameraMode) => void;
  height?: string | number;
  className?: string;
}

const TRACKING_IDS = Object.freeze({
  routeSource: 'tracking-route-source',
  routeOutline: 'tracking-route-outline',
  routeLine: 'tracking-route-line',
  trafficSource: 'tracking-traffic-source',
  trafficLine: 'tracking-traffic-line',
});

function getTrafficColor(category?: string, delaySec = 0): string {
  const cat = (category || '').toUpperCase();
  if (cat === 'ROAD_CLOSURE' || cat === 'BLOCKED') return '#7F1D1D';
  if (delaySec >= 600) return '#DC2626'; // Vermelho intenso
  if (delaySec >= 180) return '#F97316'; // Laranja
  return '#FACC15'; // Amarelo
}

export const LiveTrackingMap = ({
  origin,
  destination,
  stops = [],
  routeCoordinates = [],
  trafficSections = [],
  vehiclePosition,
  cameraMode = 'passenger',
  onCameraModeChange,
  height = 480,
  className = '',
}: LiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isMapLoadedRef = useRef(false);

  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleArrowRef = useRef<HTMLElement | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const vehicleAnimationRef = useRef<number | null>(null);
  const lastBearingRef = useRef(0);
  const [isOverviewActive, setIsOverviewActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tecla ESC para sair de tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Redimensionamento do mapa ao alternar tela cheia
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Inicialização do mapa MapLibre GL
  useEffect(() => {
    if (!containerRef.current) return;

    const hasInitialPosition = Boolean((vehiclePosition?.lng && vehiclePosition?.lat) || (origin?.lng && origin?.lat));
    const initialCenter: [number, number] = vehiclePosition?.lng && vehiclePosition?.lat
      ? [vehiclePosition.lng, vehiclePosition.lat]
      : origin?.lng && origin?.lat
      ? [origin.lng, origin.lat]
      : [-47.9292, -15.7801];
    const initialZoom = hasInitialPosition ? 14 : 4.5;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_FREE_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: cameraMode === 'driver' && hasInitialPosition ? 52 : 0,
      bearing: 0,
      maxZoom: MAX_ROUTE_MAP_ZOOM,
      cooperativeGestures: false,
    });

    let fallbackApplied = false;
    map.on('error', (err) => {
      if (!fallbackApplied) {
        fallbackApplied = true;
        console.warn('MapLibre LiveTrackingMap: ativando fallback de tiles raster Carto Positron:', err);
        map.setStyle(CARTO_POSITRON_RASTER_STYLE);
      }
    });

    window.setTimeout(() => map.resize(), 100);
    window.setTimeout(() => map.resize(), 400);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      'top-right'
    );

    const initLayers = () => {
      if (isMapLoadedRef.current || !map.getStyle()?.layers?.length) return;
      isMapLoadedRef.current = true;

      // 1. Rota principal
      if (!map.getSource(TRACKING_IDS.routeSource)) {
        map.addSource(TRACKING_IDS.routeSource, {
          type: 'geojson',
          data: emptyLineFeature(),
        });
      }

      if (!map.getLayer(TRACKING_IDS.routeOutline)) {
        map.addLayer({
          id: TRACKING_IDS.routeOutline,
          type: 'line',
          source: TRACKING_IDS.routeSource,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#1e224f',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              5,
              13,
              7,
              17,
              12,
            ],
            'line-opacity': 0.92,
          },
        });
      }

      if (!map.getLayer(TRACKING_IDS.routeLine)) {
        map.addLayer({
          id: TRACKING_IDS.routeLine,
          type: 'line',
          source: TRACKING_IDS.routeSource,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#2563eb',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              2.5,
              13,
              4,
              17,
              7,
            ],
            'line-opacity': 1,
          },
        });
      }

      // 2. Linhas de tráfego / congestionamento
      if (!map.getSource(TRACKING_IDS.trafficSource)) {
        map.addSource(TRACKING_IDS.trafficSource, {
          type: 'geojson',
          data: featureCollection(),
        });
      }

      if (!map.getLayer(TRACKING_IDS.trafficLine)) {
        map.addLayer({
          id: TRACKING_IDS.trafficLine,
          type: 'line',
          source: TRACKING_IDS.trafficSource,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              3,
              13,
              4.5,
              17,
              8,
            ],
            'line-opacity': 1,
          },
        });
      }

      // Eventos de clique na linha de trânsito
      map.on('mouseenter', TRACKING_IDS.trafficLine, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', TRACKING_IDS.trafficLine, () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', TRACKING_IDS.trafficLine, (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const delayText = feature.properties?.delayText || 'Trânsito lento';
        new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 8,
          className: 'traffic-map-popup',
        })
          .setLngLat(e.lngLat)
          .setText(delayText)
          .addTo(map);
      });

      map.resize();
    };

    map.on('styledata', initLayers);
    map.on('load', initLayers);

    map.on('dragstart', () => setIsOverviewActive(false));
    map.on('zoomstart', () => setIsOverviewActive(false));

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (vehicleAnimationRef.current) cancelAnimationFrame(vehicleAnimationRef.current);
      originMarkerRef.current?.remove();
      destMarkerRef.current?.remove();
      stopMarkersRef.current.forEach((m) => m.remove());
      vehicleMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, []);

  // Atualização das camadas de rota e tráfego
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    if (routeCoordinates && routeCoordinates.length >= 2) {
      setSourceData(map, TRACKING_IDS.routeSource, lineFeature(routeCoordinates));

      // Calcula geometrias de trânsito
      const trafficFeatures = trafficSections
        .map((sec) => {
          const start = Math.max(0, Number(sec.startIndex ?? sec.startPointIndex ?? 0));
          const end = Math.min(
            routeCoordinates.length - 1,
            Number(sec.endIndex ?? sec.endPointIndex ?? 0)
          );
          if (end <= start) return null;
          const segment = routeCoordinates.slice(start, end + 1);
          if (segment.length < 2) return null;

          const delay = Number(sec.delaySeconds ?? sec.delayInSeconds ?? 0);
          return lineFeature(segment, {
            color: getTrafficColor(sec.category ?? sec.simpleCategory, delay),
            delayText: delay >= 60 ? `+${Math.round(delay / 60)} min de atraso` : 'Trânsito moderado',
          });
        })
        .filter((f): f is GeoJSON.Feature<GeoJSON.LineString> => f !== null);

      setSourceData(
        map,
        TRACKING_IDS.trafficSource,
        featureCollection(trafficFeatures)
      );
    } else {
      setSourceData(map, TRACKING_IDS.routeSource, emptyLineFeature());
      setSourceData(map, TRACKING_IDS.trafficSource, featureCollection());
    }
  }, [routeCoordinates, trafficSections]);

  // Marcadores de Origem, Destino e Paradas
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Origem
    if (origin && origin.lat && origin.lng) {
      if (!originMarkerRef.current) {
        const el = createHtmlElement('custom-map-pin', '<span class="map-origin-pin"></span>');
        originMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([origin.lng, origin.lat])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([origin.lng, origin.lat]);
      }
    } else {
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
    }

    // Destino
    if (destination && destination.lat && destination.lng) {
      if (!destMarkerRef.current) {
        const el = createHtmlElement(
          'custom-map-pin',
          `<span class="map-destination-pin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </span>`
        );
        destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([destination.lng, destination.lat]);
      }
    } else {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
    }

    // Paradas
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = stops.map((st, i) => {
      const el = createHtmlElement(
        'custom-map-pin',
        `<span class="map-stop-pin" aria-label="Parada ${i + 1}">${i + 1}</span>`
      );
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([st.lng, st.lat])
        .addTo(map);
      if (st.address) {
        marker.setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setText(st.address));
      }
      return marker;
    });
  }, [origin, destination, stops]);

  // Marcador e animação fluida do Veículo com Heading
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !vehiclePosition || !vehiclePosition.lat || !vehiclePosition.lng) return;

    const targetLng = vehiclePosition.lng;
    const targetLat = vehiclePosition.lat;
    const targetHeading = Number.isFinite(vehiclePosition.heading)
      ? vehiclePosition.heading!
      : lastBearingRef.current;
    lastBearingRef.current = targetHeading;

    if (!vehicleMarkerRef.current) {
      const el = createHtmlElement(
        'map-vehicle-wrapper',
        `<div class="map-vehicle-shadow"></div>
         <div class="map-vehicle-disc">
           <div class="map-vehicle-heading" id="map-vehicle-heading-arrow">
             <svg viewBox="0 0 24 24">
               <polygon points="12 2 19 21 12 17 5 21 12 2"/>
             </svg>
           </div>
         </div>`
      );

      vehicleArrowRef.current = el.querySelector('#map-vehicle-heading-arrow');
      if (vehicleArrowRef.current) {
        vehicleArrowRef.current.style.transform = `rotate(${targetHeading}deg)`;
      }

      vehicleMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map',
      })
        .setLngLat([targetLng, targetLat])
        .addTo(map);

      // Centraliza inicialmente no veículo se estiver no modo motorista
      if (cameraMode === 'driver') {
        map.easeTo({
          center: [targetLng, targetLat],
          bearing: targetHeading,
          pitch: 52,
          zoom: 17,
          duration: 600,
        });
      }
      return;
    }

    // Gira a seta de direção suavemente
    if (vehicleArrowRef.current) {
      vehicleArrowRef.current.style.transform = `rotate(${targetHeading}deg)`;
    }

    // Interpolação suave de posição via requestAnimationFrame
    if (vehicleAnimationRef.current) cancelAnimationFrame(vehicleAnimationRef.current);
    const startPos = vehicleMarkerRef.current.getLngLat();
    const startedAt = performance.now();
    const duration = 850;

    const frame = (now: number) => {
      const linear = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - linear, 3); // Easing cúbico

      const curLng = startPos.lng + (targetLng - startPos.lng) * eased;
      const curLat = startPos.lat + (targetLat - startPos.lat) * eased;

      vehicleMarkerRef.current?.setLngLat([curLng, curLat]);

      // No modo motorista, a câmera segue rigorosamente a posição e o ângulo do carro
      if (cameraMode === 'driver') {
        map.easeTo({
          center: [curLng, curLat],
          bearing: targetHeading,
          pitch: 52,
          zoom: Math.max(map.getZoom(), 16),
          duration: 0,
        });
      }

      if (linear < 1) {
        vehicleAnimationRef.current = requestAnimationFrame(frame);
      } else {
        vehicleAnimationRef.current = null;
      }
    };

    vehicleAnimationRef.current = requestAnimationFrame(frame);
  }, [vehiclePosition?.lat, vehiclePosition?.lng, vehiclePosition?.heading, cameraMode]);

  // Transição de modo de câmera (Passageiro vs Motorista 3D)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (cameraMode === 'driver') {
      const center: maplibregl.LngLatLike = vehiclePosition
        ? [vehiclePosition.lng, vehiclePosition.lat]
        : map.getCenter();
      const bearing = vehiclePosition?.heading || 0;

      map.flyTo({
        center,
        zoom: 17,
        pitch: 52,
        bearing,
        duration: 900,
      });
      setIsOverviewActive(false);
    } else {
      // Modo passageiro: visão 2D
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 600,
      });
    }
  }, [cameraMode]);

  // Ação de visão geral da rota
  const handleShowRouteOverview = () => {
    const map = mapRef.current;
    if (!map || !routeCoordinates || routeCoordinates.length < 2) return;

    const bounds = boundsFromCoordinates(routeCoordinates);
    if (bounds) {
      setIsOverviewActive(true);
      map.fitBounds(bounds, {
        padding: { top: 60, right: 40, bottom: 60, left: 40 },
        maxZoom: 16,
        pitch: 0,
        bearing: 0,
        duration: 700,
      });
    }
  };

  // Ação de centralizar no veículo
  const handleRecenterVehicle = () => {
    const map = mapRef.current;
    if (!map || !vehiclePosition) return;

    setIsOverviewActive(false);
    map.flyTo({
      center: [vehiclePosition.lng, vehiclePosition.lat],
      zoom: cameraMode === 'driver' ? 17 : 15.5,
      pitch: cameraMode === 'driver' ? 52 : 0,
      bearing: cameraMode === 'driver' ? vehiclePosition.heading || 0 : 0,
      duration: 600,
    });
  };

  const handleToggleMode = (newMode: CameraMode) => {
    onCameraModeChange?.(newMode);
  };

  return (
    <div
      className={`${styles.trackingMapContainer} ${isFullscreen ? 'map-fullscreen-active' : ''} ${className}`}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} className={styles.mapViewport} />

      <div className={styles.mapControlsOverlay}>
        <button
          type="button"
          className={styles.floatingPillButton}
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Sair da tela cheia (ESC)' : 'Expandir mapa em tela cheia (Cockpit)'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 3h6v6m0-6L14 10M9 21H3v-6m0 6l7-7M3 9V3h6M3 3l7 7m11 11h-6m6 0l-7-7" />
            </svg>
          )}
          {isFullscreen ? 'Fechar Tela Cheia' : 'Modo Cockpit'}
        </button>

        <button
          type="button"
          className={styles.floatingPillButton}
          onClick={handleRecenterVehicle}
          title="Focar no veículo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 8 8 12 12 16 12 8" fill="currentColor" />
          </svg>
          Centralizar
        </button>

        {routeCoordinates.length >= 2 && (
          <button
            type="button"
            className={styles.floatingPillButton}
            onClick={handleShowRouteOverview}
            title={isOverviewActive ? 'Visão Geral Ativa' : 'Ver trajeto completo'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
            Visão Geral
          </button>
        )}
      </div>

      <div
        className={styles.cameraModeBadge}
        onClick={() => handleToggleMode(cameraMode === 'passenger' ? 'driver' : 'passenger')}
        style={{ cursor: 'pointer' }}
        title="Clique para alternar o modo de câmera"
      >
        <span className={`${styles.modeDot} ${cameraMode === 'driver' ? styles.driver : ''}`} />
        {cameraMode === 'driver' ? 'Modo Navegação 3D' : 'Visão Monitoramento 2D'}
      </div>

      {/* Painel Cockpit HUD translúcido em Tela Cheia */}
      {isFullscreen && (
        <aside className={styles.cockpitHud} role="region" aria-label="Painel de controle Cockpit">
          <div className={styles.cockpitMetric}>
            <strong>{vehiclePosition?.speed ? `${Math.round(vehiclePosition.speed)} km/h` : '42 km/h'}</strong>
            <span>Velocidade Aferida</span>
          </div>

          <div className={styles.cockpitMetric}>
            <strong>{cameraMode === 'driver' ? 'Perspectiva 3D' : 'Visão Aérea 2D'}</strong>
            <span>Perspectiva</span>
          </div>

          <div className={styles.cockpitMetric}>
            <strong>{stops.length > 0 ? `${stops.length} paradas` : 'Direta'}</strong>
            <span>Itinerário</span>
          </div>

          <button
            type="button"
            className={styles.floatingPillButton}
            onClick={() => handleToggleMode(cameraMode === 'passenger' ? 'driver' : 'passenger')}
          >
            Mudar para {cameraMode === 'passenger' ? 'Navegação 3D' : 'Monitoramento 2D'}
          </button>
        </aside>
      )}
    </div>
  );
};
