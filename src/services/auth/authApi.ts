import { apiClient } from '../api/apiClient';
import type { AuthResponse, LoginCredentials } from '../../types/auth.types';

export interface TwoFactorCredentials {
  email: string;
  code: string;
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiClient.post<AuthResponse>('/auth/login', credentials, { skipAuth: true });
  },

  verifyTwoFactor(credentials: TwoFactorCredentials) {
    return apiClient.post<AuthResponse>('/auth/2fa/verify', credentials, { skipAuth: true });
  },

  resendTwoFactorCode(email: string) {
    return apiClient.post<void>('/auth/2fa/resend', { email }, { skipAuth: true });
  },

  me() {
    return apiClient.get<AuthResponse['user']>('/auth/me');
  },

  logout() {
    return apiClient.post<void>('/auth/logout');
  },
};
