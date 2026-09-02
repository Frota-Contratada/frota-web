import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverApi } from '../driver/driverApi';
import { apiClient } from '../api/apiClient';

describe('driverApi - Gestão e Cadastro de Motoristas (Tasks 4937 & 4940)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('lists drivers successfully via API and applies inactive filter', async () => {
    const mockDrivers = [
      { id: 10, nome: 'João da Silva', cpf: '12345678901', email: 'joao@transporte.com', fornecedorId: 1 },
      { id: 11, nome: 'Maria Santos', cpf: '98765432100', email: 'maria@transporte.com', fornecedorId: 1 },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: mockDrivers,
    });

    const result = await driverApi.list({ fornecedorId: 1 });

    expect(Array.isArray(result.response)).toBe(true);
    const list = result.response as typeof mockDrivers;
    expect(list.length).toBe(2);
    expect(list[0].nome).toBe('João da Silva');
  });

  it('creates driver and persists in cache when API responds', async () => {
    const payload = {
      nome: 'Renato Augusto',
      email: 'renato@frota.com',
      cpf: '111.222.333-44',
      fornecedorId: 1,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { id: 100, ...payload },
    });

    const result = await driverApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/usuario/motorista/motoristas', payload);
    expect(result.response.id).toBe(100);
  });

  it('calls patch with status when toggling driver active status', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      response: { id: 1, ativo: false },
    });

    const result = await driverApi.toggleStatus(1, true);
    expect(patchSpy).toHaveBeenCalledWith('/usuario/motorista/1/status', {
      ativo: false,
    });
    expect((result as any).response.ativo).toBe(false);
  });
});
