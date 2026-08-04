import { apiClient } from '../api/apiClient';
import type { AuthResponse, LoginCredentials } from '../../types/auth.types';

export interface PinEnviarParams {
  tipoToken: 'SIGN_UP' | 'REDEFINIR_SENHA';
  email: string;
}

export interface PinConfirmarParams {
  pin: string;
  email: string;
}

export interface PinConfirmarResponse {
  response: {
    token: string;
    tipoToken: 'SIGN_UP' | 'REDEFINIR_SENHA';
    expirationDate: string;
  };
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface MeResponse {
  response: {
    id: number;
    nome: string;
    email: string;
  };
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiClient.post<AuthResponse>('/autenticacao/login', credentials, { skipAuth: true });
  },

  refresh(params: RefreshTokenParams) {
    return apiClient.post<AuthResponse>('/autenticacao/refresh', params, { skipAuth: true });
  },

  signUp(data: { token: string; senha: string }) {
    return apiClient.post<void>('/autenticacao/sign-up', data, { skipAuth: true });
  },

  pinEnviar(params: PinEnviarParams) {
    return apiClient.post<void>('/autenticacao/pin/enviar', params, { skipAuth: true });
  },

  pinConfirmar(params: PinConfirmarParams) {
    return apiClient.post<PinConfirmarResponse>('/autenticacao/pin/confirmar', params, { skipAuth: true });
  },

  me() {
    return apiClient.get<MeResponse>('/autenticacao/me');
  },

  logout() {
    return apiClient.post<void>('/autenticacao/logout');
  },
};
