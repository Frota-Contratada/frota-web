import { apiClient } from '../api/apiClient';

export interface MotoristaDto {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  cnh?: string;
  fornecedorId: number;
  fornecedorNome?: string;
  dataAtivacao?: string;
  ativo?: boolean;
}

export interface CriarMotoristaParams {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  cnh?: string;
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

export interface PaginatedMotoristas {
  totalCount: number;
  hasNextPage: boolean;
  data: MotoristaDto[];
}

export interface MotoristasListResponse {
  response: PaginatedMotoristas | MotoristaDto[];
}

export const driverApi = {
  create(data: CriarMotoristaParams) {
    return apiClient.post<MotoristaResponse>('/usuario/motorista/motoristas', data);
  },

  list(query?: BuscarMotoristasQueryParams) {
    return apiClient.get<MotoristasListResponse>('/usuario/motorista', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getById(id: number) {
    return apiClient.get<MotoristaResponse>(`/usuario/motorista/${id}`);
  },

  toggleStatus(id: number, ativoAtual: boolean) {
    return apiClient.patch<{ response: MotoristaDto }>(`/usuario/motorista/${id}/status`, {
      ativo: !ativoAtual,
    });
  },
};
