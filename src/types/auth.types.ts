import type { UserProfile } from './profile.types';

export type Plataforma = 'WEB' | 'MOBILE';

export interface User {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
}

export interface LoginCredentials {
  email: string;
  senha: string;
  plataforma: Plataforma;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  validade: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  response: AuthTokens;
}
