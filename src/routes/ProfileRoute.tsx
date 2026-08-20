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
  requiredAnyPermission, fallbackPath = '/visao-executiva',
}: ProfileRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const profiles = user?.perfis?.map((p) => p.tipoPerfil) ?? (user?.profile ? [user.profile] : []);
  const profile = user?.profile;

  const canAccessByProfile = !allowedProfiles || Boolean(profile && allowedProfiles.includes(profile)) || (user?.perfis && user.perfis.some((p) => allowedProfiles?.includes(p.tipoPerfil as UserProfile)));
  const canAccessByPermission = !requiredPermission || hasPermission(profile, requiredPermission);
  const canAccessByAnyPermission = !requiredAnyPermission || requiredAnyPermission.some((perm) => hasAnyPermission(profiles, perm));

  if (!canAccessByProfile || !canAccessByPermission || !canAccessByAnyPermission) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
};
