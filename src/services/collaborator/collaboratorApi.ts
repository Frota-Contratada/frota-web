import { apiClient } from '../api/apiClient';
import type { ListagemQueryParams } from '../../utils/apiHelpers';
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

export interface ColaboradoresAdminQueryParams extends ListagemQueryParams {
  nome?: string;
  cpf?: string;
  filialId?: number;
  centroCustoId?: number;
  perfil?: string;
  page?: number;
  limit?: number;
}

export interface ColaboradoresFilialQueryParams extends ListagemQueryParams {
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

export interface BeneficiarioDto {
  id: number;
  nome: string;
}

export interface BeneficiariosListResponse {
  response: {
    totalCount: number;
    hasNextPage: boolean;
    data: BeneficiarioDto[];
  };
}

export type PerfilCadastroColaborador = 'solicitante' | 'aprovador' | 'solicitante-emergencia';

/** Cadastro sem senha: o colaborador define a senha no primeiro acesso, com o código enviado por e-mail. */
export interface CriarColaboradorParams {
  nome: string;
  email: string;
  cpf?: string;
  cargo?: string;
  /** Só o admin master informa; o admin de filial cadastra na própria filial. */
  empresaId?: number;
  filialId?: number;
  centroCustoId: number;
  perfis: PerfilCadastroColaborador[];
}

export const collaboratorApi = {
  create(data: CriarColaboradorParams) {
    return apiClient.post<{ response: ColaboradorDto }>('/usuario/colaborador', data);
  },

  /** Colegas da mesma filial, para solicitar corrida para outra pessoa (solicitante e aprovador). */
  listBeneficiarios(query?: { nome?: string; page?: number; limit?: number }) {
    return apiClient.get<BeneficiariosListResponse>('/usuario/colaborador/beneficiarios', {
      query: { limit: 100, ...query },
    });
  },

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

  async getById(id: number) {
    const res = await this.list({ limit: 100 });
    const items = (Array.isArray((res as any)?.response)
      ? (res as any).response
      : (res as any)?.response?.data || []) as ColaboradorDto[];
    const found = items.find((c) => Number(c.id) === id);
    if (found) {
      return { response: found };
    }
    const paginated = (res as any)?.response;
    if (paginated?.hasNextPage && paginated?.totalCount > 100) {
      const totalPages = Math.ceil(paginated.totalCount / 100);
      for (let p = 2; p <= Math.min(totalPages, 5); p++) {
        const nextRes = await this.list({ page: p, limit: 100 });
        const nextItems = (Array.isArray((nextRes as any)?.response)
          ? (nextRes as any).response
          : (nextRes as any)?.response?.data || []) as ColaboradorDto[];
        const nextFound = nextItems.find((c) => Number(c.id) === id);
        if (nextFound) return { response: nextFound };
      }
    }
    return { response: null };
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
