import { useMemo } from 'react';
import type { Permission, UserProfile } from '../types/profile.types';
import { getDefaultRouteForProfiles, hasAnyPermission, hasPermission, normalizeProfile } from '../types/profile.types';
import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const userProfiles = useMemo<UserProfile[]>(() => {
    if (!user) return [];
    const profiles = new Set<UserProfile>();
    if (user.profile) {
      const norm = normalizeProfile(user.profile);
      if (norm) profiles.add(norm);
    }
    if (user.perfis && Array.isArray(user.perfis)) {
      user.perfis.forEach((p) => {
        if (p.tipoPerfil) {
          const norm = normalizeProfile(p.tipoPerfil);
          if (norm) profiles.add(norm);
        }
      });
    }
    return Array.from(profiles);
  }, [user]);

  const primaryProfile = userProfiles[0] || normalizeProfile(user?.profile);
  const defaultRoute = useMemo(() => getDefaultRouteForProfiles(userProfiles), [userProfiles]);

  return {
    profile: primaryProfile,
    profiles: userProfiles,
    defaultRoute,
    isAdminMaster: userProfiles.includes('admin-master'),
    isAdminFilial: userProfiles.includes('admin-filial'),
    isAdmin: userProfiles.includes('admin-master') || userProfiles.includes('admin-filial'),
    isApprover: userProfiles.includes('aprovador'),
    isRequester: userProfiles.includes('solicitante') || userProfiles.includes('solicitante-emergencia'),
    isDriver: userProfiles.includes('motorista'),
    isSupplier: userProfiles.includes('admin-fornecedor'),
    hasProfile: (profiles: UserProfile[]) => userProfiles.includes('admin-master') || profiles.some((p) => userProfiles.includes(p)),
    can: (permission: Permission) => userProfiles.includes('admin-master') || hasAnyPermission(userProfiles, permission) || hasPermission(primaryProfile, permission),
  };
};
