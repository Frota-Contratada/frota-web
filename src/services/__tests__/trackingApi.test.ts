import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackingApi } from '../tracking/trackingApi';
import { apiClient } from '../api/apiClient';

describe('trackingApi - Acompanhamento em tempo real (Tasks 5066, 4731, 4680, 5067)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls getSnapshot with ride ID and returns backend tracking snapshot', async () => {
    const mockSnapshot = {
      response: {
        tripId: 123,
        tripStatus: 'IN_PROGRESS',
        waiting: { active: false, startedAt: null },
        vehiclePosition: {
          lat: -23.55,
          lng: -46.63,
          heading: 180,
          speed: 55,
          timestamp: '2026-08-25T10:00:00Z',
        },
        route: {
          distanceMeters: 12000,
          durationSeconds: 1200,
          coordinates: [
            [-23.55, -46.63],
            [-23.56, -46.64],
          ],
        },
        driver: { id: 10, name: 'José Silva', phone: '11999999999' },
        vehicle: { id: 3, plate: 'ABC1D23', model: 'Sedan Executivo' },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSnapshot);

    const result = await trackingApi.getSnapshot(123);

    expect(getSpy).toHaveBeenCalledWith('/corridas/123/tracking');
    expect(result.response.tripStatus).toBe('IN_PROGRESS');
    expect(result.response.vehiclePosition?.speed).toBe(55);
    expect(result.response.driver?.name).toBe('José Silva');
  });

  it('propagates error when backend tracking is temporarily unavailable', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

    await expect(trackingApi.getSnapshot(999)).rejects.toThrow('Network error');
  });

  it('calls postPositions with position array', async () => {
    const positions = [
      { lat: -23.55, lng: -46.63, speed: 40, timestamp: '2026-08-25T10:01:00Z' },
    ];

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ response: { ok: true } });

    await trackingApi.postPositions(123, positions);

    expect(postSpy).toHaveBeenCalledWith('/corridas/123/tracking/positions/batch', {
      positions,
    });
  });
});
