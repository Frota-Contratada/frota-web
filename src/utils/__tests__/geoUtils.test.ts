import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateBearing,
  formatDistance,
  formatDuration,
  formatETA,
  minDistanceToPolyline,
} from '../geoUtils';

describe('geoUtils (Matemática geoespacial e formatação de telemetria)', () => {
  it('calculates Haversine distance correctly between two points', () => {
    // Distância aproximada entre dois pontos em São Paulo (~8.4 km)
    const lat1 = -23.507248;
    const lon1 = -46.653695;
    const lat2 = -23.513207;
    const lon2 = -46.731058;

    const dist = calculateDistance(lat1, lon1, lat2, lon2);
    expect(dist).toBeGreaterThan(7500);
    expect(dist).toBeLessThan(8500);
  });

  it('calculates bearing angle between 0 and 360 degrees', () => {
    // Indo para o Oeste (aproximadamente 270°)
    const bearing = calculateBearing(-23.507248, -46.653695, -23.507248, -46.731058);
    expect(bearing).toBeGreaterThan(260);
    expect(bearing).toBeLessThan(280);
  });

  it('formats distances cleanly', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(14500)).toContain('14');
    expect(formatDistance(14500)).toContain('km');
    expect(formatDistance(null)).toBe('--');
  });

  it('formats duration in minutes and hours', () => {
    expect(formatDuration(1500)).toBe('25 min');
    expect(formatDuration(4500)).toBe('1h 15 min');
    expect(formatDuration(null)).toBe('--');
  });

  it('formats ETA from now', () => {
    const eta = formatETA(1800); // 30 minutos a partir de agora
    expect(eta).toMatch(/^\d{2}:\d{2}$/);
  });

  it('calculates minDistanceToPolyline and detects if on route', () => {
    const polyline: Array<[number, number]> = [
      [-23.507248, -46.653695],
      [-23.5058, -46.6925],
      [-23.513207, -46.731058],
    ];

    const onRoutePoint: [number, number] = [-23.5058, -46.6925];
    const result = minDistanceToPolyline(onRoutePoint, polyline, 45);
    expect(result.distance).toBeLessThan(5);
    expect(result.isOffRoute).toBe(false);

    const offRoutePoint: [number, number] = [-23.600000, -46.800000];
    const offResult = minDistanceToPolyline(offRoutePoint, polyline, 45);
    expect(offResult.isOffRoute).toBe(true);
  });
});
