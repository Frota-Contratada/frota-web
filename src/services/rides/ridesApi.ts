import { apiClient, type ApiQueryParams } from '../api/apiClient';
import { normalizeUf } from '../../utils/brazilianStates';
import { useAuthStore } from '../../stores/authStore';
import { getUserNormalizedProfiles } from '../../types/profile.types';
import { routingService } from '../maps/routingService';
import type { PaginatedResponse } from '../../utils/apiHelpers';

export type StatusSolicitacao = 'P' | 'A' | 'R' | 'C' | string;
export type StatusCorrida = 'I' | 'F' | 'C' | 'A' | string;
export type RespostaPergunta = 'SIM' | 'NAO';

export interface EnderecoSolicitacaoDto {
  logradouro: string;
  cidade: string;
  uf: string;
  latitude: number;
  id?: number;
  longitude: number;
  descricao?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  complemento?: string;
}

export interface CatalogoItemDto {
  id: number;
  nome: string;
  descricao?: string;
}

export type MotivoSolicitacaoDto = CatalogoItemDto;

export interface FornecedorCandidatoDto {
  fornecedorId: number;
  fornecedorNome: string;
  contratoId: number;
  valorEstimado: number;
  /** Fornecedor já gravado na solicitação (o de menor valor na criação). */
  selecionado: boolean;
}
export type TipoCorridaDto = CatalogoItemDto;
export type TipoVeiculoDto = CatalogoItemDto;

export interface RespostaPerguntaRequest {
  contratoId: number;
  perguntaId: number;
  resposta: RespostaPergunta;
}

export interface SimularSolicitacaoParams {
  dataCorrida: string;
  tipoCorridaId: number;
  tipoVeiculoId?: number;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  paradas?: EnderecoSolicitacaoDto[];
  cpfsAcompanhantes?: string[];
  respostasPerguntas?: RespostaPerguntaRequest[];
}

export interface SimulacaoSolicitacaoDto {
  distanciaEstimadaKm: number;
  duracaoEstimadaMinutos: number;
  dataChegadaEstimada?: string;
  valorEstimado: number;
  fornecedorId?: number;
  fornecedorNome?: string;
  distanciaKm?: number;
  duracaoMinutos?: number;
}

export interface CriarSolicitacaoParams {
  dataCorrida: string;
  tipoCorridaId: number;
  tipoVeiculoId?: number;
  fornecedorId?: number;
  motivoSolicitacaoId: number;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  paradas?: EnderecoSolicitacaoDto[];
  centrosCustoIds: number[];
  /** Colaborador da mesma filial que vai usar a corrida; o CPF vem do cadastro dele. */
  beneficiarioId?: number;
  passageiros?: { nome: string; cpf?: string; solicitante?: boolean }[];
  cpfsAcompanhantes?: string[];
  respostasPerguntas?: RespostaPerguntaRequest[];
}

export interface ParadaDto {
  ordem: number;
  endereco: EnderecoSolicitacaoDto;
  tempoParadaMinutos?: number;
  latitude?: number;
  longitude?: number;
}

export interface SolicitacaoCentroCustoDto {
  filialId: number;
  centroCustoId: number;
  centroCustoNome?: string;
  aprovadorId: number;
  aprovadorNome?: string;
  statusAprovacao: string;
  motivoRecusa?: CatalogoItemDto;
}

export interface PassageiroDto {
  cpf: string;
  nome?: string;
  solicitante: boolean;
}

export type PassageiroSolicitacaoDto = PassageiroDto;

export interface CorridaSolicitacaoDto {
  id: number;
  status: StatusCorrida;
  dataInicio: string;
  dataFim?: string;
  motoristaId: number;
  motoristaNome?: string;
  placaVeiculo: string;
  kmPercorrido: number;
  valorFinal: number;
  emAndamento: boolean;
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
  origem?: EnderecoSolicitacaoDto | string;
  destino?: EnderecoSolicitacaoDto | string;
  localPartida?: string;
  localDestino?: string;
}

export interface ViagemAgendadaDto {
  solicitacaoId: number;
  corridaId?: string;
  dataHoraPartida: string;
  dataChegadaEstimada?: string;
  origem: string;
  destino: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | string;
  tipoCorrida: string;
  valorEstimado: number;
  motoristaNome?: string;
  placaVeiculo?: string;
}

export interface SolicitacaoDto {
  id: number;
  status: StatusSolicitacao;
  dataCriacao?: string;
  dataCorrida: string;
  dataChegadaEstimada?: string;
  duracaoEstimadaMinutos?: number;
  distanciaEstimadaKm?: number;
  distanciaKm?: number;
  valorEstimado: number;
  tipoCorrida: CatalogoItemDto;
  tipoVeiculo?: CatalogoItemDto;
  solicitanteId?: number;
  solicitanteNome?: string;
  fornecedorId?: number;
  fornecedorNome?: string;
  origem: EnderecoSolicitacaoDto;
  destino: EnderecoSolicitacaoDto;
  localPartida?: string;
  localDestino?: string;
  paradas?: Array<ParadaDto | EnderecoSolicitacaoDto>;
  motivoSolicitacao?: CatalogoItemDto;
  motivo?: CatalogoItemDto;
  motivoCancelamento?: CatalogoItemDto;
  motivoReprovacao?: CatalogoItemDto;
  motivoRecusaFornecedor?: string;
  centrosCusto?: SolicitacaoCentroCustoDto[];
  CentrosCusto?: SolicitacaoCentroCustoDto[];
  passageiros?: PassageiroSolicitacaoDto[];
  Passageiros?: PassageiroSolicitacaoDto[];
  corrida?: CorridaSolicitacaoDto | CorridaDto;
  Corrida?: Array<CorridaSolicitacaoDto | CorridaDto>;
  emAndamento?: boolean;
  cancelavel?: boolean;
  createdAt?: string;
}

export interface CancelarSolicitacaoParams {
  motivoCancelamentoId: number;
}

export const FALLBACK_MOTIVOS: Record<string, CatalogoItemDto[]> = {
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

export function mapCorridaToSolicitacao(c: CorridaDto): SolicitacaoDto {
  return {
    id: c.solicitacaoId || c.id,
    status: c.status,
    dataCorrida: c.dataAgendada || c.inicio || new Date().toISOString(),
    dataCriacao: c.inicio,
    valorEstimado: Number(c.valorFinal || 0),
    distanciaEstimadaKm: Number(c.quilometragem || 0),
    tipoCorrida: { id: 1, nome: 'Padrão' },
    solicitanteId: c.solicitante?.id,
    solicitanteNome: c.solicitante?.nome,
    fornecedorId: c.fornecedor?.id,
    fornecedorNome: c.fornecedor?.nome,
    origem: (typeof c.origem === 'object' && c.origem !== null) ? c.origem : {
      logradouro: (typeof c.origem === 'string' && c.origem) || c.localPartida || 'Origem da Corrida',
      cidade: 'São Paulo',
      uf: 'SP',
      latitude: 0,
      longitude: 0,
      descricao: (typeof c.origem === 'string' && c.origem) || c.localPartida,
    },
    destino: (typeof c.destino === 'object' && c.destino !== null) ? c.destino : {
      logradouro: (typeof c.destino === 'string' && c.destino) || c.localDestino || 'Destino da Corrida',
      cidade: 'São Paulo',
      uf: 'SP',
      latitude: 0,
      longitude: 0,
      descricao: (typeof c.destino === 'string' && c.destino) || c.localDestino,
    },
    localPartida: c.localPartida || (typeof c.origem === 'string' ? c.origem : c.origem?.descricao || c.origem?.logradouro),
    localDestino: c.localDestino || (typeof c.destino === 'string' ? c.destino : c.destino?.descricao || c.destino?.logradouro),
    corrida: c,
    emAndamento: c.status === 'I',
    cancelavel: c.status === 'A' || c.status === 'P',
  };
}

export const ridesApi = {
  async getMotivos(tipo?: 'solicitacao' | 'cancelamento' | 'recusa'): Promise<{ response: CatalogoItemDto[] }> {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);

    if (profiles.includes('admin-master')) {
      try {
        const adminRes = await apiClient.get<{ response: { data: CatalogoItemDto[] } | CatalogoItemDto[] }>('/motivo/admin', {
          query: tipo ? { tipo } : undefined,
        });
        const list = Array.isArray(adminRes?.response)
          ? adminRes.response
          : (adminRes?.response as { data?: CatalogoItemDto[] })?.data || [];
        if (list.length > 0) {
          return { response: list };
        }
      } catch {
      }
      return { response: FALLBACK_MOTIVOS[tipo || 'cancelamento'] || FALLBACK_MOTIVOS.cancelamento };
    }

    if (profiles.includes('admin-filial')) {
      try {
        const filialRes = await apiClient.get<{ response: { data: CatalogoItemDto[] } | CatalogoItemDto[] }>('/motivo/filial', {
          query: tipo ? { tipo } : undefined,
        });
        const list = Array.isArray(filialRes?.response)
          ? filialRes.response
          : (filialRes?.response as { data?: CatalogoItemDto[] })?.data || [];
        if (list.length > 0) {
          return { response: list };
        }
      } catch {
      }
      return { response: FALLBACK_MOTIVOS[tipo || 'cancelamento'] || FALLBACK_MOTIVOS.cancelamento };
    }

    try {
      return await apiClient.get<{ response: CatalogoItemDto[] }>('/solicitacoes/motivos', {
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
    return apiClient.get<{ response: CatalogoItemDto[] }>('/solicitacoes/tipos-corrida');
  },

  getTiposVeiculo() {
    return apiClient.get<{ response: CatalogoItemDto[] }>('/solicitacoes/tipos-veiculo');
  },

  async getViagens(query?: { inicio?: string; fim?: string; dataInicio?: string; dataFim?: string }) {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 6, 23, 59, 59, 999);
    const inicio = query?.inicio || query?.dataInicio || firstDay.toISOString();
    const fim = query?.fim || query?.dataFim || lastDay.toISOString();

    if (profiles.includes('motorista')) {
      try {
        const motRes = await apiClient.get<{ response: any[] }>('/motorista/viagens', {
          query: { inicio, fim },
        });
        const list = Array.isArray(motRes?.response) ? motRes.response : [];
        return {
          response: list.map((v: any) => ({
            solicitacaoId: v.solicitacaoId || v.id,
            corridaId: String(v.id),
            dataHoraPartida: v.dataAgendada || v.inicio || inicio,
            origem: v.origem || 'Origem',
            destino: v.destino || 'Destino',
            status: v.status || 'AGENDADA',
            tipoCorrida: v.tipoCorrida || 'Padrão',
            valorEstimado: v.valorFinal || 0,
            motoristaNome: v.motoristaNome,
            placaVeiculo: v.placaVeiculo,
          })),
        };
      } catch {

      }
    }

    if (profiles.includes('solicitante') || profiles.includes('solicitante-emergencia')) {
      try {
        return await apiClient.get<{ response: ViagemAgendadaDto[] }>('/solicitacoes/viagens', {
          query: { inicio, fim },
        });
      } catch {

      }
    }

    const corridaRes = await apiClient.get<{ response: CorridaDto[] }>('/corridas/minhas', {
      query: { dataInicio: inicio, dataFim: fim },
    });
    const corridas = Array.isArray(corridaRes?.response) ? corridaRes.response : [];
    return {
      response: corridas.map((c) => ({
        solicitacaoId: c.solicitacaoId || c.id,
        corridaId: String(c.id),
        dataHoraPartida: c.dataAgendada || c.inicio || inicio,
        origem: c.localPartida || (typeof c.origem === 'string' ? c.origem : c.origem?.descricao || c.origem?.logradouro || 'Origem'),
        destino: c.localDestino || (typeof c.destino === 'string' ? c.destino : c.destino?.descricao || c.destino?.logradouro || 'Destino'),
        status: c.status,
        tipoCorrida: 'Padrão',
        valorEstimado: c.valorFinal || 0,
        motoristaNome: c.motorista?.nome,
        placaVeiculo: c.veiculo?.placa,
      })),
    };
  },

  async simular(data: SimularSolicitacaoParams): Promise<{ response: SimulacaoSolicitacaoDto }> {
    const sanitizedData = {
      dataCorrida: data.dataCorrida ? new Date(data.dataCorrida).toISOString() : new Date().toISOString(),
      tipoCorridaId: data.tipoCorridaId,
      tipoVeiculoId: data.tipoVeiculoId,
      origem: sanitizeEndereco(data.origem),
      destino: sanitizeEndereco(data.destino),
      paradas: data.paradas ? data.paradas.map(sanitizeEndereco) : [],
      cpfsAcompanhantes: data.cpfsAcompanhantes ?? [],
      respostasPerguntas: data.respostasPerguntas ?? [],
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
          distanciaEstimadaKm: routing.distanceKm,
          duracaoEstimadaMinutos: routing.durationMinutes,
          distanciaKm: routing.distanceKm,
          duracaoMinutos: routing.durationMinutes,
          valorEstimado,
        },
      };
    };

    try {
      const res = await apiClient.post<{ response: SimulacaoSolicitacaoDto }>('/solicitacoes/simulacao', sanitizedData);
      if (res?.response) {
        const distancia = res.response.distanciaEstimadaKm ?? res.response.distanciaKm ?? 0;
        const duracao = res.response.duracaoEstimadaMinutos ?? res.response.duracaoMinutos ?? 0;
        res.response.distanciaEstimadaKm = distancia;
        res.response.duracaoEstimadaMinutos = duracao;
        res.response.distanciaKm = distancia;
        res.response.duracaoMinutos = duracao;
      }
      return res;
    } catch {
      return computeLocalSimulation();
    }
  },

  create(data: CriarSolicitacaoParams) {
    let cpfs = data.cpfsAcompanhantes;
    if (!cpfs && data.passageiros) {
      cpfs = data.passageiros
        .filter((p) => !p.solicitante && p.cpf)
        .map((p) => p.cpf!.replace(/\D/g, ''))
        .filter((c) => c.length === 11);
    }

    const payload = {
      dataCorrida: data.dataCorrida ? new Date(data.dataCorrida).toISOString() : new Date().toISOString(),
      tipoCorridaId: data.tipoCorridaId,
      tipoVeiculoId: data.tipoVeiculoId,
      motivoSolicitacaoId: data.motivoSolicitacaoId,
      origem: sanitizeEndereco(data.origem),
      destino: sanitizeEndereco(data.destino),
      paradas: data.paradas ? data.paradas.map(sanitizeEndereco) : [],
      centrosCustoIds: data.centrosCustoIds,
      cpfsAcompanhantes: cpfs ?? [],
      respostasPerguntas: data.respostasPerguntas ?? [],
    };
    return apiClient.post<{ response: SolicitacaoDto }>('/solicitacoes', payload);
  },

  async list(query?: ApiQueryParams): Promise<{ response: PaginatedResponse<SolicitacaoDto> | SolicitacaoDto[] }> {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    const finalQuery: ApiQueryParams = { limit: 100, ...query };

    if (profiles.includes('solicitante') || profiles.includes('solicitante-emergencia')) {
      try {
        return await apiClient.get<{ response: PaginatedResponse<SolicitacaoDto> | SolicitacaoDto[] }>('/solicitacoes', { query: finalQuery });
      } catch (err: any) {
        if (err?.status !== 403 && err?.statusCode !== 403) {
          throw err;
        }
      }
    }

    if (profiles.includes('aprovador') && !profiles.includes('admin-master') && !profiles.includes('admin-filial')) {
      try {
        return await apiClient.get<{ response: PaginatedResponse<SolicitacaoDto> | SolicitacaoDto[] }>('/solicitacoes/aprovador/pendentes', { query: finalQuery });
      } catch (err: any) {
        if (err?.status !== 403 && err?.statusCode !== 403) {
          throw err;
        }
      }
    }

    const corridaRes = await this.getMinhasCorridas(query as any);
    const corridas = Array.isArray(corridaRes?.response) ? corridaRes.response : [];
    const mapped = corridas.map(mapCorridaToSolicitacao);
    return {
      response: {
        totalCount: mapped.length,
        hasNextPage: false,
        data: mapped,
      },
    };
  },

  listAprovadorPendentes(query?: ApiQueryParams) {
    return apiClient.get<{ response: PaginatedResponse<SolicitacaoDto> | SolicitacaoDto[] }>('/solicitacoes/aprovador/pendentes', { query });
  },

  async getById(id: number): Promise<{ response: SolicitacaoDto }> {
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);
    const canCallSolicitacao = profiles.some((p) => p === 'solicitante' || p === 'solicitante-emergencia' || p === 'aprovador');

    if (canCallSolicitacao) {
      try {
        return await apiClient.get<{ response: SolicitacaoDto }>(`/solicitacoes/${id}`);
      } catch {

      }
    }

    const corridaRes = await this.getCorridaById(id);
    if (corridaRes?.response) {
      return { response: mapCorridaToSolicitacao(corridaRes.response) };
    }
    throw new Error('Solicitação ou corrida não encontrada');
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

  getFornecedoresCandidatos(id: number) {
    return apiClient.get<{ response: FornecedorCandidatoDto[] }>(`/solicitacoes/${id}/fornecedores-candidatos`);
  },

  rejeitar(id: number, motivoRecusaId: number = 1): Promise<{ response: SolicitacaoDto }> {
    return apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/aprovacao`, {
      decisao: 'REPROVAR',
      motivoRecusaId,
    });
  },

  approveRequest(requestId: number, fornecedorId?: number) {
    return this.aprovar(requestId, fornecedorId);
  },

  rejectRequest(requestId: number, motivoRecusaId: number = 1) {
    return this.rejeitar(requestId, motivoRecusaId);
  },

  async cancelar(id: number, data?: CancelarSolicitacaoParams | number) {
    const body = typeof data === 'number' ? { motivoCancelamentoId: data } : (data ?? { motivoCancelamentoId: 1 });
    const user = useAuthStore.getState().user;
    const profiles = getUserNormalizedProfiles(user);

    if (profiles.includes('motorista')) {
      return apiClient.patch<{ response: any }>(`/corridas/${id}/cancelamento`, body);
    }

    try {
      return await apiClient.patch<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/cancelamento`, body);
    } catch (err: any) {
      if (err?.status === 403 || err?.statusCode === 403 || err?.status === 404) {
        return apiClient.patch<{ response: any }>(`/corridas/${id}/cancelamento`, body);
      }
      throw err;
    }
  },

  listRequests(query?: ApiQueryParams) {
    return this.list(query);
  },

  getRequest(requestId: number) {
    return this.getById(requestId);
  },

  createRequest(payload: CriarSolicitacaoParams) {
    return this.create(payload);
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

  decisaoFornecedor(
    id: number,
    data: { decisao: 'REATRIBUIR'; motoristaId: number; veiculoId: number } | { decisao: 'RECUSAR'; motivo: string }
  ) {
    return apiClient.post<{ response: SolicitacaoDto }>(`/solicitacoes/${id}/decisao-fornecedor`, data);
  },
};
