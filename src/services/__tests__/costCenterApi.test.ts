import { describe, it, expect, vi, beforeEach } from 'vitest';
import { costCenterApi } from '../costCenter/costCenterApi';
import { apiClient } from '../api/apiClient';

describe('costCenterApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls vincularAprovador with real backend PUT endpoint', async () => {
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

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

    const result = await costCenterApi.vincularAprovador(payload);

    expect(putSpy).toHaveBeenCalledWith('/usuario/colaborador/10/perfis/aprovador', {
      centroCustoId: 5,
    });
    expect(result.response.usuarioId).toBe(10);
    expect(result.response.centroCustoId).toBe(5);
  });

  it('lists branch cost centers when no master profile is active', async () => {
    const mockList = { response: [{ filialId: 1, numero: 101, nome: 'Operações' }] };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const result = await costCenterApi.list();

    expect(getSpy).toHaveBeenCalledWith('/centro-de-custo/filial', { query: undefined });
    expect(result.response).toEqual(mockList.response);
  });

  it('resolves empresaId when listing admin cost centers for a filial', async () => {
    const mockList = {
      response: {
        totalCount: 1,
        hasNextPage: false,
        data: [{ filialId: 704, numero: 4704, nome: 'Operações Sul' }],
      },
    };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const result = await costCenterApi.listAdmin({ filialId: 704 });

    expect(getSpy).toHaveBeenCalledWith('/centro-de-custo/admin', {
      query: expect.objectContaining({ filialId: 704, limit: 100, page: 1 }),
    });
    expect(result.response).toEqual(mockList.response);
  });
});
