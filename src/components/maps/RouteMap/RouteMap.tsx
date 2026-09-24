import { useEffect, useRef, useState, useMemo } from 'react';
import {
  maplibregl,
  OPEN_FREE_MAP_STYLE,
  CARTO_POSITRON_RASTER_STYLE,
  MAX_ROUTE_MAP_ZOOM,
  boundsFromCoordinates,
  lineFeature,
  emptyLineFeature,
  setSourceData,
  createHtmlElement,
  type LatLngCoord,
} from '../../../services/maps/openFreeMap';
import { Spinner } from '../../common';
import { routingService, type RoutePoint, type RouteResult } from '../../../services/maps/routingService';
import { calculateBearing } from '../../../utils/geoUtils';
import '../styles/mapStyles.css';
import styles from './RouteMap.module.css';

export interface RouteMapProps {
  points: RoutePoint[];
  height?: string | number;
  showOverlay?: boolean;
  allowPlayback?: boolean;
  onRouteCalculated?: (result: RouteResult) => void;
  className?: string;
}

const ROUTE_SOURCE_ID = 'route-source';
const ROUTE_OUTLINE_ID = 'route-outline';
const ROUTE_LINE_ID = 'route-line';

export const RouteMap = ({
  points,
  height = 380,
  showOverlay = true,
  allowPlayback = false,
  onRouteCalculated,
  className = '',
}: RouteMapProps) => {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados de Replay / Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const playbackMarkerRef = useRef<maplibregl.Marker | null>(null);
  const playbackArrowRef = useRef<HTMLElement | null>(null);
  const isMapLoadedRef = useRef(false);

  const validPoints = points.filter(
    (p) =>
      typeof p.lat === 'number' &&
      typeof p.lng === 'number' &&
      !isNaN(p.lat) &&
      !isNaN(p.lng) &&
      (p.lat !== 0 || p.lng !== 0)
  );

  const defaultCenter: [number, number] =
    validPoints.length > 0
      ? [validPoints[0].lng, validPoints[0].lat]
      : [-47.9292, -15.7801]; // Ponto neutro para visão geral do Brasil
  const defaultZoom = validPoints.length > 0 ? 13 : 4.5;

  // Cálculo da rota via routingService
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
      const singlePointRoute: RouteResult = {
        distanceKm: 0,
        durationMinutes: 0,
        coordinates: [[validPoints[0].lat, validPoints[0].lng]],
      };
      setRoute(singlePointRoute);
      onRouteCalculated?.(singlePointRoute);
    } else {
      setRoute(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(validPoints)]);

  // Atalho ESC para fechar tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Redimensiona o mapa ao alternar tela cheia
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 50);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Inicialização do MapLibre
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_FREE_MAP_STYLE,
      center: defaultCenter,
      zoom: defaultZoom,
      pitch: 0,
      bearing: 0,
      maxZoom: MAX_ROUTE_MAP_ZOOM,
    });

    let fallbackApplied = false;
    map.on('error', (err) => {
      if (!fallbackApplied) {
        fallbackApplied = true;
        console.warn('MapLibre RouteMap: ativando fallback de tiles raster Carto Positron:', err);
        map.setStyle(CARTO_POSITRON_RASTER_STYLE);
      }
    });

    window.setTimeout(() => map.resize(), 100);
    window.setTimeout(() => map.resize(), 400);

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    const initLayers = () => {
      if (isMapLoadedRef.current || !map.getStyle()?.layers?.length) return;
      isMapLoadedRef.current = true;

      if (!map.getSource(ROUTE_SOURCE_ID)) {
        map.addSource(ROUTE_SOURCE_ID, {
          type: 'geojson',
          data: emptyLineFeature(),
        });
      }

      if (!map.getLayer(ROUTE_OUTLINE_ID)) {
        map.addLayer({
          id: ROUTE_OUTLINE_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#1e224f',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              6,
              13,
              9,
              17,
              14,
            ],
            'line-opacity': 0.95,
          },
        });
      }

      if (!map.getLayer(ROUTE_LINE_ID)) {
        map.addLayer({
          id: ROUTE_LINE_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#2563eb',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              3,
              13,
              5,
              17,
              8,
            ],
            'line-opacity': 1,
          },
        });
      }

      map.resize();
    };

    map.on('styledata', initLayers);
    map.on('load', initLayers);

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      playbackMarkerRef.current?.remove();
      playbackMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, []);

  // Coordenadas ativas da rota
  const activeRouteCoords: LatLngCoord[] = useMemo(() => {
    return route?.coordinates && route.coordinates.length >= 2
      ? route.coordinates
      : validPoints.map((p) => [p.lat, p.lng]);
  }, [route?.coordinates, validPoints]);

  // Atualização dos Marcadores e da Linha no Mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    validPoints.forEach((point, index) => {
      const isOrigin = index === 0;
      const isDest = index === validPoints.length - 1 && validPoints.length > 1;

      let el: HTMLElement;
      let anchor: maplibregl.PositionAnchor = 'center';

      if (isOrigin) {
        el = createHtmlElement(
          'custom-map-pin',
          `<div class="map-origin-pin-wrapper" title="${point.label || 'Origem'}">
            <span class="map-origin-pin-circle"></span>
          </div>`
        );
      } else if (isDest) {
        anchor = 'bottom';
        el = createHtmlElement(
          'custom-map-pin',
          `<div class="map-destination-pin-wrapper" title="${point.label || 'Destino'}">
            <svg viewBox="0 0 32 42" fill="none">
              <path d="M16 41C16 41 30 26.5 30 16C30 7.71573 23.732 1 16 1C8.26801 1 2 7.71573 2 16C2 26.5 16 41 16 41Z" fill="#1e224f" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
              <circle cx="16" cy="15" r="5" fill="#38bdf8"/>
            </svg>
          </div>`
        );
      } else {
        el = createHtmlElement(
          'custom-map-pin',
          `<div class="map-stop-pin-wrapper" title="${point.label || `Parada ${index}`}">
            <span class="map-stop-pin" aria-label="Parada ${index}">${index}</span>
          </div>`
        );
      }

      const marker = new maplibregl.Marker({ element: el, anchor })
        .setLngLat([point.lng, point.lat])
        .addTo(map);

      if (point.label) {
        const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setText(point.label);
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
    });

    if (isMapLoadedRef.current) {
      if (activeRouteCoords.length >= 2) {
        setSourceData(map, ROUTE_SOURCE_ID, lineFeature(activeRouteCoords));
      } else {
        setSourceData(map, ROUTE_SOURCE_ID, emptyLineFeature());
      }
    }

    if (activeRouteCoords.length >= 2) {
      const bounds = boundsFromCoordinates(activeRouteCoords);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 75, right: 35, bottom: 35, left: 35 },
          maxZoom: 16,
          duration: 600,
        });
      }
    } else if (validPoints.length === 1) {
      map.flyTo({
        center: [validPoints[0].lng, validPoints[0].lat],
        zoom: 14,
        duration: 600,
      });
    }
  }, [route, JSON.stringify(validPoints)]);

  // Loop de Animação de Replay / Playback
  useEffect(() => {
    if (!isPlaying || !allowPlayback || activeRouteCoords.length < 2) return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      // Avança a porcentagem com base no multiplicador de velocidade
      setProgress((prev) => {
        const increment = (deltaMs / 1000) * 3.5 * speedMultiplier;
        const next = prev + increment;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, speedMultiplier, allowPlayback, activeRouteCoords.length]);

  // Atualiza posição do veículo de Replay conforme o progresso (0 - 100%)
  useEffect(() => {
    if (!allowPlayback || activeRouteCoords.length < 2) {
      playbackMarkerRef.current?.remove();
      playbackMarkerRef.current = null;
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    // Calcula posição interpolada
    const totalPoints = activeRouteCoords.length - 1;
    const exactIndex = (progress / 100) * totalPoints;
    const idx = Math.min(Math.floor(exactIndex), totalPoints - 1);
    const fraction = exactIndex - idx;

    const pA = activeRouteCoords[idx];
    const pB = activeRouteCoords[Math.min(idx + 1, totalPoints)];

    const curLat = pA[0] + (pB[0] - pA[0]) * fraction;
    const curLng = pA[1] + (pB[1] - pA[1]) * fraction;
    const bearing = calculateBearing(pA[0], pA[1], pB[0], pB[1]);

    if (!playbackMarkerRef.current) {
      const el = createHtmlElement(
        'map-vehicle-wrapper',
        `<div class="map-vehicle-shadow"></div>
         <div class="map-vehicle-disc">
           <div class="map-vehicle-heading" id="playback-heading-arrow">
             <svg viewBox="0 0 24 24"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
           </div>
         </div>`
      );
      playbackArrowRef.current = el.querySelector('#playback-heading-arrow');
      if (playbackArrowRef.current) {
        playbackArrowRef.current.style.transform = `rotate(${bearing}deg)`;
      }

      playbackMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map',
      })
        .setLngLat([curLng, curLat])
        .addTo(map);
    } else {
      playbackMarkerRef.current.setLngLat([curLng, curLat]);
      if (playbackArrowRef.current) {
        playbackArrowRef.current.style.transform = `rotate(${bearing}deg)`;
      }
    }
  }, [progress, allowPlayback, activeRouteCoords]);

  const stopsCount = Math.max(0, validPoints.length - 2);

  // Estimativa de telemetria durante o replay
  const simulatedSpeed = useMemo(() => {
    if (!isPlaying) return 0;
    // Variação realista entre 38 e 55 km/h
    return Math.round(44 + Math.sin(progress / 5) * 8);
  }, [isPlaying, progress]);

  const handleTogglePlay = () => {
    if (progress >= 100) {
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className={`${styles.mapContainer} ${isFullscreen ? 'map-fullscreen-active' : ''} ${className}`}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} className={styles.leafletMap} />

      {/* Botão de Tela Cheia */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={styles.fullscreenBtn}
          title={isFullscreen ? 'Sair da tela cheia (ESC)' : 'Expandir mapa em tela cheia'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 3h6v6m0-6L14 10M9 21H3v-6m0 6l7-7M3 9V3h6M3 3l7 7m11 11h-6m6 0l-7-7" />
            </svg>
          )}
          <span>{isFullscreen ? 'Fechar Tela Cheia' : 'Tela Cheia'}</span>
        </button>
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Spinner size="sm" />
          <span>Traçando melhor rota...</span>
        </div>
      )}

      {/* Resumo da Rota */}
      {showOverlay && route && validPoints.length >= 2 && !isLoading && (
        <aside className={styles.routeBadgeOverlay} aria-label="Resumo do trajeto">
          <div className={styles.badgeItem}>
            <span className={styles.badgeLabel}>Distância</span>
            <span className={styles.badgeValue}>{route.distanceKm.toFixed(1)} km</span>
          </div>
          <div className={styles.badgeItem}>
            <span className={styles.badgeLabel}>Tempo Estimado</span>
            <span className={styles.badgeValue}>{route.durationMinutes} min</span>
          </div>
          {stopsCount > 0 && (
            <div className={styles.badgeItem}>
              <span className={styles.badgeLabel}>Paradas</span>
              <span className={styles.badgeValue}>{stopsCount}</span>
            </div>
          )}
        </aside>
      )}

      {/* Painel de Replay / Playback */}
      {allowPlayback && activeRouteCoords.length >= 2 && (
        <div className="map-playback-container" role="region" aria-label="Controles de reprodução do trajeto">
          <div className="map-playback-row">
            <button
              type="button"
              className="map-playback-play-btn"
              onClick={handleTogglePlay}
              title={isPlaying ? 'Pausar Replay' : 'Iniciar Replay'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <div className="map-playback-slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={progress}
                onChange={(e) => {
                  setProgress(Number(e.target.value));
                  if (isPlaying) setIsPlaying(false);
                }}
                className="map-playback-slider"
                aria-label="Linha do tempo do trajeto"
              />
            </div>

            <div className="map-playback-speeds">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={`map-playback-speed-btn ${speedMultiplier === speed ? 'active' : ''}`}
                  onClick={() => setSpeedMultiplier(speed)}
                  title={`Velocidade ${speed}x`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="map-playback-meta">
            <div className="map-playback-telemetry">
              <span>Velocidade estimada:</span>
              <strong>{simulatedSpeed} km/h</strong>
            </div>
            <div>
              <span>Progresso: </span>
              <strong>{Math.round(progress)}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
