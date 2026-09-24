import { useEffect, useRef } from 'react';
import {
  maplibregl,
  OPEN_FREE_MAP_STYLE,
  CARTO_POSITRON_RASTER_STYLE,
  createHtmlElement,
} from '../../../services/maps/openFreeMap';
import '../styles/mapStyles.css';
import styles from './LocationPickerMap.module.css';

export interface LocationPickerMapProps {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  height?: string | number;
  onChange?: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

export const LocationPickerMap = ({
  latitude,
  longitude,
  label = 'Localização da Filial',
  height = 320,
  onChange,
  className = '',
}: LocationPickerMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const hasValidCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0);

  // Ponto central neutro para navegação inicial do mapa (Brasil) se não houver coordenadas definidas
  const initialCenter: [number, number] = hasValidCoords
    ? [longitude, latitude]
    : [-48.6619, -26.9078];
  const initialZoom = hasValidCoords ? 14 : 4.5;

  useEffect(() => {
    if (!containerRef.current) return;

    let fallbackApplied = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_FREE_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      maxZoom: 18,
    });

    map.on('error', (err) => {
      if (!fallbackApplied) {
        fallbackApplied = true;
        console.warn('MapLibre: ativando fallback de tiles raster Carto Positron:', err);
        map.setStyle(CARTO_POSITRON_RASTER_STYLE);
      }
    });

    map.on('load', () => {
      map.resize();
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    const updateOrCreateMarker = (lng: number, lat: number) => {
      if (!markerRef.current) {
        const pinEl = createHtmlElement(
          'map-location-picker-pin',
          `<div class="map-location-picker-pin-inner" title="${label}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>`
        );

        const marker = new maplibregl.Marker({
          element: pinEl,
          draggable: false, // Pin estritamente fixo - sem arrastar
          anchor: 'bottom',
        })
          .setLngLat([lng, lat])
          .addTo(map);

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
    };

    // Só adiciona o pin se houver localização válida selecionada pelo usuário ou registro existente
    if (hasValidCoords) {
      updateOrCreateMarker(longitude!, latitude!);
    }

    // Clique no mapa define ou reposiciona o pin explicitamente (sem arrastar)
    map.on('click', (e: maplibregl.MapMouseEvent) => {
      if (onChangeRef.current) {
        updateOrCreateMarker(e.lngLat.lng, e.lngLat.lat);
        onChangeRef.current({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
      }
    });

    mapRef.current = map;

    const t1 = window.setTimeout(() => map.resize(), 100);
    const t2 = window.setTimeout(() => map.resize(), 400);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      resizeObserver.disconnect();
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sincroniza posição do marcador e câmera quando lat/lng mudam externamente
  useEffect(() => {
    if (!mapRef.current) return;

    if (!hasValidCoords) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    if (!markerRef.current) {
      const pinEl = createHtmlElement(
        'map-location-picker-pin',
        `<div class="map-location-picker-pin-inner" title="${label}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`
      );

      const marker = new maplibregl.Marker({
        element: pinEl,
        draggable: false, // Fixo
        anchor: 'bottom',
      })
        .setLngLat([longitude!, latitude!])
        .addTo(map);

      markerRef.current = marker;
      map.easeTo({
        center: [longitude!, latitude!],
        zoom: Math.max(map.getZoom(), 14),
        duration: 500,
      });
    } else {
      const currentPos = markerRef.current.getLngLat();
      const diff =
        Math.abs(currentPos.lat - latitude!) + Math.abs(currentPos.lng - longitude!);

      if (diff > 0.0001) {
        markerRef.current.setLngLat([longitude!, latitude!]);
        map.easeTo({
          center: [longitude!, latitude!],
          zoom: Math.max(map.getZoom(), 14),
          duration: 500,
        });
      }
    }
  }, [hasValidCoords, latitude, longitude, label]);

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} className={styles.map} />
      <div className={styles.hintOverlay}>
        <span>
          💡 <strong>{label}:</strong> {hasValidCoords ? 'Clique no mapa para alterar a localização.' : 'Pesquise pelo CEP/endereço ou clique no mapa para selecionar a localização.'}
        </span>
        {hasValidCoords && (
          <span className={styles.coordinates}>
            {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
};
