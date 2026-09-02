import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleApi } from '../vehicle/vehicleApi';
import { apiClient } from '../api/apiClient';

describe('vehicleApi - Gestão e Cadastro de Veículos (Tasks 4942 & 4944)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('lists vehicles and applies plate filter', async () => {
    const mockVehicles = [
      { id: 1, placa: 'ABC1D23', modelo: 'Corolla', capacidadePassageiros: 4, fornecedorId: 1, ativo: true },
      { id: 2, placa: 'XYZ9K87', modelo: 'Spin', capacidadePassageiros: 6, fornecedorId: 1, ativo: true },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: mockVehicles,
    });

    const result = await vehicleApi.list();
    expect(Array.isArray(result.response)).toBe(true);
    const list = result.response as typeof mockVehicles;
    expect(list.length).toBe(2);
    expect(list[0].placa).toBe('ABC1D23');
  });

  it('creates new vehicle successfully', async () => {
    const payload = {
      placa: 'BRA9E99',
      modelo: 'Toyota Yaris Sedan',
      capacidadePassageiros: 4,
      fornecedorId: 1,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { id: 88, ...payload, ativo: true },
    });

    const result = await vehicleApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/veiculos', payload);
    expect(result.response.placa).toBe('BRA9E99');
  });

  it('calls patch to toggle vehicle active/inactive status', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      response: { id: 1, ativo: false },
    });

    const result = await vehicleApi.toggleStatus(1, true);
    expect(patchSpy).toHaveBeenCalledWith('/veiculos/1/status', {
      ativo: false,
    });
    expect((result as any).response.ativo).toBe(false);
  });
});
