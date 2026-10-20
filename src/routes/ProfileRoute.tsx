import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission, UserProfile } from '../types/profile.types';

interface ProfileRouteProps {
  children: ReactNode;
  allowedProfiles?: UserProfile[];
  requiredPermission?: Permission;
  requiredAnyPermission?: Permission[];
  fallbackPath?: string;
}

export const ProfileRoute = ({
  children, allowedProfiles, requiredPermission,
  requiredAnyPermission, fallbackPath = '/visao-executiva',
}: ProfileRouteProps) => {
  const { hasProfile, can } = usePermissions();

  const canAccessByProfile = !allowedProfiles || hasProfile(allowedProfiles);
  const canAccessByPermission = !requiredPermission || can(requiredPermission);
  const canAccessByAnyPermission = !requiredAnyPermission || requiredAnyPermission.some((perm) => can(perm));

  if (!canAccessByProfile || !canAccessByPermission || !canAccessByAnyPermission) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
};
