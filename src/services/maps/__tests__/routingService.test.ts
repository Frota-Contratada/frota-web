import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routingService } from '../routingService';

describe('routingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns zero distance for less than 2 points', async () => {
    const result = await routingService.calcularRota([{ lat: -23.55, lng: -46.63 }]);
    expect(result.distanceKm).toBe(0);
    expect(result.durationMinutes).toBe(0);
  });

  it('calls OSRM and calculates distance and polyline coordinates', async () => {
    const mockOsrm = {
      routes: [
        {
          distance: 18500,
          duration: 1800,
          geometry: {
            coordinates: [
              [-46.745, -23.518],
              [-46.473, -23.435],
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOsrm,
    });

    const points = [
      { lat: -23.518, lng: -46.745 },
      { lat: -23.435, lng: -46.473 },
    ];

    const result = await routingService.calcularRota(points);

    expect(result.distanceKm).toBe(18.5);
    expect(result.durationMinutes).toBe(30);
    expect(result.coordinates).toEqual([
      [-23.518, -46.745],
      [-23.435, -46.473],
    ]);
  });

  it('uses fallback calculation when OSRM request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const points = [
      { lat: -23.518, lng: -46.745 },
      { lat: -23.435, lng: -46.473 },
    ];

    const result = await routingService.calcularRota(points);

    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationMinutes).toBeGreaterThan(0);
    expect(result.coordinates).toHaveLength(2);
  });
});
