import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '../types/auth.types';

interface AuthStore extends AuthState {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: (user: User, accessToken: string, refreshToken: string) => {
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({
          user,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
