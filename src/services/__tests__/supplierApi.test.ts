import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplierApi } from '../supplier/supplierApi';
import { apiClient } from '../api/apiClient';

describe('supplierApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls create supplier with valid data', async () => {
    const payload = {
      nome: 'Mobilidade Prime',
      cnpjCpf: '35211434000115',
      filialId: 1,
    };

    const mockResponse = {
      response: {
        id: 101,
        nome: payload.nome,
        cnpjCpf: payload.cnpjCpf,
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await supplierApi.create(payload);

    expect(postSpy).toHaveBeenCalledWith('/fornecedor', payload);
    expect(result.response.id).toBe(101);
  });

  it('calls list suppliers with query parameters', async () => {
    const mockList = {
      response: [
        { id: 1, nome: 'Mobilidade Prime', cnpjCpf: '35211434000115' },
        { id: 2, nome: 'Fornecedor Alpha', cnpjCpf: '02914460028241' },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const query = { nome: 'Mobilidade' };
    const result = await supplierApi.list(query);

    expect(getSpy).toHaveBeenCalledWith('/fornecedor/admin', { query });
    expect(result.response).toHaveLength(2);
  });

  it('calls getById with supplier id', async () => {
    const mockSupplier = {
      response: { id: 1, nome: 'Mobilidade Prime', cnpjCpf: '35211434000115' },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSupplier);

    const result = await supplierApi.getById(1);

    expect(getSpy).toHaveBeenCalledWith('/fornecedor/1');
    expect(result.response.nome).toBe('Mobilidade Prime');
  });
});
