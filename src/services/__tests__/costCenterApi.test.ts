import { describe, it, expect, vi, beforeEach } from 'vitest';
import { costCenterApi } from '../costCenter/costCenterApi';
import { apiClient } from '../api/apiClient';

describe('costCenterApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls vincularAprovador with usuarioId, filialId and centroCustoId', async () => {
    const payload = {
      usuarioId: 10,
      filialId: 1,
      centroCustoId: 5,
    };

    const mockResponse = {
      response: {
        usuarioId: 10,
        filialId: 1,
        centroCustoId: 5,
        dataVinculo: '2026-08-17T12:00:00Z',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await costCenterApi.vincularAprovador(payload);

    expect(postSpy).toHaveBeenCalledWith('/centro-de-custo/aprovadores', payload);
    expect(result.response.usuarioId).toBe(10);
    expect(result.response.centroCustoId).toBe(5);
  });
});
