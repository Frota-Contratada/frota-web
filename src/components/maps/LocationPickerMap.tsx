import { useEffect, useMemo, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { branchIcon, createTomTomMarkerElement } from './mapIcons';
import { TOMTOM_CONFIG } from '../../services/maps/tomtomConfig';
import styles from './LocationPickerMap.module.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  height?: string | number;
  onChange?: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

const LeafletClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LeafletRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 15, { animate: true, duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
};

export const LocationPickerMap = ({
  latitude,
  longitude,
  label = 'Localização da Filial',
  height = 320,
  onChange,
  className = '',
}: LocationPickerMapProps) => {
  const leafletMarkerRef = useRef<LeafletMarker | null>(null);
  const tomtomContainerRef = useRef<HTMLDivElement | null>(null);
  const tomtomMapRef = useRef<tt.Map | null>(null);
  const tomtomMarkerRef = useRef<tt.Marker | null>(null);

  const validLat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : -23.55052;
  const validLng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : -46.633308;

  useEffect(() => {
    if (!TOMTOM_CONFIG.hasKey || !tomtomContainerRef.current) return;

    if (!tomtomMapRef.current) {
      const mapInstance = tt.map({
        key: TOMTOM_CONFIG.apiKey,
        container: tomtomContainerRef.current,
        center: [validLng, validLat],
        zoom: 14,
        stylesVisibility: {
          trafficFlow: true,
        },
      });

      mapInstance.addControl(new tt.NavigationControl());

      const markerEl = createTomTomMarkerElement('branch');
      const popup = new tt.Popup({ offset: [0, -40] }).setHTML(
        `<strong>${label}</strong><br/><span>Arraste o pin ou clique no mapa para ajustar.</span>`
      );

      const marker = new tt.Marker({ element: markerEl, draggable: true })
        .setLngLat([validLng, validLat])
        .setPopup(popup)
        .addTo(mapInstance);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        onChange?.({ latitude: lat, longitude: lng });
      });

      mapInstance.on('click', (e: { lngLat: { lng: number; lat: number } }) => {
        marker.setLngLat(e.lngLat);
        onChange?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
      });

      tomtomMapRef.current = mapInstance;
      tomtomMarkerRef.current = marker;
    } else {
      if (tomtomMarkerRef.current) {
        tomtomMarkerRef.current.setLngLat([validLng, validLat]);
      }
      tomtomMapRef.current.easeTo({ center: [validLng, validLat], zoom: 15 });
    }
  }, [TOMTOM_CONFIG.hasKey, validLat, validLng, label]);

  useEffect(() => {
    return () => {
      if (tomtomMapRef.current) {
        tomtomMapRef.current.remove();
        tomtomMapRef.current = null;
        tomtomMarkerRef.current = null;
      }
    };
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = leafletMarkerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onChange?.({ latitude: lat, longitude: lng });
        }
      },
    }),
    [onChange]
  );

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {TOMTOM_CONFIG.hasKey ? (
        <div ref={tomtomContainerRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <MapContainer
          center={[validLat, validLng]}
          zoom={14}
          scrollWheelZoom={false}
          className={styles.map}
        >
          <TileLayer
            attribution={TOMTOM_CONFIG.getTileAttribution()}
            url={TOMTOM_CONFIG.getTileUrl()}
            subdomains={TOMTOM_CONFIG.getTileSubdomains()}
            maxZoom={TOMTOM_CONFIG.getTileMaxZoom()}
          />

          <Marker
            draggable
            eventHandlers={eventHandlers}
            position={[validLat, validLng]}
            ref={leafletMarkerRef}
            icon={branchIcon}
          >
            <Popup>
              <strong>{label}</strong>
              <br />
              <span>Arraste o pin ou clique no mapa para ajustar.</span>
            </Popup>
          </Marker>

          <LeafletClickHandler
            onLocationSelect={(lat, lng) => {
              onChange?.({ latitude: lat, longitude: lng });
            }}
          />

          <LeafletRecenter lat={validLat} lng={validLng} />
        </MapContainer>
      )}

      <div className={styles.hintOverlay}>
        <span>Clique no mapa ou arraste o pin para ajustar o endereço</span>
        <span className={styles.coordinates}>
          {validLat.toFixed(5)}, {validLng.toFixed(5)}
        </span>
      </div>
    </div>
  );
};
