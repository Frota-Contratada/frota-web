import { apiClient } from '../api/apiClient';

export interface ContratoDto {
  id: number;
  fornecedorId?: number;
  fornecedorNome?: string;
  filialId?: number;
  filialNome?: string;
  tipoContrato?: string;
  status: string;
  valorMensal?: number;
  dataInicioVigencia?: string;
  dataFimVigencia?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  arquivoUrl?: string;
  nomeArquivo?: string;
  descricao?: string;
  vinculos?: Array<{
    filialId: number;
    filialNome: string;
    fornecedorId: number;
    fornecedorNome: string;
  }>;
}

export interface CriarContratoParams {
  arquivo: File;
  fornecedorId: number;
  filialId?: number;
  tipoContrato: string;
  valorMensal: number;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  descricao?: string;
}

export interface BuscarContratosAdminQueryParams {
  fornecedorId?: number;
  filialId?: number;
  tipoContrato?: string;
  status?: string;
}

export interface BuscarContratosFilialQueryParams {
  fornecedorId?: number;
  tipoContrato?: string;
  status?: string;
}

export interface ContratoBigNumbers {
  total?: number;
  validos?: number;
  vencemEmBreve?: number;
  vencidos?: number;
  totalContratos?: number;
  totalAtivos?: number;
  totalVencendoEmBreve?: number;
  valorTotalMensal?: number;
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
    formData.append('fornecedorId', String(data.fornecedorId));
    if (data.filialId) formData.append('filialId', String(data.filialId));
    formData.append('tipoContrato', data.tipoContrato);
    formData.append('valorMensal', String(data.valorMensal));
    formData.append('dataInicioVigencia', data.dataInicioVigencia);
    if (data.dataFimVigencia) formData.append('dataFimVigencia', data.dataFimVigencia);
    if (data.descricao) formData.append('descricao', data.descricao);

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

  getById(id: number) {
    return apiClient.get<ContratoResponse>(`/contrato/${id}`);
  },
};
