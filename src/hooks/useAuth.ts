import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth/authService';
import type { LoginCredentials } from '../types/auth.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { logout, setLoading, setError, ...authState } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const response = await authService.login(credentials);
        navigate('/two-factor', { state: { email: response.user.email }, replace: true });
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
      await authService.logout();
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  return {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
  };
};
