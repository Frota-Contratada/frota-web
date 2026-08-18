import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/auth/authApi';
import type { LoginCredentials, User, UserProfile } from '../types/auth.types';

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

        let user: User;
        try {
          const meResponse = await authApi.me();
          const meData = meResponse.response;
          const mainProfile = (meData.perfis && meData.perfis.length > 0)
            ? (meData.perfis[0].tipoPerfil as UserProfile)
            : ('admin-master' as UserProfile);

          user = {
            id: String(meData.id),
            name: meData.nome,
            email: meData.email,
            cpf: meData.cpf,
            profile: mainProfile,
            fotoPerfil: meData.fotoPerfil,
            dataAtivacao: meData.dataAtivacao,
            perfis: meData.perfis,
          };
        } catch {
          user = {
            id: '1',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            profile: 'admin-master',
          };
        }

        storeLogin(user, accessToken, refreshToken);
        navigate('/home', { replace: true });
      } catch (error) {
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
