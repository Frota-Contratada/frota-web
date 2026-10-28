import { create } from 'zustand';
import type { User, AuthState, UserProfile } from '../types/auth.types';
import type { UserMe } from '../services/user/userApi';
import { authApi } from '../services/auth/authApi';
import { normalizeProfile } from '../types/profile.types';

// Usuário e perfis ficam só em memória: vêm sempre de /usuario/info/me, nunca
// do navegador. No localStorage ficam apenas os tokens, que a API valida.
const CHAVE_LEGADA = 'auth-storage';

const temToken = () => {
  try {
    localStorage.removeItem(CHAVE_LEGADA);
    return !!localStorage.getItem('auth_token');
  } catch {
    return false;
  }
};

export const userFromMe = (me: UserMe): User => {
  const rawMain = me.perfis && me.perfis.length > 0 ? me.perfis[0].tipoPerfil : 'solicitante';

  return {
    id: String(me.id),
    name: me.nome,
    email: me.email,
    cpf: me.cpf,
    profile: normalizeProfile(rawMain) || ('solicitante' as UserProfile),
    fotoPerfil: me.fotoPerfil,
    dataAtivacao: me.dataAtivacao,
    perfis: me.perfis,
  };
};

interface AuthStore extends AuthState {
  isRestoring: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

let restoring: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isRestoring: temToken(),
  isLoading: false,
  error: null,

  login: (user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      user,
      isAuthenticated: true,
      isRestoring: false,
      error: null,
      isLoading: false,
    });
  },

  updateUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      error: null,
    });
  },

  restoreSession: () => {
    if (!temToken() || get().user) {
      set({ isRestoring: false });
      return Promise.resolve();
    }

    restoring ??= authApi
      .me()
      .then(({ response }) => {
        set({ user: userFromMe(response), isAuthenticated: true, isRestoring: false });
      })
      .catch(() => {
        get().logout();
      })
      .finally(() => {
        restoring = null;
      });

    set({ isRestoring: true });
    return restoring;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      isAuthenticated: false,
      isRestoring: false,
      error: null,
      isLoading: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setError: (error: string | null) => set({ error, isLoading: false }),
}));
