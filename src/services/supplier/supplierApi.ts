import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';
import { resolveEmpresaId, type ListagemQueryParams } from '../../utils/apiHelpers';

export interface FornecedorDto {
  id: number;
  nome: string;
  cnpjCpf: string | null;
  foto?: string;
  dataAtivacao?: string;
  ativo?: boolean;
  quantidadeVeiculosAtivos?: number;
  contratosVigentes?: Array<{
    contratoId: number;
    filialId: number;
    filialNome: string;
    dataVigenciaInicio: string;
    dataVigenciaFim?: string;
  }>;
  totalContratos?: number;
  totalMotoristas?: number;
  status?: string;
}

export interface CriarFornecedorParams {
  empresaId?: number;
  nome: string;
  cnpjCpf: string;
  filialId: number;
}

export interface BuscarFornecedoresQueryParams extends ListagemQueryParams {
  nome?: string;
  cnpjCpf?: string;
  filialId?: number;
}

export interface FornecedorBigNumbers {
  fornecedoresAtivos?: number;
  fornecedoresComContratoVigente?: number;
  fornecedoresSemContratoVigente?: number;
  veiculosAtivos?: number;
  totalFornecedores?: number;
  totalContratosAtivos?: number;
  totalMotoristas?: number;
}

export interface FornecedorResponse {
  response: FornecedorDto;
}

export interface PaginatedFornecedores {
  totalCount: number;
  hasNextPage: boolean;
  data: FornecedorDto[];
}

export interface FornecedoresListResponse {
  response: PaginatedFornecedores | FornecedorDto[];
}

export interface FornecedorBigNumbersResponse {
  response: FornecedorBigNumbers;
}

export interface AtualizarFornecedorParams {
  nome: string;
  cnpjCpf: string;
}

export const supplierApi = {
  create(data: CriarFornecedorParams) {
    const empresaId = resolveEmpresaId(data.empresaId);
    return apiClient.post<FornecedorResponse>('/fornecedor', {
      ...data,
      empresaId,
    });
  },

  listAdmin(query?: BuscarFornecedoresQueryParams) {
    return apiClient.get<FornecedoresListResponse>('/fornecedor/admin', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  listFilial(query?: BuscarFornecedoresQueryParams) {
    return apiClient.get<FornecedoresListResponse>('/fornecedor/filial', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  list(query?: BuscarFornecedoresQueryParams) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    if (profiles.includes('admin-master')) {
      return this.listAdmin(query);
    }
    if (profiles.includes('admin-filial')) {
      return this.listFilial(query);
    }
    return this.listFilial(query).catch(() => ({ response: [] }));
  },

  getAdminBigNumbers(query?: { filialId?: number }) {
    return apiClient.get<FornecedorBigNumbersResponse>('/fornecedor/admin/big-numbers', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getFilialBigNumbers() {
    return apiClient.get<FornecedorBigNumbersResponse>('/fornecedor/filial/big-numbers');
  },

  getBigNumbers(query?: { filialId?: number }) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    if (profiles.includes('admin-filial') && !profiles.includes('admin-master')) {
      return this.getFilialBigNumbers();
    }
    return this.getAdminBigNumbers(query);
  },

  getById(id: number) {
    return apiClient.get<FornecedorResponse>(`/fornecedor/${id}`);
  },

  updateFoto(id: number, file: File) {
    const formData = new FormData();
    formData.append('foto', file);
    return apiClient.patch<FornecedorResponse>(`/fornecedor/${id}/foto`, formData);
  },

  update(id: number, data: AtualizarFornecedorParams) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    if (profiles.includes('admin-master')) {
      return apiClient.patch<FornecedorResponse>(`/fornecedor/admin/${id}`, data);
    }
    if (profiles.includes('admin-fornecedor')) {
      return apiClient.patch<FornecedorResponse>('/fornecedor/me', data);
    }
    return apiClient.patch<FornecedorResponse>(`/fornecedor/filial/${id}`, data);
  },
};

