import { apiClient } from '../api/apiClient';

export interface MotoristaDto {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  fornecedorId?: number;
  telefone?: string;
  cnh?: string;
  fornecedorNome?: string;
  dataAtivacao?: string;
  ativo?: boolean;
}

export interface CriarMotoristaParams {
  nome: string;
  email: string;
  cpf: string;
  fornecedorId: number;
  telefone?: string;
  cnh?: string;
}

export interface BuscarMotoristasQueryParams {
  nome?: string;
  cpf?: string;
  page?: number;
  limit?: number;
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
      nome: data.nome.trim(),
      email: data.email.trim(),
      cpf: cleanCpf,
      fornecedorId: Number(data.fornecedorId),
      ...(data.telefone ? { telefone: data.telefone } : {}),
      ...(data.cnh ? { cnh: data.cnh } : {}),
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

  getViagens(query?: { inicio: string; fim: string }) {
    return apiClient.get<{ response: any[] }>('/motorista/viagens', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getCorrida(id: number) {
    return apiClient.get<{ response: any }>(`/motorista/corridas/${id}`);
  },

  iniciarCorrida(id: number) {
    return apiClient.post<{ response: any }>(`/motorista/corridas/${id}/iniciar`, {});
  },

  recusarCorrida(id: number, motivo: string) {
    return apiClient.post<{ response: any }>(`/motorista/corridas/${id}/recusar`, { motivo });
  },

  getMeusDados() {
    return apiClient.get<{ response: any }>('/motorista/meus-dados');
  },
};
