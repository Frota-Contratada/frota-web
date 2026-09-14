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
        tripStatus: 'in_progress',
        waiting: { active: false, startedAt: null },
        vehiclePosition: {
          lat: -23.55,
          lng: -46.63,
          heading: 180,
          speed: 55,
          timestamp: '2026-08-25T10:00:00Z',
        },
        route: {
          routeId: 'route-1',
          version: 1,
          calculatedAt: '2026-08-25T10:00:00Z',
          origin: { id: 'orig', sequence: 0, kind: 'origin' as const, label: 'Origem', lat: -23.55, lng: -46.63 },
          stops: [],
          destination: { id: 'dest', sequence: 1, kind: 'destination' as const, label: 'Destino', lat: -23.56, lng: -46.64 },
          distanceMeters: 12000,
          durationSeconds: 1200,
          trafficDelaySeconds: 0,
          trafficSections: [],
          instructions: [],
          coordinates: [
            { lat: -23.55, lng: -46.63 },
            { lat: -23.56, lng: -46.64 },
          ],
        },
        driver: { id: '10', displayName: 'José Silva' },
        vehicle: { id: '3', plate: 'ABC1D23', description: 'Sedan Executivo' },
        startedAt: '2026-08-25T10:00:00Z',
        updatedAt: '2026-08-25T10:05:00Z',
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSnapshot);

    const result = await trackingApi.getSnapshot(123);

    expect(getSpy).toHaveBeenCalledWith('/corridas/123/tracking');
    expect(result.response.tripStatus).toBe('in_progress');
    expect(result.response.vehiclePosition?.speed).toBe(55);
    expect(result.response.driver?.displayName).toBe('José Silva');
  });

  it('propagates error when backend tracking is temporarily unavailable', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

    await expect(trackingApi.getSnapshot(999)).rejects.toThrow('Network error');
  });

  it('calls postPositions with position array', async () => {
    const positions = [
      { lat: -23.55, lng: -46.63, speed: 40, timestamp: '2026-08-25T10:01:00Z' },
    ];

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ response: { accepted: positions[0] } });

    await trackingApi.postPositions(123, positions);

    expect(postSpy).toHaveBeenCalledWith('/corridas/123/tracking/positions/batch', {
      positions,
    });
  });

  it('calls startWaiting, resumeWaiting and finishTrip with idempotency headers', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ response: {} });

    await trackingApi.startWaiting(123, 'key-1');
    expect(postSpy).toHaveBeenCalledWith('/corridas/123/waiting/start', {}, { headers: { 'idempotency-key': 'key-1' } });

    await trackingApi.resumeWaiting(123, 'key-2');
    expect(postSpy).toHaveBeenCalledWith('/corridas/123/waiting/resume', {}, { headers: { 'idempotency-key': 'key-2' } });

    await trackingApi.finishTrip(123, 'key-3');
    expect(postSpy).toHaveBeenCalledWith('/corridas/123/finish', {}, { headers: { 'idempotency-key': 'key-3' } });
  });
});
