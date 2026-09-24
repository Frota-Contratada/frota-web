import { apiClient, type ApiQueryParams } from '../api/apiClient';
import { normalizeUf } from '../../utils/brazilianStates';
import { useAuthStore } from '../../stores/authStore';
import { routingService } from '../maps/routingService';

export interface EnderecoSolicitacaoDto {
  logradouro: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  numero?: string;
  bairro?: string;
  cep?: string;
  complemento?: string;
}

export interface MotivoSolicitacaoDto {
  id: number;
  nome: string;
  descricao?: string;
}

export interface TipoCorridaDto {
  id: number;
  nome: string;
  descricao?: string;
}

export interface TipoVeiculoDto {
  id: number;
  nome: string;
  descricao?: string;
}

export interface SimularSolicitacaoParams {
  dataCorrida: string;
  tipoCorridaId: number;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  paradas?: EnderecoSolicitacaoDto[];
}

export interface SimulacaoSolicitacaoDto {
  distanciaKm: number;
  duracaoMinutos: number;
  valorEstimado: number;
}

export interface CriarSolicitacaoParams {
  dataCorrida: string;
  tipoCorridaId: number;
  tipoVeiculoId?: number;
  motivoSolicitacaoId: number;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  paradas?: EnderecoSolicitacaoDto[];
  centrosCustoIds: number[];
  cpfsAcompanhantes?: string[];
}

export interface SolicitacaoCentroCustoDto {
  filialId: number;
  centroCustoId: number;
  centroCustoNome?: string;
  aprovadorId: number;
  aprovadorNome?: string;
  statusAprovacao: string;
}

export interface PassageiroDto {
  cpf: string;
  nome?: string;
  solicitante: boolean;
}

export interface CorridaPessoaDto {
  id: number;
  nome: string;
}

export interface CorridaVeiculoDto {
  id: number;
  placa: string;
}

export interface CorridaDto {
  id: number;
  solicitacaoId?: number;
  status: string;
  dataAgendada?: string;
  inicio?: string;
  fim?: string;
  quilometragem?: number;
  dataInicio?: string;
  dataFim?: string;
  motoristaId?: number;
  motoristaNome?: string;
  placaVeiculo?: string;
  kmPercorrido?: number;
  valorFinal?: number;
  emAndamento?: boolean;
  solicitante?: CorridaPessoaDto;
  motorista?: CorridaPessoaDto;
  fornecedor?: CorridaPessoaDto;
  veiculo?: CorridaVeiculoDto;
}

export interface SolicitacaoDto {
  id: number;
  status: string;
  dataCriacao?: string;
  dataCorrida: string;
  dataChegadaEstimada?: string;
  duracaoEstimadaMinutos?: number;
  distanciaEstimadaKm?: number;
  distanciaKm?: number;
  valorEstimado: number;
  tipoCorrida: TipoCorridaDto;
  tipoVeiculo?: TipoVeiculoDto;
  solicitanteId?: number;
  solicitanteNome?: string;
  fornecedorId?: number;
  fornecedorNome?: string;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  paradas?: EnderecoSolicitacaoDto[];
  motivoSolicitacao?: MotivoSolicitacaoDto;
  motivo?: MotivoSolicitacaoDto;
  centrosCusto?: SolicitacaoCentroCustoDto[];
  CentrosCusto?: SolicitacaoCentroCustoDto[];
  passageiros?: PassageiroDto[];
  Passageiros?: PassageiroDto[];
  corrida?: CorridaDto;
  Corrida?: CorridaDto[];
  emAndamento?: boolean;
  cancelavel?: boolean;
  createdAt?: string;
}

export interface CancelarSolicitacaoParams {
  motivoCancelamentoId: number;
}



export const FALLBACK_MOTIVOS: Record<string, MotivoSolicitacaoDto[]> = {
  cancelamento: [
    { id: 11, nome: 'Mudança de agenda' },
    { id: 12, nome: 'Não preciso mais da corrida' },
    { id: 13, nome: 'Erro ao preencher a solicitação' },
    { id: 1, nome: 'Desistência do solicitante' },
  ],
  recusa: [
    { id: 14, nome: 'Fora da política de viagens' },
    { id: 15, nome: 'Centro de custo incorreto' },
    { id: 16, nome: 'Sem verba disponível' },
  ],
  solicitacao: [
    { id: 1, nome: 'Viagem de trabalho' },
    { id: 2, nome: 'Reunião externa' },
    { id: 3, nome: 'Visita a cliente' },
    { id: 4, nome: 'Emergência' },
  ],
};

function sanitizeEndereco(endereco: EnderecoSolicitacaoDto): EnderecoSolicitacaoDto {
  const sanitized: EnderecoSolicitacaoDto = {
    logradouro: (endereco.logradouro || 'Endereço').trim().slice(0, 200),
    cidade: (endereco.cidade || 'São Paulo').trim().slice(0, 100),
    uf: normalizeUf(endereco.uf),
    latitude: typeof endereco.latitude === 'number' ? endereco.latitude : Number(endereco.latitude) || 0,
    longitude: typeof endereco.longitude === 'number' ? endereco.longitude : Number(endereco.longitude) || 0,
  };
  if (endereco.numero && endereco.numero.trim()) {
    sanitized.numero = endereco.numero.trim().slice(0, 20);
  }
  if (endereco.bairro && endereco.bairro.trim()) {
    sanitized.bairro = endereco.bairro.trim().slice(0, 100);
  }
  if (endereco.cep && endereco.cep.trim()) {
    sanitized.cep = endereco.cep.trim().slice(0, 10);
  }
  if (endereco.complemento && endereco.complemento.trim()) {
    sanitized.complemento = endereco.complemento.trim().slice(0, 100);
  }
  return sanitized;
}

export const ridesApi = {
  async getMotivos(tipo?: 'solicitacao' | 'cancelamento' | 'recusa'): Promise<{ response: MotivoSolicitacaoDto[] }> {
    const user = useAuthStore.getState().user;
    const isAdminMaster = user?.profile === 'admin-master' || user?.perfis?.some((p) => p.tipoPerfil === 'admin-master');

    if (isAdminMaster) {
      try {
        const adminRes = await apiClient.get<{ response: { data: MotivoSolicitacaoDto[] } | MotivoSolicitacaoDto[] }>('/motivo/admin', {
          query: tipo ? { tipo } : undefined,
        });
        const list = Array.isArray(adminRes?.response)
          ? adminRes.response
          : (adminRes?.response as any)?.data || [];
        if (list.length > 0) {
          return { response: list };
        }
      } catch {
        // Fall back below
      }
      return { response: FALLBACK_MOTIVOS[tipo || 'cancelamento'] || FALLBACK_MOTIVOS.cancelamento };
    }

    try {
      return await apiClient.get<{ response: MotivoSolicitacaoDto[] }>('/solicitacoes/motivos', {
        query: tipo ? { tipo } : undefined,
      });
    } catch {
      return { response: FALLBACK_MOTIVOS[tipo || 'cancelamento'] || FALLBACK_MOTIVOS.cancelamento };
    }
  },

  getMotivosCancelamento() {
    return this.getMotivos('cancelamento');
  },

  getMotivosRecusa() {
    return this.getMotivos('recusa');
  },

  getTiposCorrida() {
    return apiClient.get<{ response: TipoCorridaDto[] }>('/solicitacoes/tipos-corrida');
  },

  getTiposVeiculo() {
    return apiClient.get<{ response: TipoVeiculoDto[] }>('/solicitacoes/tipos-veiculo');
  },

  getViagens(query?: { inicio?: string; fim?: string; dataInicio?: string; dataFim?: string }) {
    const mappedQuery: Record<string, string | number | boolean | null | undefined> = {};
    const inicio = query?.inicio || query?.dataInicio;
    const fim = query?.fim || query?.dataFim;
    if (inicio) mappedQuery.inicio = inicio;
    if (fim) mappedQuery.fim = fim;
    return apiClient.get<{ response: SolicitacaoDto[] }>('/solicitacoes/viagens', {
      query: mappedQuery,
    });
  },

  async simular(data: SimularSolicitacaoParams): Promise<{ response: SimulacaoSolicitacaoDto }> {
    const user = useAuthStore.getState().user;
    const isSolicitante =
      user?.profile === 'solicitante' ||
      user?.profile === 'solicitante-emergencia' ||
      user?.perfis?.some((p) => p.tipoPerfil === 'solicitante' || p.tipoPerfil === 'solicitante-emergencia');

    const sanitizedData: SimularSolicitacaoParams = {
      ...data,
      dataCorrida: data.dataCorrida ? new Date(data.dataCorrida).toISOString() : new Date().toISOString(),
      origem: sanitizeEndereco(data.origem),
      destino: sanitizeEndereco(data.destino),
      paradas: data.paradas ? data.paradas.map(sanitizeEndereco) : [],
    };

    const computeLocalSimulation = () => {
      const routing = routingService.calcularDistanciaFallback([
        { lat: sanitizedData.origem.latitude, lng: sanitizedData.origem.longitude },
        ...(sanitizedData.paradas || []).map((p) => ({ lat: p.latitude, lng: p.longitude })),
        { lat: sanitizedData.destino.latitude, lng: sanitizedData.destino.longitude },
      ]);
      const valorEstimado = Math.round((8.5 + routing.distanceKm * 3.2) * 100) / 100;
      return {
        response: {
          distanciaKm: routing.distanceKm,
          duracaoMinutos: routing.durationMinutes,
          valorEstimado,
        },
      };
    };

    if (!isSolicitante) {
      return computeLocalSimulation();
    }

    try {
      return await apiClient.post<{ response: SimulacaoSolicitacaoDto }>('/solicitacoes/simulacao', sanitizedData);
    } catch {
      return computeLocalSimulation();
    }
  },

  create(data: CriarSolicitacaoParams) {
    const payload: CriarSolicitacaoParams = {
      ...data,
      dataCorrida: data.dataCorrida ? new Date(data.dataCorrida).toISOString() : new Date().toISOString(),
      origem: sanitizeEndereco(data.origem),
      destino: sanitizeEndereco(data.destino),
      paradas: data.paradas ? data.paradas.map(sanitizeEndereco) : [],
    };
    return apiClient.post<{ response: SolicitacaoDto }>('/solicitacoes', payload);
  },

  list(query?: ApiQueryParams) {
    return apiClient.get<{ response: SolicitacaoDto[] | { data: SolicitacaoDto[] } }>('/solicitacoes', { query });
  },

  listAprovadorPendentes(query?: ApiQueryParams) {
    return apiClient.get<{ response: SolicitacaoDto[] | { data: SolicitacaoDto[] } }>('/solicitacoes/aprovador/pendentes', { query });
  },

  getById(id: number) {
    return apiClient.get<{ response: SolicitacaoDto }>(`/solicitacoes/${id}`);
  },

  getMinhasCorridas(query?: { status?: string; dataInicio?: string; dataFim?: string }) {
    return apiClient.get<{ response: CorridaDto[] }>('/corridas/minhas', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  getCorridaById(id: number) {
    return apiClient.get<{ response: CorridaDto }>(`/corridas/${id}`);
  },

  aprovar(id: number, fornecedorId?: number): Promise<{ response: SolicitacaoDto }> {
    return apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/aprovacao`, {
      decisao: 'APROVAR',
      fornecedorId,
    });
  },

  rejeitar(id: number, motivoRecusaId?: number): Promise<{ response: SolicitacaoDto }> {
    return apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/aprovacao`, {
      decisao: 'RECUSAR',
      motivoRecusaId: motivoRecusaId || 1,
    });
  },

  approveRequest(requestId: number, fornecedorId?: number) {
    return this.aprovar(requestId, fornecedorId);
  },

  rejectRequest(requestId: number, motivoRecusaId?: number) {
    return this.rejeitar(requestId, motivoRecusaId);
  },

  cancelar(id: number, data?: CancelarSolicitacaoParams | number) {
    const body = typeof data === 'number' ? { motivoCancelamentoId: data } : (data ?? { motivoCancelamentoId: 1 });
    return apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/cancelamento`, body);
  },

  listRequests(query?: ApiQueryParams) {
    return this.list(query);
  },

  getRequest(requestId: number) {
    return apiClient.get<{ response: SolicitacaoDto }>(`/solicitacoes/${requestId}`);
  },

  createRequest(payload: CriarSolicitacaoParams) {
    return apiClient.post<{ response: SolicitacaoDto }>('/solicitacoes', payload);
  },

  cancelRequest(requestId: number, motivoId = 1) {
    return this.cancelar(requestId, motivoId);
  },

  alocarMotoristaEVeiculo(id: number, params: { motoristaId: number; veiculoId: number }) {
    return apiClient.post<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/decisao-fornecedor`, {
      decisao: 'REATRIBUIR',
      motoristaId: params.motoristaId,
      veiculoId: params.veiculoId,
    });
  },
};


