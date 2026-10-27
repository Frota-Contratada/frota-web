import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ridesApi } from '../rides/ridesApi';
import { collaboratorApi } from '../collaborator/collaboratorApi';
import { apiClient } from '../api/apiClient';

describe('approval suppliers and beneficiaries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the candidate suppliers of a request', async () => {
    const candidatos = [
      { fornecedorId: 864, fornecedorNome: 'Transportes Aurora', contratoId: 9001, valorEstimado: 43.32, selecionado: true },
    ];
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ response: candidatos });

    const result = await ridesApi.getFornecedoresCandidatos(12);

    expect(getSpy).toHaveBeenCalledWith('/solicitacoes/12/fornecedores-candidatos');
    expect(result.response[0].selecionado).toBe(true);
  });

  it('approves without supplier when none is chosen', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({ response: { id: 12 } });

    await ridesApi.aprovar(12);

    expect(patchSpy).toHaveBeenCalledWith('/solicitacoes/12/aprovacao', {
      decisao: 'APROVAR',
      fornecedorId: undefined,
    });
  });

  it('lists beneficiaries of the same branch with a page of 100', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: { totalCount: 1, hasNextPage: false, data: [{ id: 7, nome: 'Maria Souza' }] },
    });

    const result = await collaboratorApi.listBeneficiarios({ nome: 'mar' });

    expect(getSpy).toHaveBeenCalledWith('/usuario/colaborador/beneficiarios', {
      query: { limit: 100, nome: 'mar' },
    });
    expect(result.response.data[0].id).toBe(7);
  });
});
