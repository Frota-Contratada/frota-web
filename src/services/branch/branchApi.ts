import { apiClient } from '../api/apiClient';
import { resolveEmpresaId } from '../../utils/apiHelpers';

export interface EnderecoDto {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
}

export interface FilialDto {
  id: number;
  empresaId?: number;
  nome: string;
  cnpj: string;
  endereco: EnderecoDto;
}

export interface CriarFilialParams {
  empresaId?: number;
  nome: string;
  cnpj: string;
  administradorId: number;
  endereco: EnderecoDto;
}

export interface AtualizarFilialParams {
  empresaId?: number;
  nome: string;
  endereco: EnderecoDto;
}

export interface BuscarFiliaisQueryParams {
  nome?: string;
  cnpj?: string;
  endereco?: string;
  page?: number;
  limit?: number;
}

export interface FilialResponse {
  response: FilialDto;
}

export interface PaginatedFiliais {
  totalCount: number;
  hasNextPage: boolean;
  data: FilialDto[];
}

export interface FiliaisListResponse {
  response: PaginatedFiliais | FilialDto[];
}

export interface SubstituirAdministradoresParams {
  empresaId?: number;
  administradorIds: number[];
}

export const branchApi = {
  create(data: CriarFilialParams) {
    const empresaId = resolveEmpresaId(data.empresaId);
    return apiClient.post<FilialResponse>('/filial', {
      ...data,
      empresaId,
    });
  },

  list(query?: BuscarFiliaisQueryParams) {
    return apiClient.get<FiliaisListResponse>('/filial', { query: query as Record<string, string | number | boolean | null | undefined> });
  },

  getById(id: number, empresaId?: number) {
    return apiClient.get<FilialResponse>(`/filial/${id}`, {
      query: { empresaId: resolveEmpresaId(empresaId) },
    });
  },

  update(id: number, data: AtualizarFilialParams) {
    const { empresaId, ...body } = data;
    return apiClient.patch<FilialResponse>(`/filial/${id}`, body, {
      query: { empresaId: resolveEmpresaId(empresaId) },
    });
  },

  substituirAdministradores(id: number, data: SubstituirAdministradoresParams) {
    const { empresaId, ...body } = data;
    return apiClient.put<void>(`/filial/${id}/administradores`, body, {
      query: { empresaId: resolveEmpresaId(empresaId) },
    });
  },
};

