import { apiClient } from '../api/apiClient';
import type { AuthResponse, LoginCredentials } from '../../types/auth.types';

export interface PinEnviarParams {
  tipoToken: 'SIGN_UP' | 'REDEFINIR_SENHA';
  email: string;
}

export interface PinConfirmarParams {
  pin: string;
  email: string;
  tipoToken: 'SIGN_UP' | 'REDEFINIR_SENHA';
}

export interface PinConfirmarResponse {
  response: {
    token: string;
  };
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface RedefinirSenhaParams {
  token: string;
  senha: string;
}

export interface SignUpParams {
  token: string;
  senha: string;
}

export interface PrimeiroAcessoResponse {
  response: {
    primeiroAcesso: boolean;
  };
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiClient.post<AuthResponse>('/autenticacao/login', credentials, { skipAuth: true });
  },

  refresh(params: RefreshTokenParams) {
    return apiClient.post<AuthResponse>('/autenticacao/refresh', params, { skipAuth: true });
  },

  signUp(data: SignUpParams) {
    return apiClient.post<void>('/autenticacao/sign-up', data, { skipAuth: true });
  },

  redefinirSenha(data: RedefinirSenhaParams) {
    return apiClient.post<void>('/autenticacao/redefinir-senha', data, { skipAuth: true });
  },

  verificarPrimeiroAcesso(email: string) {
    return apiClient.get<PrimeiroAcessoResponse>(`/autenticacao/primeiro-acesso/${encodeURIComponent(email)}`, { skipAuth: true });
  },

  pinEnviar(params: PinEnviarParams) {
    return apiClient.post<void>('/autenticacao/pin/enviar', params, { skipAuth: true });
  },

  pinConfirmar(params: PinConfirmarParams) {
    return apiClient.post<PinConfirmarResponse>('/autenticacao/pin/confirmar', params, { skipAuth: true });
  },

  me() {
    return apiClient.get<{ response: import('../user/userApi').UserMe }>('/usuario/me');
  },

  logout() {
    return apiClient.post<void>('/autenticacao/logout');
  },
};

