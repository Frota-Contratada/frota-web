import { apiClient, type ApiQueryParams } from '../api/apiClient';

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

export interface CorridaDto {
  id: number;
  status: string;
  dataInicio: string;
  dataFim?: string;
  motoristaId: number;
  motoristaNome?: string;
  placaVeiculo: string;
  kmPercorrido: number;
  valorFinal: number;
  emAndamento: boolean;
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



export const ridesApi = {
  getMotivos(tipo?: 'solicitacao' | 'cancelamento' | 'recusa') {
    return apiClient.get<{ response: MotivoSolicitacaoDto[] }>('/solicitacoes/motivos', {
      query: tipo ? { tipo } : undefined,
    });
  },

  getMotivosCancelamento() {
    return apiClient.get<{ response: MotivoSolicitacaoDto[] }>('/solicitacoes/motivos', {
      query: { tipo: 'cancelamento' },
    });
  },

  getTiposCorrida() {
    return apiClient.get<{ response: TipoCorridaDto[] }>('/solicitacoes/tipos-corrida');
  },

  getTiposVeiculo() {
    return apiClient.get<{ response: TipoVeiculoDto[] }>('/solicitacoes/tipos-veiculo');
  },

  getViagens(query?: { dataInicio?: string; dataFim?: string }) {
    return apiClient.get<{ response: SolicitacaoDto[] }>('/solicitacoes/viagens', {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
  },

  simular(data: SimularSolicitacaoParams) {
    return apiClient.post<{ response: SimulacaoSolicitacaoDto }>('/solicitacoes/simulacao', data);
  },

  create(data: CriarSolicitacaoParams) {
    return apiClient.post<{ response: SolicitacaoDto }>('/solicitacoes', data);
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

  /**
   * @deprecated Endpoint ainda não suportado no backend (pendente implementação de endpoint de decisão pelo aprovador)
   */
  aprovar(_id: number): Promise<{ response: SolicitacaoDto }> {
    return Promise.reject(new Error('Funcionalidade de aprovação de solicitação ainda não implementada no backend.'));
  },

  /**
   * @deprecated Endpoint ainda não suportado no backend (pendente implementação de endpoint de decisão pelo aprovador)
   */
  rejeitar(_id: number, _motivo?: string): Promise<{ response: SolicitacaoDto }> {
    return Promise.reject(new Error('Funcionalidade de reprovação de solicitação ainda não implementada no backend.'));
  },

  approveRequest(requestId: number) {
    return this.aprovar(requestId);
  },

  rejectRequest(requestId: number, motivo?: string) {
    return this.rejeitar(requestId, motivo);
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


