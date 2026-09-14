import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverApi } from '../driver/driverApi';
import { apiClient } from '../api/apiClient';

describe('driverApi - Gestão e Cadastro de Motoristas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists drivers successfully via API and applies filter', async () => {
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

  it('creates driver sending sanitized 11-digit CPF', async () => {
    const payload = {
      nome: 'Renato Augusto',
      email: 'renato@frota.com',
      cpf: '111.222.333-44',
      fornecedorId: 1,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { id: 100, nome: payload.nome, email: payload.email, cpf: '11122233344', fornecedorId: 1 },
    });

    const result = await driverApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/usuario/motorista/motoristas', {
      nome: payload.nome,
      email: payload.email,
      cpf: '11122233344',
      fornecedorId: 1,
    });
    expect(result.response.id).toBe(100);
  });
});
