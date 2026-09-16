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
  const { hasProfile, can, defaultRoute } = usePermissions();

  const token = localStorage.getItem('auth_token');

  if (!isAuthenticated && !token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedProfiles && allowedProfiles.length > 0) {
    const hasAllowedProfile = hasProfile(allowedProfiles);
    if (!hasAllowedProfile) {
      const targetRoute = location.pathname === defaultRoute ? '/corridas/solicitacoes' : defaultRoute;
      return <Navigate to={targetRoute} replace />;
    }
  }

  if (requiredPermission && !can(requiredPermission)) {
    const targetRoute = location.pathname === defaultRoute ? '/corridas/solicitacoes' : defaultRoute;
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
};
