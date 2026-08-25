import { apiClient } from '../api/apiClient';

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
    const inicio = data.dataVigenciaInicio || data.dataInicioVigencia || new Date().toISOString();
    const fim = data.dataVigenciaFim || data.dataFimVigencia;

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
    return apiClient.get<ContratosListResponse>('/contrato/admin', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    }).catch(() => {
      return apiClient.get<ContratosListResponse>('/contrato/filial', {
        query: query as Record<string, string | number | boolean | null | undefined>,
      });
    });
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
};

