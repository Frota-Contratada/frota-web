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
    const cleanCpf = data.cpf.replace(/\D/g, '');
    return apiClient.post<MotoristaResponse>('/usuario/motorista/motoristas', {
      nome: data.nome,
      email: data.email,
      cpf: cleanCpf,
      fornecedorId: data.fornecedorId,
    });
  },

  list(query?: BuscarMotoristasQueryParams) {
    return apiClient.get<MotoristasListResponse>('/usuario/motorista', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getById(id: number) {
    return apiClient.get<MotoristaResponse>(`/usuario/motorista/${id}`);
  },
};
