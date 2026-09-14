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
  latitude: number;
  longitude: number;
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

  const validLat =
    typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0
      ? latitude
      : -23.55052;
  const validLng =
    typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0
      ? longitude
      : -46.633308;

  useEffect(() => {
    if (!containerRef.current) return;

    let fallbackApplied = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_FREE_MAP_STYLE,
      center: [validLng, validLat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
      maxZoom: 18,
    });

    // Se houver qualquer falha com o estilo vetorial ou worker, usa fallback raster
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
      draggable: true,
      anchor: 'bottom',
    })
      .setLngLat([validLng, validLat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      onChangeRef.current?.({ latitude: lngLat.lat, longitude: lngLat.lng });
    });

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

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
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sincroniza posição do marcador e câmera quando lat/lng mudam externamente
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const currentPos = markerRef.current.getLngLat();
    const diff =
      Math.abs(currentPos.lat - validLat) + Math.abs(currentPos.lng - validLng);

    if (diff > 0.0001) {
      markerRef.current.setLngLat([validLng, validLat]);
      mapRef.current.easeTo({
        center: [validLng, validLat],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 500,
      });
    }
  }, [validLat, validLng]);

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} className={styles.map} />
      <div className={styles.hintOverlay}>
        <span>
          💡 <strong>{label}:</strong> Arraste o pin ou clique no mapa para ajustar.
        </span>
        <span className={styles.coordinates}>
          {validLat.toFixed(5)}, {validLng.toFixed(5)}
        </span>
      </div>
    </div>
  );
};
