import { apiClient } from '../api/apiClient';

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
  nome: string;
  cnpj: string;
  endereco: EnderecoDto;
}

export interface CriarFilialParams {
  nome: string;
  cnpj: string;
  administradorId: number;
  endereco: EnderecoDto;
}

export interface AtualizarFilialParams {
  nome?: string;
  endereco?: EnderecoDto;
}

export interface BuscarFiliaisQueryParams {
  nome?: string;
  cnpj?: string;
  endereco?: string;
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
  administradorIds: number[];
}

export const branchApi = {
  create(data: CriarFilialParams) {
    return apiClient.post<FilialResponse>('/filial', data);
  },

  list(query?: BuscarFiliaisQueryParams) {
    return apiClient.get<FiliaisListResponse>('/filial', { query: query as Record<string, string | number | boolean | null | undefined> });
  },

  getById(id: number) {
    return apiClient.get<FilialResponse>(`/filial/${id}`);
  },

  update(id: number, data: AtualizarFilialParams) {
    return apiClient.patch<FilialResponse>(`/filial/${id}`, data);
  },

  substituirAdministradores(id: number, data: SubstituirAdministradoresParams) {
    return apiClient.put<void>(`/filial/${id}/administradores`, data);
  },
};

