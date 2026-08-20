import { useMemo } from 'react';
import type { Permission, UserProfile } from '../types/profile.types';
import { hasAnyPermission, hasPermission } from '../types/profile.types';
import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const userProfiles = useMemo<UserProfile[]>(() => {
    if (!user) return [];
    const profiles = new Set<UserProfile>();
    if (user.profile) {
      profiles.add(user.profile);
    }
    if (user.perfis && Array.isArray(user.perfis)) {
      user.perfis.forEach((p) => {
        if (p.tipoPerfil) {
          profiles.add(p.tipoPerfil as UserProfile);
        }
      });
    }
    return Array.from(profiles);
  }, [user]);

  const primaryProfile = userProfiles[0] || user?.profile;

  return {
    profile: primaryProfile,
    profiles: userProfiles,
    isAdminMaster: userProfiles.includes('admin-master'),
    isAdminFilial: userProfiles.includes('admin-filial'),
    isAdmin: userProfiles.includes('admin-master') || userProfiles.includes('admin-filial') || userProfiles.includes('admin'),
    isApprover: userProfiles.includes('aprovador'),
    isRequester: userProfiles.includes('solicitante') || userProfiles.includes('solicitante-emergencia'),
    isDriver: userProfiles.includes('motorista'),
    isSupplier: userProfiles.includes('admin-fornecedor') || userProfiles.includes('fornecedor'),
    hasProfile: (profiles: UserProfile[]) => userProfiles.includes('admin-master') || profiles.some((p) => userProfiles.includes(p)),
    can: (permission: Permission) => userProfiles.includes('admin-master') || hasAnyPermission(userProfiles, permission) || hasPermission(primaryProfile, permission),
  };
};
