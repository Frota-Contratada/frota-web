import { describe, it, expect, vi, beforeEach } from 'vitest';
import { branchApi } from '../branch/branchApi';
import { apiClient } from '../api/apiClient';

describe('branchApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls create branch with complete address and coordinates', async () => {
    const payload = {
      nome: 'Seara Itajaí',
      cnpj: '12345678000199',
      administradorId: 1,
      endereco: {
        cep: '88310000',
        logradouro: 'Av. Marginal Oeste',
        numero: '1200',
        bairro: 'Cordeiros',
        cidade: 'Itajaí',
        uf: 'SC',
        latitude: -26.9,
        longitude: -48.6,
      },
    };

    const mockResponse = {
      response: {
        id: 1,
        nome: payload.nome,
        cnpj: payload.cnpj,
        endereco: payload.endereco,
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await branchApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/filial', payload);
    expect(result.response.id).toBe(1);
  });

  it('calls list branches with query filters', async () => {
    const mockList = {
      response: [
        {
          id: 1,
          nome: 'Seara Itajaí',
          cnpj: '12345678000199',
          endereco: {
            cep: '88310000',
            logradouro: 'Av. Marginal',
            numero: '100',
            bairro: 'Centro',
            cidade: 'Itajaí',
            uf: 'SC',
            latitude: 0,
            longitude: 0,
          },
        },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const query = { nome: 'Itajaí', cnpj: '12345678000199' };
    const result = await branchApi.list(query);

    expect(getSpy).toHaveBeenCalledWith('/filial', { query });
    expect(result.response).toHaveLength(1);
  });

  it('calls getById with branch id', async () => {
    const mockBranch = {
      response: {
        id: 5,
        nome: 'CD Jundiaí',
        cnpj: '99887766000155',
        endereco: {
          cep: '13213000',
          logradouro: 'Rod. Anhanguera',
          numero: '59',
          bairro: 'Industrial',
          cidade: 'Jundiaí',
          uf: 'SP',
          latitude: 0,
          longitude: 0,
        },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockBranch);

    const result = await branchApi.getById(5);

    expect(getSpy).toHaveBeenCalledWith('/filial/5');
    expect(result.response.nome).toBe('CD Jundiaí');
  });

  it('calls update with branch id and payload', async () => {
    const updateData = {
      nome: 'Seara Itajaí Novo',
      endereco: {
        cep: '88310000',
        logradouro: 'Av. Marginal Oeste',
        numero: '1200',
        bairro: 'Cordeiros',
        cidade: 'Itajaí',
        uf: 'SC',
        latitude: 0,
        longitude: 0,
      },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      response: { id: 1, ...updateData, cnpj: '12345678000199' },
    });

    const result = await branchApi.update(1, updateData);

    expect(patchSpy).toHaveBeenCalledWith('/filial/1', updateData);
    expect(result.response.nome).toBe('Seara Itajaí Novo');
  });

  it('calls substituirAdministradores with branch id and admin IDs', async () => {
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(undefined);

    await branchApi.substituirAdministradores(1, { administradorIds: [2, 3] });

    expect(putSpy).toHaveBeenCalledWith('/filial/1/administradores', { administradorIds: [2, 3] });
  });
});
