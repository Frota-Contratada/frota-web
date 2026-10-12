import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';

export interface VincularAprovadorParams {
  usuarioId: number;
  filialId?: number;
  centroCustoId: number;
}

export interface AprovadorCentroCustoDto {
  usuarioId?: number;
  filialId?: number;
  centroCustoId?: number;
  id?: number;
  nome?: string;
  email?: string;
  dataVinculo?: string;
  [key: string]: unknown;
}

export interface VincularAprovadorResponse {
  response: AprovadorCentroCustoDto;
}

export interface CentroCustoAdminDto {
  id: number;
  filialId: number;
  nome: string;
  dataAtivacao: string;
  dataDesativacao?: string;
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
  response: PaginatedCentrosCusto | CentroCustoDto[] | CentroCustoAdminDto[];
}

export interface CentroCustoQueryParams {
  filialId?: number;
  ativo?: boolean;
  nome?: string;
  page?: number;
  limit?: number;
}

function listAdmin(query?: CentroCustoQueryParams) {
  return apiClient.get<CentrosCustoListResponse>('/centro-de-custo/admin', {
    query: query as Record<string, string | number | boolean | null | undefined>,
  });
}

function listFilial(query?: CentroCustoQueryParams) {
  return apiClient.get<CentrosCustoListResponse>('/centro-de-custo/filial', {
    query: query as Record<string, string | number | boolean | null | undefined>,
  });
}

function list(query?: CentroCustoQueryParams) {
  const user = useAuthStore.getState().user;
  const isAdminMaster =
    user?.profile === 'admin-master' ||
    user?.perfis?.some((p) => p.tipoPerfil === 'admin-master' || p.tipoPerfil === 'ADMINISTRADOR_MATRIZ');

  if (isAdminMaster) {
    return listAdmin(query);
  }
  return listFilial(query);
}

function listMinhas() {
  return apiClient.get<CentrosCustoListResponse>('/centro-de-custo');
}

export const costCenterApi = {
  list,
  listAdmin,
  listFilial,
  listMinhas,

  vincularAprovador(data: VincularAprovadorParams) {
    return apiClient.put<VincularAprovadorResponse>(`/usuario/colaborador/${data.usuarioId}/perfis/aprovador`, {
      centroCustoId: data.centroCustoId,
    });
  },
};
