import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';

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

async function list(query?: CentroCustoQueryParams) {
  const user = useAuthStore.getState().user;
  const profiles = getUserNormalizedProfiles(user);

  if (profiles.includes('admin-master')) {
    try {
      return await listAdmin(query);
    } catch {
      return listMinhas();
    }
  }

  const isOrdinaryRequester =
    profiles.length > 0 &&
    (profiles.includes('solicitante') ||
      profiles.includes('solicitante-emergencia') ||
      profiles.includes('aprovador') ||
      profiles.includes('motorista')) &&
    !profiles.includes('admin-filial');

  if (isOrdinaryRequester) {
    return listMinhas();
  }

  try {
    return await listFilial(query);
  } catch {
    return listMinhas();
  }
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
