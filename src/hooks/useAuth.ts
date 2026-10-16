import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, buildUserFromMe } from '../stores/authStore';
import { authApi } from '../services/auth/authApi';
import type { LoginCredentials } from '../types/auth.types';
import { getDefaultRouteForProfiles } from '../types/profile.types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login: storeLogin, logout: storeLogout, setLoading, setError, ...authState } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const { response } = await authApi.login(credentials);
        const { accessToken, refreshToken } = response;

        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        const meResponse = await authApi.me();
        const user = buildUserFromMe(meResponse.response);

        storeLogin(user, accessToken, refreshToken);

        const userProfiles = user.perfis && user.perfis.length > 0
          ? user.perfis.map((p) => p.tipoPerfil)
          : [user.profile];
        const targetRoute = getDefaultRouteForProfiles(userProfiles);
        navigate(targetRoute, { replace: true });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        const message = error instanceof Error ? error.message : 'Erro ao fazer login';
        setError(message);
        throw error;
      }
    },
    [navigate, storeLogin, setLoading, setError]
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
