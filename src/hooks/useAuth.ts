import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/auth/authApi';
import type { LoginCredentials } from '../types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { logout: storeLogout, setLoading, setError, ...authState } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const { response } = await authApi.login(credentials);
        const { accessToken, refreshToken } = response;

        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('auth_email', credentials.email);

        navigate('/two-factor', { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao fazer login';
        setError(message);
        throw error;
      }
    },
    [navigate, setLoading, setError]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  return {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
  };
};
