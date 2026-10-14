import { useEffect, useRef, useState } from 'react';
import {
  maplibregl,
  OPEN_FREE_MAP_STYLE,
  CARTO_POSITRON_RASTER_STYLE,
  createHtmlElement,
} from '../../../services/maps/openFreeMap';
import '../styles/mapStyles.css';
import styles from './LocationPickerMap.module.css';

export interface LocationPickerMapProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
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
  const [mapReady, setMapReady] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const numLat = latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : null;
  const numLng = longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : null;

  const hasValidCoords =
    numLat !== null &&
    numLng !== null &&
    (numLat !== 0 || numLng !== 0);

  const initialCenter: [number, number] = hasValidCoords
    ? [numLng, numLat]
    : [-48.6619, -26.9078];
  const initialZoom = hasValidCoords ? 14 : 4.5;

  const buildPinElement = (title: string) => {
    return createHtmlElement(
      'map-location-picker-pin',
      `<div class="map-location-picker-pin-inner" title="${title}">
        <span class="map-pin-dot"></span>
      </div>`
    );
  };

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
      setMapReady(true);
      if (hasValidCoords && !markerRef.current) {
        const pinEl = buildPinElement(label);
        const marker = new maplibregl.Marker({
          element: pinEl,
          draggable: false,
          anchor: 'bottom',
        })
          .setLngLat([numLng!, numLat!])
          .addTo(map);

        markerRef.current = marker;
      }
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    const updateOrCreateMarker = (lng: number, lat: number) => {
      if (!markerRef.current) {
        const pinEl = buildPinElement(label);

        const marker = new maplibregl.Marker({
          element: pinEl,
          draggable: false,
          anchor: 'bottom',
        })
          .setLngLat([lng, lat])
          .addTo(map);

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
    };

    if (hasValidCoords) {
      updateOrCreateMarker(numLng!, numLat!);
    }

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
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (!hasValidCoords) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    if (!markerRef.current) {
      const pinEl = buildPinElement(label);

      const marker = new maplibregl.Marker({
        element: pinEl,
        draggable: false,
        anchor: 'bottom',
      })
        .setLngLat([numLng!, numLat!])
        .addTo(map);

      markerRef.current = marker;
      map.easeTo({
        center: [numLng!, numLat!],
        zoom: Math.max(map.getZoom(), 14),
        duration: 500,
      });
    } else {
      const currentPos = markerRef.current.getLngLat();
      const diff =
        Math.abs(currentPos.lat - numLat!) + Math.abs(currentPos.lng - numLng!);

      if (diff > 0.0001) {
        markerRef.current.setLngLat([numLng!, numLat!]);
        map.easeTo({
          center: [numLng!, numLat!],
          zoom: Math.max(map.getZoom(), 14),
          duration: 500,
        });
      }
    }
  }, [mapReady, hasValidCoords, numLat, numLng, label]);

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} className={styles.map} />
      <div className={styles.hintOverlay}>
        <span>
          <strong>{label}:</strong>{' '}
          {hasValidCoords
            ? 'Clique no mapa para alterar a localização.'
            : 'Pesquise pelo CEP/endereço ou clique no mapa para selecionar a localização.'}
        </span>
        {hasValidCoords && (
          <span className={styles.coordinates}>
            {numLat!.toFixed(5)}, {numLng!.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
};
