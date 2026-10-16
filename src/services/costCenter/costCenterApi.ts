import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';
import { resolveEmpresaId } from '../branch/branchApi';

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
  empresaId?: number;
  ativo?: boolean;
  nome?: string;
  page?: number;
  limit?: number;
}

async function listAdmin(query?: CentroCustoQueryParams) {
  let empresaId = query?.empresaId;
  if (query?.filialId && !empresaId) {
    try {
      empresaId = await resolveEmpresaId(query.filialId);
    } catch {
    }
  }

  const queryParams = {
    limit: query?.limit ?? 100,
    page: query?.page ?? 1,
    ...query,
    ...(empresaId ? { empresaId } : {}),
  };

  const firstRes = await apiClient.get<CentrosCustoListResponse>('/centro-de-custo/admin', {
    query: queryParams as Record<string, string | number | boolean | null | undefined>,
  });

  if (query?.page || !firstRes?.response || Array.isArray(firstRes.response)) {
    return firstRes;
  }

  const paginated = firstRes.response as PaginatedCentrosCusto;
  if (!paginated.hasNextPage) {
    return firstRes;
  }

  const allData: CentroCustoDto[] = [...(paginated.data || [])];
  let currentPage = (queryParams.page || 1) + 1;
  const maxPages = 10;

  while (currentPage <= maxPages) {
    try {
      const nextRes = await apiClient.get<CentrosCustoListResponse>('/centro-de-custo/admin', {
        query: {
          ...queryParams,
          page: currentPage,
        } as Record<string, string | number | boolean | null | undefined>,
      });

      if (!nextRes?.response || Array.isArray(nextRes.response)) break;
      const nextPaginated = nextRes.response as PaginatedCentrosCusto;
      if (Array.isArray(nextPaginated.data)) {
        allData.push(...nextPaginated.data);
      }
      if (!nextPaginated.hasNextPage) break;
      currentPage += 1;
    } catch {
      break;
    }
  }

  return {
    response: {
      totalCount: allData.length,
      hasNextPage: false,
      data: allData,
    },
  };
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
