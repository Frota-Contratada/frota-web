import { apiClient } from '../api/apiClient';

export interface VincularAprovadorParams {
  usuarioId: number;
  filialId: number;
  centroCustoId: number;
}

export interface AprovadorCentroCustoDto {
  usuarioId: number;
  filialId: number;
  centroCustoId: number;
  dataVinculo: string;
}

export interface VincularAprovadorResponse {
  response: AprovadorCentroCustoDto;
}

export interface CentroCustoDto {
  id: number;
  nome: string;
  codigo?: string;
  filialId?: number;
}

export interface PaginatedCentrosCusto {
  totalCount: number;
  hasNextPage: boolean;
  data: CentroCustoDto[];
}

export interface CentrosCustoListResponse {
  response: PaginatedCentrosCusto | CentroCustoDto[];
}

export const costCenterApi = {
  list() {
    return apiClient.get<CentrosCustoListResponse>('/centro-de-custo');
  },

  vincularAprovador(data: VincularAprovadorParams) {
    return apiClient.post<VincularAprovadorResponse>('/centro-de-custo/aprovadores', data);
  },
};

