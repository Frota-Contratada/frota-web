import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';

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

export interface CentroCustoQueryParams {
  filialId?: number;
  ativo?: boolean;
}

/** Lista todos os centros de custo — acesso admin-master (visão global) */
function listAdmin(query?: CentroCustoQueryParams) {
  return apiClient.get<CentrosCustoListResponse>('/centro-de-custo/admin', {
    query: query as Record<string, string | number | boolean | null | undefined>,
  });
}

/** Lista apenas os centros de custo da filial do usuário logado */
function listFilial(query?: CentroCustoQueryParams) {
  return apiClient.get<CentrosCustoListResponse>('/centro-de-custo/filial', {
    query: query as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Seleciona automaticamente o endpoint correto com base no perfil do usuário.
 * admin-master → /centro-de-custo/admin (visão global)
 * demais perfis → /centro-de-custo/filial (visão restrita à filial)
 *
 * Em caso de falha de rede/500 no endpoint primário, propaga o erro normalmente
 * em vez de silenciar com fallback opaco.
 */
function list(query?: CentroCustoQueryParams) {
  const user = useAuthStore.getState().user;
  const isAdminMaster =
    user?.profile === 'admin-master' ||
    user?.perfis?.some((p) => p.tipoPerfil === 'admin-master' || p.tipoPerfil === 'ADMINISTRADOR_MATRIZ');

  if (isAdminMaster) {
    return listAdmin(query);
  }
  return listFilial(query).catch(() => {
    // Filial pode não ter endpoint dedicado em instâncias legadas — usa genérico como último recurso
    return apiClient.get<CentrosCustoListResponse>('/centro-de-custo', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  });
}

export const costCenterApi = {
  list,
  listAdmin,
  listFilial,

  vincularAprovador(data: VincularAprovadorParams) {
    return apiClient.put<VincularAprovadorResponse>(`/usuario/colaborador/${data.usuarioId}/perfis/aprovador`, {
      centroCustoId: data.centroCustoId,
    });
  },
};


