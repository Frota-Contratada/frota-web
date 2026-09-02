import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ridesApi } from '../rides/ridesApi';
import { apiClient } from '../api/apiClient';

describe('rideAllocation - Atribuição e Alocação de Motorista e Veículo (Tasks 4947 & 4934)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allocates driver and vehicle to ride request calling supplier decision endpoint', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { id: 55, status: 'A', motoristaId: 1, veiculoId: 2 },
    });

    const result = await ridesApi.alocarMotoristaEVeiculo(55, {
      motoristaId: 1,
      veiculoId: 2,
    });

    expect(postSpy).toHaveBeenCalledWith('/solicitacoes/55/decisao-fornecedor', {
      decisao: 'REATRIBUIR',
      motoristaId: 1,
      veiculoId: 2,
    });
    expect((result as any).response.id).toBe(55);
  });
});
