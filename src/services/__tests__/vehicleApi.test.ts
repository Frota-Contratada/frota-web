import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleApi } from '../vehicle/vehicleApi';
import { apiClient } from '../api/apiClient';

describe('vehicleApi - Veículos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists vehicles', async () => {
    const mockVehicles = [
      { id: 1, placa: 'ABC1D23', modelo: 'Corolla', capacidadePassageiros: 4, fornecedorId: 1, ativo: true },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: mockVehicles,
    });

    const result = await vehicleApi.list();
    expect(Array.isArray(result.response)).toBe(true);
    const list = result.response as typeof mockVehicles;
    expect(list.length).toBe(1);
    expect(list[0].placa).toBe('ABC1D23');
  });

  it('calls getById with vehicle id', async () => {
    const mockVehicle = {
      response: { id: 1, placa: 'ABC1D23', modelo: 'Corolla', capacidadePassageiros: 4, fornecedorId: 1, ativo: true },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockVehicle);

    const result = await vehicleApi.getById(1);

    expect(getSpy).toHaveBeenCalledWith('/veiculos/1');
    expect(result.response.modelo).toBe('Corolla');
  });
});
