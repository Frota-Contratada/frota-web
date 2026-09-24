import { apiClient } from '../api/apiClient';

export interface MotoristaPerfilDto {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  fornecedorId: number;
  fornecedorNome?: string;
  foto?: string;
}

export interface CorridaMotoristaDto {
  id: number;
  dataCorrida: string;
  status: string;
  origem: {
    logradouro: string;
    cidade: string;
    uf: string;
    numero?: string;
    bairro?: string;
    latitude: number;
    longitude: number;
  };
  destino: {
    logradouro: string;
    cidade: string;
    uf: string;
    numero?: string;
    bairro?: string;
    latitude: number;
    longitude: number;
  };
  passageiroNome?: string;
  passageiroTelefone?: string;
  distanciaKm?: number;
  duracaoMinutos?: number;
}

export interface ViagensMotoristaQueryParams {
  inicio?: string;
  fim?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const driverRideApi = {
  getViagens(query?: ViagensMotoristaQueryParams) {
    const mappedQuery: Record<string, string | number | boolean | null | undefined> = {};
    const inicio = query?.inicio || query?.dataInicio;
    const fim = query?.fim || query?.dataFim;
    if (inicio) mappedQuery.inicio = inicio;
    if (fim) mappedQuery.fim = fim;
    return apiClient.get<{ response: CorridaMotoristaDto[] }>('/motorista/viagens', {
      query: mappedQuery,
    });
  },

  getCorrida(id: number) {
    return apiClient.get<{ response: CorridaMotoristaDto }>(`/motorista/corridas/${id}`);
  },

  iniciarCorrida(id: number) {
    return apiClient.post<{ response: CorridaMotoristaDto }>(`/motorista/corridas/${id}/iniciar`);
  },

  recusarCorrida(id: number, motivo: string) {
    return apiClient.post<{ response: CorridaMotoristaDto }>(`/motorista/corridas/${id}/recusar`, {
      motivo,
    });
  },

  getPerfil() {
    return apiClient.get<{ response: MotoristaPerfilDto }>('/motorista/perfil');
  },
};
