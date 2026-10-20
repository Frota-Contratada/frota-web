import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';
import { resolveEmpresaId } from '../../utils/apiHelpers';

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
  empresaId?: number;
  filialId?: number;
  ativo?: boolean;
  nome?: string;
  page?: number;
  limit?: number;
}

function normalizeCostCenterItem(item: Record<string, unknown>): CentroCustoDto {
  const numero = Number(item.numero ?? item.id ?? 0);
  return {
    ...(item as unknown as CentroCustoDto),
    id: Number(item.id ?? numero),
    numero,
    filialId: Number(item.filialId ?? 1),
    nome: String(item.nome ?? `Centro #${numero}`),
    ativo: item.ativo !== undefined ? Boolean(item.ativo) : item.dataDesativacao == null,
    temAprovador: item.temAprovador !== undefined ? Boolean(item.temAprovador) : undefined,
  };
}

function normalizeCostCenterResponse(res: CentrosCustoListResponse): CentrosCustoListResponse {
  if (!res || !res.response) return res;
  if (Array.isArray(res.response)) {
    return {
      response: res.response.map((item) => normalizeCostCenterItem(item as unknown as Record<string, unknown>)),
    };
  }
  if (typeof res.response === 'object' && Array.isArray((res.response as PaginatedCentrosCusto).data)) {
    const paginated = res.response as PaginatedCentrosCusto;
    return {
      response: {
        ...paginated,
        data: paginated.data.map((item) => normalizeCostCenterItem(item as unknown as Record<string, unknown>)),
      },
    };
  }
  return res;
}

async function listAdmin(query?: CentroCustoQueryParams) {
  const finalQuery: Record<string, string | number | boolean | null | undefined> = {
    limit: 100,
    ...query,
  };
  if (finalQuery.filialId && !finalQuery.empresaId) {
    finalQuery.empresaId = resolveEmpresaId();
  }
  const res = await apiClient.get<CentrosCustoListResponse>('/centro-de-custo/admin', {
    query: finalQuery,
  });
  return normalizeCostCenterResponse(res);
}

async function listFilial(query?: CentroCustoQueryParams) {
  const finalQuery = query
    ? {
        limit: 100,
        ...query,
      }
    : undefined;
  const res = await apiClient.get<CentrosCustoListResponse>('/centro-de-custo/filial', {
    query: finalQuery,
  });
  return normalizeCostCenterResponse(res);
}

async function list(query?: CentroCustoQueryParams | number) {
  const normalizedQuery: CentroCustoQueryParams | undefined =
    typeof query === 'number' ? { filialId: query } : query;

  const user = useAuthStore.getState().user;
  const profiles = getUserNormalizedProfiles(user);

  if (profiles.includes('admin-master')) {
    try {
      return await listAdmin(normalizedQuery);
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
    return await listFilial(normalizedQuery);
  } catch {
    return listMinhas();
  }
}

async function listMinhas() {
  const res = await apiClient.get<CentrosCustoListResponse>('/centro-de-custo');
  return normalizeCostCenterResponse(res);
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
