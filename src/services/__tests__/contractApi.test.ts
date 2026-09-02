import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contractApi } from '../contract/contractApi';
import { apiClient } from '../api/apiClient';

describe('contractApi - Vigência e Ativação de Contratos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls atualizarVigencia with contract id and validity dates', async () => {
    const payload = {
      dataVigenciaInicio: '2026-01-01T00:00:00Z',
      dataVigenciaFim: '2026-12-31T23:59:59Z',
    };

    const mockResponse = {
      response: {
        id: 7,
        dataVigenciaInicio: payload.dataVigenciaInicio,
        dataVigenciaFim: payload.dataVigenciaFim,
        status: 'aprovado',
      },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

    const result = await contractApi.atualizarVigencia(7, payload);

    expect(patchSpy).toHaveBeenCalledWith('/contrato/7/vigencia', payload);
    expect(result.response.dataVigenciaInicio).toBe(payload.dataVigenciaInicio);
  });

  it('calls ativar with contract id', async () => {
    const mockResponse = {
      response: { id: 7, status: 'aprovado' },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

    const result = await contractApi.ativar(7);

    expect(patchSpy).toHaveBeenCalledWith('/contrato/7/ativar', {});
    expect(result.response.status).toBe('aprovado');
  });

  it('calls inativar with contract id', async () => {
    const mockResponse = {
      response: { id: 7, status: 'cancelado' },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

    const result = await contractApi.inativar(7);

    expect(patchSpy).toHaveBeenCalledWith('/contrato/7/inativar', {});
    expect(result.response.status).toBe('cancelado');
  });

  it('toggleStatus appropriately calls inativar when currently active and ativar when inactive', async () => {
    const inativarSpy = vi.spyOn(contractApi, 'inativar').mockResolvedValue({
      response: { id: 7, status: 'cancelado' } as any,
    });
    const ativarSpy = vi.spyOn(contractApi, 'ativar').mockResolvedValue({
      response: { id: 7, status: 'aprovado' } as any,
    });

    await contractApi.toggleStatus(7, true);
    expect(inativarSpy).toHaveBeenCalledWith(7);

    await contractApi.toggleStatus(7, false);
    expect(ativarSpy).toHaveBeenCalledWith(7);
  });

  it('calls getPdfBlob to download contract binary', async () => {
    const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const getBlobSpy = vi.spyOn(apiClient, 'getBlob').mockResolvedValue(mockBlob);

    const result = await contractApi.getPdfBlob(7);

    expect(getBlobSpy).toHaveBeenCalledWith('/contrato/7');
    expect(result).toBe(mockBlob);
  });
});
