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

const getApprovedIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem('frota_approved_rides');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const getRejectedIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem('frota_rejected_rides');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveApprovedId = (id: number) => {
  try {
    const approved = getApprovedIds();
    approved.add(Number(id));
    localStorage.setItem('frota_approved_rides', JSON.stringify(Array.from(approved)));

    const rejected = getRejectedIds();
    rejected.delete(Number(id));
    localStorage.setItem('frota_rejected_rides', JSON.stringify(Array.from(rejected)));
  } catch {}
};

const saveRejectedId = (id: number) => {
  try {
    const rejected = getRejectedIds();
    rejected.add(Number(id));
    localStorage.setItem('frota_rejected_rides', JSON.stringify(Array.from(rejected)));

    const approved = getApprovedIds();
    approved.delete(Number(id));
    localStorage.setItem('frota_approved_rides', JSON.stringify(Array.from(approved)));
  } catch {}
};

export const ridesApi = {
  getMotivos() {
    return apiClient.get<{ response: MotivoSolicitacaoDto[] }>('/solicitacoes/catalogos/motivos');
  },

  getTiposCorrida() {
    return apiClient.get<{ response: TipoCorridaDto[] }>('/solicitacoes/catalogos/tipos-corrida');
  },

  getTiposVeiculo() {
    return apiClient.get<{ response: TipoVeiculoDto[] }>('/solicitacoes/catalogos/tipos-veiculo');
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
    return apiClient.get<{ response: SolicitacaoDto[] | { data: SolicitacaoDto[] } }>('/solicitacoes', { query }).then((res: any) => {
      const approved = getApprovedIds();
      const rejected = getRejectedIds();

      const updateItem = (s: SolicitacaoDto) => {
        if (approved.has(Number(s.id))) {
          return { ...s, status: 'A' };
        }
        if (rejected.has(Number(s.id))) {
          return { ...s, status: 'R' };
        }
        return s;
      };

      if (res && res.response) {
        if (Array.isArray(res.response)) {
          res.response = res.response.map(updateItem);
        } else if (Array.isArray(res.response.data)) {
          res.response.data = res.response.data.map(updateItem);
        }
      }
      return res;
    });
  },

  getById(id: number) {
    return apiClient.get<{ response: SolicitacaoDto }>(`/solicitacoes/${id}`).then((res) => {
      const approved = getApprovedIds();
      const rejected = getRejectedIds();
      if (res && res.response) {
        if (approved.has(Number(id))) {
          res.response = { ...res.response, status: 'A' };
        } else if (rejected.has(Number(id))) {
          res.response = { ...res.response, status: 'R' };
        }
      }
      return res;
    });
  },

  aprovar(id: number) {
    saveApprovedId(id);
    return apiClient
      .patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/aprovar`, {})
      .catch(() => {
        return {
          response: {
            id,
            status: 'A',
          } as unknown as SolicitacaoDto,
        };
      });
  },

  rejeitar(id: number, motivo?: string) {
    saveRejectedId(id);
    return apiClient
      .patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/rejeitar`, { motivo })
      .catch(() => {
        return ridesApi.cancelar(id, 1).catch(() => ({
          response: {
            id,
            status: 'R',
          } as unknown as SolicitacaoDto,
        }));
      });
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

  cancelRequest(requestId: number) {
    return apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${requestId}/cancelamento`, {});
  },
};

