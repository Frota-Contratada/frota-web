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

export const costCenterApi = {
  vincularAprovador(data: VincularAprovadorParams) {
    return apiClient.post<VincularAprovadorResponse>('/centro-de-custo/aprovadores', data);
  },
};

