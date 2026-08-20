import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { branchIcon } from './mapIcons';
import styles from './LocationPickerMap.module.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  height?: string | number;
  onChange?: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}


const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};


const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
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
  const markerRef = useRef<LeafletMarker | null>(null);

  const validLat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : -23.55052;
  const validLng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : -46.633308;

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
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
      <MapContainer
        center={[validLat, validLng]}
        zoom={14}
        scrollWheelZoom={false}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <Marker
          draggable
          eventHandlers={eventHandlers}
          position={[validLat, validLng]}
          ref={markerRef}
          icon={branchIcon}
        >
          <Popup>
            <strong>{label}</strong>
            <br />
            <span>Arraste o pin ou clique no mapa para ajustar.</span>
          </Popup>
        </Marker>

        <MapClickHandler
          onLocationSelect={(lat, lng) => {
            onChange?.({ latitude: lat, longitude: lng });
          }}
        />

        <MapRecenter lat={validLat} lng={validLng} />
      </MapContainer>

      <div className={styles.hintOverlay}>
        <span>Clique no mapa ou arraste o pin para ajustar o endereço</span>
        <span className={styles.coordinates}>
          {validLat.toFixed(5)}, {validLng.toFixed(5)}
        </span>
      </div>
    </div>
  );
};
