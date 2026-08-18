import { apiClient } from '../api/apiClient';

export interface MotoristaDto {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  fornecedorId: number;
}

export interface CriarMotoristaParams {
  nome: string;
  email: string;
  cpf: string;
  fornecedorId: number;
}

export interface BuscarMotoristasQueryParams {
  nome?: string;
  cpf?: string;
  fornecedorId?: number;
}

export interface MotoristaResponse {
  response: MotoristaDto;
}

export interface MotoristasListResponse {
  response: MotoristaDto[];
}

export const driverApi = {
  create(data: CriarMotoristaParams) {
    return apiClient.post<MotoristaResponse>('/usuario/motoristas', data);
  },

  list(query?: BuscarMotoristasQueryParams) {
    return apiClient.get<MotoristasListResponse>('/usuario', { query: query as Record<string, string | number | boolean | null | undefined> });
  },

  getById(id: number) {
    return apiClient.get<MotoristaResponse>(`/usuario/${id}`);
  },
};
