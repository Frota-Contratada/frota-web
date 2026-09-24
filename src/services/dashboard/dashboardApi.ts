import { apiClient, type ApiQueryParams } from '../api/apiClient';

export interface DashboardBigNumber {
  valor: number;
  variacaoPercentual: number | null;
}

export interface DashboardTopFornecedor {
  fornecedor: string | null;
  gasto: number;
  variacaoPercentual: number | null;
}

export interface DashboardGastoMensal {
  mes: string;
  gasto: number;
}

export interface DashboardGastoFornecedor {
  fornecedor: string;
  gasto: number;
}

export interface DashboardCorrida {
  data: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  destino: string;
  status: string;
  distanciaEstimada: number;
  distanciaPercorrida: number;
  preco: number;
}

export interface DashboardExecutivoDto {
  bigNumbers: {
    totalCorridas: DashboardBigNumber;
    corridasConcluidas: DashboardBigNumber;
    corridasEmergenciais: DashboardBigNumber;
    top1FornecedorPorGasto: DashboardTopFornecedor;
  };
  gastoMensal: DashboardGastoMensal[];
  gastoPorFornecedor: {
    total: number;
    fornecedores: DashboardGastoFornecedor[];
  };
  corridas: DashboardCorrida[];
}

export interface DashboardGastosDto {
  bigNumbers: {
    gastoTotal: DashboardBigNumber;
    precoMedio: DashboardBigNumber;
    topCentroCusto: {
      centroCustoId: number | null;
      centroCusto: string | null;
      gasto: number;
      variacaoPercentual: number | null;
    };
    maiorPreco: DashboardBigNumber;
  };
  maioresGastosCentroCusto: Array<{
    centroCustoId: number;
    centroCusto: string;
    valor: number;
  }>;
  centrosCusto: Array<{
    centroCustoId: number;
    centroCusto: string;
    responsavel: string;
    valor: number;
  }>;
  evolucaoGastos: Array<{
    periodo: string;
    fornecedores: Array<{
      fornecedor: string;
      valor: number;
    }>;
  }>;
}

export interface DashboardAuditoriaDto {
  bigNumbers: {
    sobreprecoTotal: { valor: number; variacaoPercentual: number | null };
    corridasDesvioAlto: { quantidade: number; variacaoPercentual: number | null };
    maiorDesvio: { percentual: number; variacaoPercentual: number | null };
    fornecedoresEmRisco: { quantidade: number; variacaoPercentual: number | null };
  };
  conformidadeQuilometragem: Array<{
    fornecedor: string;
    kmEstimado: number;
    kmCobrado: number;
  }>;
  maioresDesviosFornecedores: Array<{
    fornecedor: string;
    desvioPercentual: number;
  }>;
  corridas: Array<{
    data: string;
    solicitanteNome: string;
    solicitanteEmail: string;
    fornecedor: string;
    distanciaEstimada: number;
    distanciaPercorrida: number;
    desvioPercentual: number;
    preco: number;
  }>;
}

export interface DashboardQueryParams extends ApiQueryParams {
  startDate?: string;
  endDate?: string;
  filial?: number;
  centroCusto?: number;
}

export const dashboardApi = {
  async getExecutivo(query?: DashboardQueryParams): Promise<{ response: DashboardExecutivoDto }> {
    try {
      return await apiClient.get<{ response: DashboardExecutivoDto }>('/dashboard/admin', { query });
    } catch {
      try {
        return await apiClient.get<{ response: DashboardExecutivoDto }>('/dashboard/filial', { query });
      } catch {
        return await apiClient.get<{ response: DashboardExecutivoDto }>('/dashboard/aprovador', { query });
      }
    }
  },

  async getGastos(query?: DashboardQueryParams): Promise<{ response: DashboardGastosDto }> {
    try {
      return await apiClient.get<{ response: DashboardGastosDto }>('/dashboard/gastos/admin', { query });
    } catch {
      try {
        return await apiClient.get<{ response: DashboardGastosDto }>('/dashboard/gastos/filial', { query });
      } catch {
        return await apiClient.get<{ response: DashboardGastosDto }>('/dashboard/gastos/aprovador', { query });
      }
    }
  },

  async getAuditoria(query?: DashboardQueryParams): Promise<{ response: DashboardAuditoriaDto }> {
    try {
      return await apiClient.get<{ response: DashboardAuditoriaDto }>('/dashboard/auditoria/admin', { query });
    } catch {
      try {
        return await apiClient.get<{ response: DashboardAuditoriaDto }>('/dashboard/auditoria/filial', { query });
      } catch {
        return await apiClient.get<{ response: DashboardAuditoriaDto }>('/dashboard/auditoria/aprovador', { query });
      }
    }
  },
};
