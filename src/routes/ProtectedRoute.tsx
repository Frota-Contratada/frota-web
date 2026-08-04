import { useAuthStore } from '../stores/authStore';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types/profile.types';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, login } = useAuthStore();

  // Se não houver usuário logado no localStorage, injeta um usuário mock
  if (!user) {
    setTimeout(() => {
      login(
        {
          id: '1',
          name: 'Usuário Teste',
          email: 'teste@seara.com',
          profile: 'admin-master' as UserProfile,
        },
        'mock-access-token',
        'mock-refresh-token'
      );
    }, 0);
  }

  return <>{children}</>;
};
