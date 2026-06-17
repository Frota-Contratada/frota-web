import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { Permission, UserProfile } from '../types/profile.types';
import { hasAnyPermission, hasPermission } from '../types/profile.types';

interface ProfileRouteProps {
  children: ReactNode;
  allowedProfiles?: UserProfile[];
  requiredPermission?: Permission;
  requiredAnyPermission?: Permission[];
  fallbackPath?: string;
}

export const ProfileRoute = ({
  children, allowedProfiles, requiredPermission,
  requiredAnyPermission, fallbackPath = '/home',
}: ProfileRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const profile = user?.profile;

  const canAccessByProfile = !allowedProfiles || Boolean(profile && allowedProfiles.includes(profile));
  const canAccessByPermission = !requiredPermission || hasPermission(profile, requiredPermission);
  const canAccessByAnyPermission = !requiredAnyPermission || hasAnyPermission(profile, requiredAnyPermission);

  if (!canAccessByProfile || !canAccessByPermission || !canAccessByAnyPermission) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
};
