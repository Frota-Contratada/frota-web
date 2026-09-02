import { apiClient } from '../api/apiClient';

export interface FornecedorDto {
  id: number;
  nome: string;
  cnpjCpf: string;
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
  nome: string;
  cnpjCpf: string;
  filialId: number;
}

export interface BuscarFornecedoresQueryParams {
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

export const supplierApi = {
  create(data: CriarFornecedorParams) {
    return apiClient.post<FornecedorResponse>('/fornecedor', data);
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
    return apiClient.get<FornecedoresListResponse>('/fornecedor/admin', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    }).catch(() => {
      return apiClient.get<FornecedoresListResponse>('/fornecedor/filial', {
        query: query as Record<string, string | number | boolean | null | undefined>,
      });
    });
  },

  getAdminBigNumbers(query?: { filialId?: number }) {
    return apiClient.get<FornecedorBigNumbersResponse>('/fornecedor/admin/big-numbers', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getFilialBigNumbers() {
    return apiClient.get<FornecedorBigNumbersResponse>('/fornecedor/filial/big-numbers');
  },

  getById(id: number) {
    return apiClient.get<FornecedorResponse>(`/fornecedor/${id}`);
  },

  updateFoto(id: number, file: File) {
    const formData = new FormData();
    formData.append('foto', file);
    return apiClient.patch<FornecedorResponse>(`/fornecedor/${id}/foto`, formData);
  },

  inativar(id: number) {
    return apiClient.patch<FornecedorResponse>(`/fornecedor/${id}/inativar`, {});
  },

  reativar(id: number) {
    return apiClient.patch<FornecedorResponse>(`/fornecedor/${id}/reativar`, {});
  },

  toggleStatus(id: number, ativoAtual: boolean) {
    return ativoAtual ? this.inativar(id) : this.reativar(id);
  },
};

