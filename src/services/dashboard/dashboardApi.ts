import { apiClient, type ApiQueryParams } from '../api/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';
import { resolveEmpresaId } from '../../utils/apiHelpers';

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
  empresa?: number;
  filial?: number;
  centroCusto?: number;
}

function resolveDashboardPerfil(): 'admin' | 'filial' | 'aprovador' {
  const user = useAuthStore.getState().user;
  const profiles = getUserNormalizedProfiles(user);

  if (profiles.includes('admin-master')) return 'admin';
  if (profiles.includes('admin-filial')) return 'filial';
  return 'aprovador';
}

function buildDashboardQuery(query?: DashboardQueryParams): DashboardQueryParams | undefined {
  if (!query) return undefined;
  const normalized: DashboardQueryParams = { ...query };
  if ((normalized.filial || normalized.centroCusto) && !normalized.empresa) {
    normalized.empresa = resolveEmpresaId();
  }
  return normalized;
}

export const dashboardApi = {
  getExecutivo(query?: DashboardQueryParams): Promise<{ response: DashboardExecutivoDto }> {
    const perfil = resolveDashboardPerfil();
    return apiClient.get<{ response: DashboardExecutivoDto }>(`/dashboard/${perfil}`, {
      query: buildDashboardQuery(query),
    });
  },

  getGastos(query?: DashboardQueryParams): Promise<{ response: DashboardGastosDto }> {
    const perfil = resolveDashboardPerfil();
    return apiClient.get<{ response: DashboardGastosDto }>(`/dashboard/gastos/${perfil}`, {
      query: buildDashboardQuery(query),
    });
  },

  getAuditoria(query?: DashboardQueryParams): Promise<{ response: DashboardAuditoriaDto }> {
    const perfil = resolveDashboardPerfil();
    return apiClient.get<{ response: DashboardAuditoriaDto }>(`/dashboard/auditoria/${perfil}`, {
      query: buildDashboardQuery(query),
    });
  },
};
