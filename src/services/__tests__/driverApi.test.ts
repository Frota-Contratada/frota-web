import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverApi } from '../driver/driverApi';
import { apiClient } from '../api/apiClient';

describe('driverApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls create driver with correct endpoint and payload', async () => {
    const payload = {
      nome: 'Carlos Henrique',
      email: 'carlos@mobilidadeprime.com',
      cpf: '11122233344',
      fornecedorId: 1,
    };

    const mockResponse = {
      response: {
        id: 501,
        ...payload,
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await driverApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/usuario/motoristas', payload);
    expect(result.response.id).toBe(501);
  });

  it('calls list drivers with query filters', async () => {
    const mockList = {
      response: [
        {
          id: 501,
          nome: 'Carlos Henrique',
          email: 'carlos@mobilidadeprime.com',
          cpf: '11122233344',
          fornecedorId: 1,
        },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const query = { nome: 'Carlos', cpf: '11122233344' };
    const result = await driverApi.list(query);

    expect(getSpy).toHaveBeenCalledWith('/usuario', { query });
    expect(result.response).toHaveLength(1);
  });

  it('calls getById with driver id', async () => {
    const mockDriver = {
      response: {
        id: 501,
        nome: 'Carlos Henrique',
        email: 'carlos@mobilidadeprime.com',
        cpf: '11122233344',
        fornecedorId: 1,
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockDriver);

    const result = await driverApi.getById(501);

    expect(getSpy).toHaveBeenCalledWith('/usuario/501');
    expect(result.response.nome).toBe('Carlos Henrique');
  });
});
