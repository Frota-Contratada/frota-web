import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission, UserProfile } from '../types/profile.types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedProfiles?: UserProfile[];
  requiredPermission?: Permission;
}

export const ProtectedRoute = ({
  children,
  allowedProfiles,
  requiredPermission,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { hasProfile, can, isRequester, isDriver } = usePermissions();

  const token = localStorage.getItem('auth_token');

  if (!isAuthenticated && !token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedProfiles && allowedProfiles.length > 0) {
    const hasAllowedProfile = hasProfile(allowedProfiles);
    if (!hasAllowedProfile) {
      if (isRequester) {
        return <Navigate to="/corridas/solicitacoes" replace />;
      }
      if (isDriver) {
        return <Navigate to="/corridas/historico" replace />;
      }
      return <Navigate to="/visao-executiva" replace />;
    }
  }

  if (requiredPermission && !can(requiredPermission)) {
    if (isRequester) {
      return <Navigate to="/corridas/solicitacoes" replace />;
    }
    return <Navigate to="/visao-executiva" replace />;
  }

  return <>{children}</>;
};
