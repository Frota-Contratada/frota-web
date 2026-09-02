import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ridesApi } from '../rides/ridesApi';
import { apiClient } from '../api/apiClient';

describe('ridesApi - Cancelamento pelo aprovador/solicitante', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('calls cancelar with numeric request id and motivoCancelamentoId', async () => {
    const mockResponse = {
      response: {
        id: 42,
        status: 'C',
        dCorrida: '2026-08-20T10:00:00Z',
      },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

    const result = await ridesApi.cancelar(42, { motivoCancelamentoId: 2 });

    expect(patchSpy).toHaveBeenCalledWith('/solicitacoes/42/cancelamento', {
      motivoCancelamentoId: 2,
    });
    expect(result.response.status).toBe('C');
  });

  it('calls cancelar with number as shorthand for motivoId', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      response: { id: 10, status: 'C' },
    });

    await ridesApi.cancelar(10, 3);

    expect(patchSpy).toHaveBeenCalledWith('/solicitacoes/10/cancelamento', {
      motivoCancelamentoId: 3,
    });
  });

  it('fetches cancellation motives from catalog with tipo: 2', async () => {
    const mockMotivos = {
      response: [
        { id: 1, nome: 'Mudança de agenda' },
        { id: 2, nome: 'Solicitação duplicada' },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockMotivos);

    const result = await ridesApi.getMotivosCancelamento();

    expect(getSpy).toHaveBeenCalledWith('/solicitacoes/catalogos/motivos', {
      query: { tipo: 2 },
    });
    expect(result.response).toHaveLength(2);
    expect(result.response[0].nome).toBe('Mudança de agenda');
  });

  it('propagates error if backend rejects cancellation', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValue(new Error('Aprovador não autorizado a cancelar'));

    await expect(ridesApi.cancelar(99, 1)).rejects.toThrow('Aprovador não autorizado a cancelar');
  });
});
