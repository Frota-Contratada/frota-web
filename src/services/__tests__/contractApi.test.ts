import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contractApi } from '../contract/contractApi';
import { apiClient } from '../api/apiClient';

describe('contractApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls create formatting date to YYYY-MM-DD', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { id: 1, dataVigenciaInicio: '2026-09-13', status: 'ATIVO' } as any,
    });

    const file = new File(['content'], 'contrato.pdf', { type: 'application/pdf' });
    const result = await contractApi.create({
      arquivo: file,
      dataVigenciaInicio: '2026-09-13T00:00:00.000Z',
      dataVigenciaFim: '2027-09-13T00:00:00.000Z',
      empresaId: 30,
      filialId: 704,
      fornecedorId: 864,
      tipoCorridaIds: [1, 2],
    });

    expect(postSpy).toHaveBeenCalled();
    const [endpoint, formData] = postSpy.mock.calls[0];
    expect(endpoint).toBe('/contrato');
    expect(formData instanceof FormData).toBe(true);
    expect((formData as FormData).get('dataVigenciaInicio')).toBe('2026-09-13');
    expect((formData as FormData).get('dataVigenciaFim')).toBe('2027-09-13');
    expect((formData as FormData).get('empresaId')).toBe('30');
    expect((formData as FormData).get('filialId')).toBe('704');
    expect((formData as FormData).get('fornecedorId')).toBe('864');
    expect((formData as FormData).get('tipoCorridaIds')).toBe('1,2');
    expect(result.response.id).toBe(1);
  });

  it('calls publicar on the publication route', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      response: { id: 7, situacao: 'publicado' },
    });

    await contractApi.publicar(7);

    expect(patchSpy).toHaveBeenCalledWith('/contrato/7/publicacao');
  });

  it('calls listAdmin with query params', async () => {
    const mockList = { response: [] };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    await contractApi.listAdmin({ fornecedorId: 5 });

    expect(getSpy).toHaveBeenCalledWith('/contrato/admin', {
      query: { fornecedorId: 5 },
    });
  });

  it('calls getPdfBlob to download contract binary', async () => {
    const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const getBlobSpy = vi.spyOn(apiClient, 'getBlob').mockResolvedValue(mockBlob);

    const result = await contractApi.getPdfBlob(7);

    expect(getBlobSpy).toHaveBeenCalledWith('/contrato/7');
    expect(result).toBe(mockBlob);
  });
});
