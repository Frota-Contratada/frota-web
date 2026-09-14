import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Configuração obrigatória do Web Worker no Vite para decodificação de tiles vetoriais
maplibregl.setWorkerUrl(mapLibreWorkerUrl);

export const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

// Estilo raster de fallback (Carto Positron) para ambientes offline, proxies ou bloqueios de Web Worker
export const CARTO_POSITRON_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-raster': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'carto-raster-layer',
      type: 'raster',
      source: 'carto-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Acima deste nível, pequenas diferenças entre a geometria do routing e o OSM podem se tornar visíveis
export const MAX_ROUTE_MAP_ZOOM = 17;

export type LatLngCoord = [number, number]; // [lat, lng]
export type LngLatCoord = [number, number]; // [lng, lat]

export function toLngLat(position: LatLngCoord | { lat: number; lng: number }): LngLatCoord {
  if (Array.isArray(position)) {
    return [Number(position[1]), Number(position[0])];
  }
  return [Number(position.lng), Number(position.lat)];
}

export function toLatLng(position: LngLatCoord | { lat: number; lng: number }): LatLngCoord {
  if (Array.isArray(position)) {
    return [Number(position[1]), Number(position[0])];
  }
  return [Number(position.lat), Number(position.lng)];
}

export function lineFeature(
  coordinates: LatLngCoord[],
  properties: Record<string, unknown> = {}
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'LineString',
      coordinates: (coordinates || []).map(toLngLat),
    },
  };
}

export function emptyLineFeature(): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [],
    },
  };
}

export function featureCollection(
  features: GeoJSON.Feature<GeoJSON.Geometry>[] = []
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    type: 'FeatureCollection',
    features,
  };
}

export function boundsFromCoordinates(coordinates: LatLngCoord[]): maplibregl.LngLatBounds | null {
  if (!coordinates || coordinates.length === 0) return null;
  const bounds = new maplibregl.LngLatBounds();
  coordinates.forEach((coord) => {
    if (
      coord &&
      typeof coord[0] === 'number' &&
      typeof coord[1] === 'number' &&
      !isNaN(coord[0]) &&
      !isNaN(coord[1])
    ) {
      bounds.extend(toLngLat(coord));
    }
  });
  return bounds.isEmpty() ? null : bounds;
}

export function createHtmlElement(className: string, html: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return el;
}

export function setSourceData(
  map: maplibregl.Map | null,
  sourceId: string,
  data: GeoJSON.GeoJSON
) {
  if (!map) return;
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (source?.setData) {
    source.setData(data);
  }
}

export { maplibregl };
