import type { Permission, UserProfile } from '../types/profile.types';
import { hasPermission } from '../types/profile.types';
import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const profile = useAuthStore((state) => state.user?.profile);

  return {
    profile,
    isAdminMaster: profile === 'admin-master',
    isAdmin: profile === 'admin',
    isApprover: profile === 'aprovador',
    isSupplier: profile === 'fornecedor',
    hasProfile: (profiles: UserProfile[]) => Boolean(profile && profiles.includes(profile)),
    can: (permission: Permission) => hasPermission(profile, permission),
  };
};
