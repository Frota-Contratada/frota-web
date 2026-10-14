import { apiClient } from '../api/apiClient';

export interface MotoristaCorridaParadaDto {
  ordem: number;
  endereco: string;
  latitude: number;
  longitude: number;
}

export interface MotoristaCorridaDto {
  id: number;
  dataHoraPartida: string;
  origem: string;
  destino: string;
  paradas: MotoristaCorridaParadaDto[];
  nomePassageiro: string;
  valorEstimado: number;
  tipoCorrida: string;
  status: string;
  placaVeiculo?: string;
  dataFim?: string;
  ehProxima: boolean;
  minutosRestantes?: number;
  motivoRecusa?: string;
  dataCorrida?: string;
  passageiroNome?: string;
}

export type CorridaMotoristaDto = MotoristaCorridaDto;

export interface MotoristaPerfilDto {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  fornecedorNome?: string;
  fotoPerfil?: string;
  viagensFinalizadas: number;
  transportesDeItens: number;
  historico: MotoristaCorridaDto[];

  foto?: string;
  fornecedorId?: number;
}

export interface ViagensMotoristaQueryParams {
  inicio: string;
  fim: string;
  dataInicio?: string;
  dataFim?: string;
}

export const driverRideApi = {
  getViagens(query?: ViagensMotoristaQueryParams) {
    const mappedQuery: Record<string, string | number | boolean | null | undefined> = {};
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const inicio = query?.inicio || query?.dataInicio || firstDay.toISOString();
    const fim = query?.fim || query?.dataFim || lastDay.toISOString();
    mappedQuery.inicio = inicio;
    mappedQuery.fim = fim;

    return apiClient.get<{ response: MotoristaCorridaDto[] }>('/motorista/viagens', {
      query: mappedQuery,
    });
  },

  getCorrida(id: number) {
    return apiClient.get<{ response: MotoristaCorridaDto }>(`/motorista/corridas/${id}`);
  },

  iniciarCorrida(id: number) {
    return apiClient.post<{ response: MotoristaCorridaDto }>(`/motorista/corridas/${id}/iniciar`);
  },

  recusarCorrida(id: number, motivo: string) {
    const trimmed = (motivo || '').trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      throw new Error('O motivo da recusa deve ter no mínimo 5 e no máximo 500 caracteres.');
    }
    return apiClient.post<{ response: MotoristaCorridaDto }>(`/motorista/corridas/${id}/recusar`, {
      motivo: trimmed,
    });
  },

  getPerfil() {
    return apiClient.get<{ response: MotoristaPerfilDto }>('/motorista/meus-dados');
  },
};
