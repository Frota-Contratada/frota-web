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
  filialId: number;
  numero: number;
  nome: string;
  ativo?: boolean;
  temAprovador?: boolean;
  id?: number;
  codigo?: string;
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
    return apiClient.put<VincularAprovadorResponse>(`/usuario/colaborador/${data.usuarioId}/perfis/aprovador`, {
      centroCustoId: data.centroCustoId,
    });
  },
};


