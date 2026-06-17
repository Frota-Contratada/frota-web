import type { UserProfile } from './profile.types';

export interface User {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}
