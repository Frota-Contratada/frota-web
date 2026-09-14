/**
 * Utilitários geoespaciais e matemáticos para cálculo de distâncias,
 * rotação/bearing, detecção de desvio de rota e formatação de telemetria.
 */

const EARTH_RADIUS_METERS = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calcula a distância Haversine em metros entre dois pontos geográficos
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calcula o azimute / bearing em graus (0° a 360°)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

/**
 * Projeta um ponto P sobre o segmento AB
 */
export function pointToSegmentDistance(
  point: [number, number],
  segStart: [number, number],
  segEnd: [number, number]
): { distance: number; closestPoint: [number, number]; fraction: number } {
  const [pLat, pLng] = point;
  const [aLat, aLng] = segStart;
  const [bLat, bLng] = segEnd;

  const dx = bLng - aLng;
  const dy = bLat - aLat;

  if (dx === 0 && dy === 0) {
    return {
      distance: calculateDistance(pLat, pLng, aLat, aLng),
      closestPoint: [aLat, aLng],
      fraction: 0,
    };
  }

  let t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * dy;
  const projLng = aLng + t * dx;

  return {
    distance: calculateDistance(pLat, pLng, projLat, projLng),
    closestPoint: [projLat, projLng],
    fraction: t,
  };
}

/**
 * Calcula a distância mínima entre a posição do veículo e a polilinha da rota
 */
export function minDistanceToPolyline(
  point: [number, number],
  coordinates: Array<[number, number]>,
  thresholdMeters = 45
): {
  distance: number;
  isOffRoute: boolean;
  closestIndex: number;
  closestPoint: [number, number];
} {
  if (!coordinates || coordinates.length < 2) {
    return { distance: 0, isOffRoute: false, closestIndex: 0, closestPoint: point };
  }

  let minDistance = Infinity;
  let closestIndex = 0;
  let closestPoint = coordinates[0];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const segA = coordinates[i];
    const segB = coordinates[i + 1];
    const { distance, closestPoint: projPt } = pointToSegmentDistance(point, segA, segB);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
      closestPoint = projPt;
    }
  }

  return {
    distance: minDistance,
    isOffRoute: minDistance > thresholdMeters,
    closestIndex,
    closestPoint,
  };
}

/**
 * Formata distância geral para exibição em métricas (ex: 14.5 km ou 850 m)
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '--';
  if (meters < 1000) {
    const rounded = Math.round(meters / 50) * 50;
    return `${rounded || 50} m`;
  }
  return `${(meters / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/**
 * Formata duração em segundos (ex: 25 min ou 1h 15 min)
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '--';
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins} min`;
}

/**
 * Formata o Horário Estimado de Chegada (ETA)
 */
export function formatETA(secondsFromNow: number | null | undefined): string {
  if (secondsFromNow === undefined || secondsFromNow === null || isNaN(secondsFromNow)) return '--:--';
  const date = new Date(Date.now() + secondsFromNow * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
