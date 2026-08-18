import type { UserProfile } from './profile.types';

export type { UserProfile };

export type Plataforma = 'WEB' | 'MOBILE';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  profile: UserProfile;
  fotoPerfil?: string;
  dataAtivacao?: string;
  perfis?: Array<{
    tipoPerfil: string;
    dataInicioVigencia: string;
    dataFimVigencia?: string;
  }>;
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
