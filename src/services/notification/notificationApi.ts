import { apiClient } from '../api/apiClient';

export interface AcaoNotificacaoDto {
  rota: string;
  parametros?: Record<string, string>;
}

export interface NotificacaoDto {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  acao?: AcaoNotificacaoDto;
  criadaEm: string;
  expiraEm: string;
  lidaEm: string | null;
}

export interface QuantidadeNotificacoesNaoLidasResponse {
  response: {
    quantidade: number;
  };
}

export interface NotificacoesListResponse {
  response: NotificacaoDto[];
}

export interface NotificacaoResponse {
  response: NotificacaoDto;
}

export const notificationApi = {
  getUnreadCount() {
    return apiClient.get<QuantidadeNotificacoesNaoLidasResponse>('/notificacoes/nao-lidas/quantidade');
  },

  list() {
    return apiClient.get<NotificacoesListResponse>('/notificacoes');
  },

  markAsRead(id: string) {
    return apiClient.patch<NotificacaoResponse>(`/notificacoes/${id}/lida`, {});
  },
};
