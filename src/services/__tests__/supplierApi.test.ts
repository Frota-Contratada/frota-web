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

  it('calls inativar with supplier id', async () => {
    const mockInactive = {
      response: { id: 5, ativo: false, status: 'cancelado' },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockInactive);

    const result = await supplierApi.inativar(5);

    expect(patchSpy).toHaveBeenCalledWith('/fornecedor/5/inativar', {});
    expect(result.response.ativo).toBe(false);
  });

  it('calls reativar with supplier id', async () => {
    const mockActive = {
      response: { id: 5, ativo: true, status: 'aprovado' },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockActive);

    const result = await supplierApi.reativar(5);

    expect(patchSpy).toHaveBeenCalledWith('/fornecedor/5/reativar', {});
    expect(result.response.ativo).toBe(true);
  });

  it('toggles status appropriately based on current active state', async () => {
    const inativarSpy = vi.spyOn(supplierApi, 'inativar').mockResolvedValue({
      response: { id: 5, ativo: false } as any,
    });
    const reativarSpy = vi.spyOn(supplierApi, 'reativar').mockResolvedValue({
      response: { id: 5, ativo: true } as any,
    });

    await supplierApi.toggleStatus(5, true);
    expect(inativarSpy).toHaveBeenCalledWith(5);

    await supplierApi.toggleStatus(5, false);
    expect(reativarSpy).toHaveBeenCalledWith(5);
  });
});
