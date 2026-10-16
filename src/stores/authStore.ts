import { create } from 'zustand';
import type { User, AuthState, UserProfile } from '../types/auth.types';
import { normalizeProfile } from '../types/profile.types';
import type { UserMe } from '../services/user/userApi';

const LEGACY_PERSIST_KEY = 'auth-storage';

interface AuthStore extends AuthState {
  isBootstrapping: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  bootstrap: () => Promise<void>;
}

export const buildUserFromMe = (meData: UserMe): User => {
  const firstProfile = meData.perfis?.[0]?.tipoPerfil;
  const mainProfile = (normalizeProfile(firstProfile) ?? 'solicitante') as UserProfile;
  return {
    id: String(meData.id),
    name: meData.nome,
    email: meData.email,
    cpf: meData.cpf,
    profile: mainProfile,
    fotoPerfil: meData.fotoPerfil,
    dataAtivacao: meData.dataAtivacao,
    perfis: meData.perfis,
  };
};

const clearTokens = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

try {
  localStorage.removeItem(LEGACY_PERSIST_KEY);
} catch {
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isBootstrapping: typeof localStorage !== 'undefined' && !!localStorage.getItem('auth_token'),

  login: (user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      user,
      isAuthenticated: true,
      isBootstrapping: false,
      error: null,
      isLoading: false,
    });
  },

  logout: () => {
    clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      error: null,
      isLoading: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error, isLoading: false }),

  bootstrap: () => {
    if (bootstrapPromise) return bootstrapPromise;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isBootstrapping: false, isAuthenticated: false, user: null });
      return Promise.resolve();
    }
    if (get().isAuthenticated && get().user) {
      set({ isBootstrapping: false });
      return Promise.resolve();
    }

    set({ isBootstrapping: true });
    bootstrapPromise = (async () => {
      try {
        const { authApi } = await import('../services/auth/authApi');
        const { response } = await authApi.me();
        set({
          user: buildUserFromMe(response),
          isAuthenticated: true,
          isBootstrapping: false,
        });
      } catch {
        clearTokens();
        set({ user: null, isAuthenticated: false, isBootstrapping: false });
      } finally {
        bootstrapPromise = null;
      }
    })();
    return bootstrapPromise;
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'auth_token') return;
    const state = useAuthStore.getState();
    if (!event.newValue) {
      state.logout();
      return;
    }
    useAuthStore.setState({ user: null, isAuthenticated: false });
    void state.bootstrap();
  });
}
