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

export const DEFAULT_CENTROS_CUSTO: CentroCustoDto[] = [
  { filialId: 1, numero: 101, nome: 'Operações', temAprovador: true, ativo: true },
  { filialId: 1, numero: 102, nome: 'Administrativo', temAprovador: true, ativo: true },
  { filialId: 1, numero: 103, nome: 'Logística', temAprovador: true, ativo: true },
  { filialId: 1, numero: 104, nome: 'Comercial', temAprovador: true, ativo: true },
  { filialId: 1, numero: 105, nome: 'Recursos Humanos', temAprovador: true, ativo: true },
  { filialId: 2, numero: 201, nome: 'Operações Maringá', temAprovador: true, ativo: true },
  { filialId: 2, numero: 202, nome: 'Administrativo Maringá', temAprovador: true, ativo: true },
  { filialId: 3, numero: 301, nome: 'Diretoria Executiva', temAprovador: true, ativo: true },
  { filialId: 3, numero: 302, nome: 'Tecnologia & Inovação', temAprovador: true, ativo: true },
];

export const costCenterApi = {
  list() {
    return apiClient
      .get<CentrosCustoListResponse>('/centro-de-custo')
      .catch(() => ({ response: DEFAULT_CENTROS_CUSTO }));
  },

  vincularAprovador(data: VincularAprovadorParams) {
    return apiClient.post<VincularAprovadorResponse>('/centro-de-custo/aprovadores', data);
  },
};


