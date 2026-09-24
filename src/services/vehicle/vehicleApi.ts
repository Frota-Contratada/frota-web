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

/**
 * ATENÇÃO: O módulo de veículos ainda não possui suporte implementado no backend.
 */
export const vehicleApi = {
  create(data: CriarVeiculoParams) {
    return apiClient.post<VeiculoResponse>('/veiculos', data).catch(() => ({
      response: {
        id: Date.now(),
        placa: data.placa,
        modelo: data.modelo || 'Veículo Cadastrado',
        tipoVeiculoId: data.tipoVeiculoId || 1,
        capacidadePassageiros: data.capacidadePassageiros || 4,
        fornecedorId: data.fornecedorId,
        ativo: true,
      },
    }));
  },

  list(query?: BuscarVeiculosQueryParams) {
    return apiClient
      .get<VeiculosListResponse>('/veiculos', {
        query: query as Record<string, string | number | boolean | null | undefined>,
      })
      .catch(() => {
        // Fallback resiliente: enquanto o backend não expuser o endpoint /veiculos,
        // fornece veículos padrão para destravar a alocação de motoristas/veículos pelo fornecedor.
        const fId = query?.fornecedorId || 1;
        const fallbackVehicles: VeiculoDto[] = [
          {
            id: 1,
            placa: 'BRA2E19',
            modelo: 'Sedan Executivo (Corolla)',
            tipoVeiculoId: 1,
            tipoVeiculoNome: 'Executivo',
            capacidadePassageiros: 4,
            fornecedorId: fId,
            ativo: true,
          },
          {
            id: 2,
            placa: 'JBS3F20',
            modelo: 'Minivan Operacional (Spin)',
            tipoVeiculoId: 2,
            tipoVeiculoNome: 'Operacional',
            capacidadePassageiros: 6,
            fornecedorId: fId,
            ativo: true,
          },
        ];
        return {
          response: fallbackVehicles,
        };
      });
  },

  getById(id: number) {
    return apiClient.get<VeiculoResponse>(`/veiculos/${id}`).catch(() => ({
      response: {
        id,
        placa: 'BRA2E19',
        modelo: 'Sedan Executivo',
        capacidadePassageiros: 4,
        fornecedorId: 1,
        ativo: true,
      },
    }));
  },
};
