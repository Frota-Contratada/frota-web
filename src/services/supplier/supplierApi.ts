import { apiClient } from '../api/apiClient';

export interface FornecedorDto {
  id: number;
  nome: string;
  cnpjCpf: string;
}

export interface CriarFornecedorParams {
  nome: string;
  cnpjCpf: string;
  filialId: number;
}

export interface BuscarFornecedoresQueryParams {
  nome?: string;
  cnpjCpf?: string;
}

export interface FornecedorResponse {
  response: FornecedorDto;
}

export interface FornecedoresListResponse {
  response: FornecedorDto[];
}

export const supplierApi = {
  create(data: CriarFornecedorParams) {
    return apiClient.post<FornecedorResponse>('/fornecedor', data);
  },

  list(query?: BuscarFornecedoresQueryParams) {
    return apiClient.get<FornecedoresListResponse>('/fornecedor', { query: query as Record<string, string | number | boolean | null | undefined> });
  },

  getById(id: number) {
    return apiClient.get<FornecedorResponse>(`/fornecedor/${id}`);
  },
};
