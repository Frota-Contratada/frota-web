import { apiClient } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';

export interface ContratoVinculoDto {
  filialId: number;
  filialNome: string;
  fornecedorId: number;
  fornecedorNome: string;
}

export interface ContratoDto {
  id: number;
  dataVigenciaInicio: string;
  dataVigenciaFim?: string;
  status?: string;
  vinculos?: ContratoVinculoDto[];
  caminhoArquivo?: string;
  usuarioCadastroId?: number;
  dataAlteracao?: string;
}

export interface CriarContratoParams {
  arquivo: File;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  dataInicioVigencia?: string;
  dataFimVigencia?: string;
}

export interface BuscarContratosAdminQueryParams {
  fornecedorId?: number;
  filialId?: number;
  status?: string;
}

export interface BuscarContratosFilialQueryParams {
  fornecedorId?: number;
  status?: string;
}

export interface ContratoBigNumbers {
  total?: number;
  validos?: number;
  vencemEmBreve?: number;
  vencidos?: number;
}

export interface ContratoBigNumbersResponse {
  response: ContratoBigNumbers;
}

export interface ContratoResponse {
  response: ContratoDto;
}

export interface PaginatedContratos {
  totalCount: number;
  hasNextPage: boolean;
  data: ContratoDto[];
}

export interface ContratosListResponse {
  response: PaginatedContratos | ContratoDto[];
}

export const contractApi = {
  create(data: CriarContratoParams) {
    const formData = new FormData();
    formData.append('arquivo', data.arquivo);
    const formatToDateOnly = (d?: string) => {
      if (!d) return undefined;
      return d.includes('T') ? d.split('T')[0] : d;
    };
    const inicio = formatToDateOnly(data.dataVigenciaInicio || data.dataInicioVigencia) || new Date().toISOString().split('T')[0];
    const fim = formatToDateOnly(data.dataVigenciaFim || data.dataFimVigencia);

    formData.append('dataVigenciaInicio', inicio);
    if (fim) {
      formData.append('dataVigenciaFim', fim);
    }

    return apiClient.post<ContratoResponse>('/contrato', formData);
  },

  listAdmin(query?: BuscarContratosAdminQueryParams) {
    return apiClient.get<ContratosListResponse>('/contrato/admin', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  listFilial(query?: BuscarContratosFilialQueryParams) {
    return apiClient.get<ContratosListResponse>('/contrato/filial', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  list(query?: BuscarContratosAdminQueryParams) {
    const user = useAuthStore.getState().user;
    const isAdmin =
      user?.profile === 'admin-master' ||
      user?.perfis?.some((p) => p.tipoPerfil === 'admin-master');

    if (isAdmin) {
      return this.listAdmin(query);
    }
    return this.listFilial(query);
  },

  getAdminBigNumbers(query?: { filialId?: number }) {
    return apiClient.get<ContratoBigNumbersResponse>('/contrato/admin/big-numbers', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getFilialBigNumbers() {
    return apiClient.get<ContratoBigNumbersResponse>('/contrato/filial/big-numbers');
  },

  getPdfBlob(id: number) {
    return apiClient.getBlob(`/contrato/${id}`);
  },

  substituirRegras(id: number, regras: unknown[]) {
    return apiClient.put<void>(`/contrato/${id}/regras`, { regras });
  },
};


