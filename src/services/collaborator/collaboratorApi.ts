import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';

export interface ColaboradorSummaryDto {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  fotoPerfil?: string;
}

export interface ColaboradorDto {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  cargo?: string;
  dataAtivacao?: string;
  filialId?: number;
  filialNome?: string;
  centroCustoId?: number;
  centroCustoNome?: string;
  centroCustoCodigo?: string;
  fotoPerfil?: string;
  perfis?: Array<{
    tipoPerfil: string;
    dataInicioVigencia: string;
    dataFimVigencia?: string;
  }>;
}

export interface ColaboradoresAdminQueryParams {
  nome?: string;
  cpf?: string;
  filialId?: number;
  centroCustoId?: number;
  perfil?: string;
  page?: number;
  limit?: number;
}

export interface ColaboradoresFilialQueryParams {
  nome?: string;
  cpf?: string;
  centroCustoId?: number;
  perfil?: string;
  page?: number;
  limit?: number;
}

export interface ColaboradorBigNumbers {
  administradoresDeFilial?: number;
  aprovadores?: number;
  solicitantesDeEmergencia?: number;
  totalColaboradores?: number;
  totalSolicitantes?: number;
  totalAprovadores?: number;
}

export interface ColaboradorBigNumbersResponse {
  response: ColaboradorBigNumbers;
}

export interface PaginatedColaboradores {
  totalCount: number;
  hasNextPage: boolean;
  data: ColaboradorDto[] | ColaboradorSummaryDto[];
}

export interface ColaboradoresListResponse {
  response: PaginatedColaboradores | ColaboradorDto[] | ColaboradorSummaryDto[];
}

export interface ColaboradorResponse {
  response: ColaboradorDto;
}

export interface PerfisColaboradorResponse {
  response: {
    id?: number;
    filialId?: number;
    centroCustoId?: number;
    perfis: Array<{
      tipoPerfil: string;
      dataInicioVigencia: string;
      dataFimVigencia?: string;
    }>;
  };
}

export interface VincularCentroCustoBody {
  centroCustoId: number;
  filialId?: number;
}

export const collaboratorApi = {
  listAdmin(query?: ColaboradoresAdminQueryParams) {
    return apiClient.get<ColaboradoresListResponse>('/usuario/colaborador/admin', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  listFilial(query?: ColaboradoresFilialQueryParams) {
    return apiClient.get<ColaboradoresListResponse>('/usuario/colaborador/filial', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  list(query?: ColaboradoresAdminQueryParams) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    if (profiles.includes('admin-master')) {
      return this.listAdmin(query);
    }
    if (profiles.includes('admin-filial')) {
      return this.listFilial(query);
    }
    return Promise.resolve({ response: [] });
  },

  getAdminBigNumbers(query?: { filialId?: number; centroCustoId?: number; perfil?: string }) {
    return apiClient.get<ColaboradorBigNumbersResponse>('/usuario/colaborador/admin/big-numbers', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getFilialBigNumbers(query?: { centroCustoId?: number; perfil?: string }) {
    return apiClient.get<ColaboradorBigNumbersResponse>('/usuario/colaborador/filial/big-numbers', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getBigNumbers(query?: { filialId?: number; centroCustoId?: number; perfil?: string }) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    const isFilialOnly = profiles.includes('admin-filial') && !profiles.includes('admin-master');
    return isFilialOnly ? this.getFilialBigNumbers(query) : this.getAdminBigNumbers(query);
  },

  getProfiles(id: number) {
    return apiClient.get<PerfisColaboradorResponse>(`/usuario/colaborador/${id}/perfis`);
  },

  turnSolicitante(id: number, data: VincularCentroCustoBody) {
    return apiClient.put<ColaboradorResponse>(`/usuario/colaborador/${id}/perfis/solicitante`, {
      centroCustoId: data.centroCustoId,
    });
  },

  turnAprovador(id: number, data: VincularCentroCustoBody) {
    return apiClient.put<ColaboradorResponse>(`/usuario/colaborador/${id}/perfis/aprovador`, {
      centroCustoId: data.centroCustoId,
    });
  },

  turnSolicitanteEmergencia(id: number, _data?: VincularCentroCustoBody) {
    return apiClient.put<ColaboradorResponse>(`/usuario/colaborador/${id}/perfis/solicitante-emergencia`, {});
  },
};
