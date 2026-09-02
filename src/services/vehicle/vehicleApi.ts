import { apiClient } from '../api/apiClient';

export interface VeiculoDto {
  id: number;
  placa: string;
  modelo: string;
  tipoVeiculoId?: number;
  tipoVeiculoNome?: string;
  capacidadePassageiros: number;
  fornecedorId: number;
  fornecedorNome?: string;
  dataAtivacao?: string;
  ativo: boolean;
}

export interface CriarVeiculoParams {
  placa: string;
  modelo: string;
  tipoVeiculoId?: number;
  capacidadePassageiros: number;
  fornecedorId: number;
}

export interface BuscarVeiculosQueryParams {
  placa?: string;
  fornecedorId?: number;
  ativo?: boolean;
}

export interface VeiculoResponse {
  response: VeiculoDto;
}

export interface VeiculosListResponse {
  response: {
    totalCount: number;
    data: VeiculoDto[];
  } | VeiculoDto[];
}

export const vehicleApi = {
  create(data: CriarVeiculoParams) {
    return apiClient.post<VeiculoResponse>('/veiculos', data);
  },

  list(query?: BuscarVeiculosQueryParams) {
    return apiClient.get<VeiculosListResponse>('/veiculos', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getById(id: number) {
    return apiClient.get<VeiculoResponse>(`/veiculos/${id}`);
  },

  toggleStatus(id: number, ativoAtual: boolean) {
    return apiClient.patch<{ response: VeiculoDto }>(`/veiculos/${id}/status`, {
      ativo: !ativoAtual,
    });
  },
};
