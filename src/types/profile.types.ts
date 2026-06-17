export type UserProfile = 'admin-master' | 'admin' | 'aprovador' | 'fornecedor';

export type Permission =
  | 'dashboard:read'
  | 'rides:read'
  | 'rides:create'
  | 'rides:review'
  | 'rides:approve'
  | 'rides:reject'
  | 'rides:execute'
  | 'suppliers:read'
  | 'suppliers:manage'
  | 'contracts:read'
  | 'contracts:manage'
  | 'employees:read'
  | 'employees:manage'
  | 'branches:read'
  | 'branches:manage'
  | 'users:manage'
  | 'settings:manage';

export const PROFILE_LABELS: Record<UserProfile, string> = {
  'admin-master': 'Admin Master',
  admin: 'Admin',
  aprovador: 'Aprovador',
  fornecedor: 'Fornecedor',
};

export const PROFILE_PERMISSIONS: Record<UserProfile, Permission[]> = {
  'admin-master': [
    'dashboard:read',
    'rides:read',
    'rides:create',
    'rides:review',
    'rides:approve',
    'rides:reject',
    'rides:execute',
    'suppliers:read',
    'suppliers:manage',
    'contracts:read',
    'contracts:manage',
    'employees:read',
    'employees:manage',
    'branches:read',
    'branches:manage',
    'users:manage',
    'settings:manage',
  ],
  admin: [
    'dashboard:read',
    'rides:read',
    'rides:create',
    'rides:review',
    'rides:approve',
    'rides:reject',
    'suppliers:read',
    'suppliers:manage',
    'contracts:read',
    'contracts:manage',
    'employees:read',
    'employees:manage',
    'branches:read',
    'branches:manage',
  ],
  aprovador: [
    'dashboard:read',
    'rides:read',
    'rides:review',
    'rides:approve',
    'rides:reject',
    'suppliers:read',
    'contracts:read',
    'employees:read',
    'branches:read',
  ],
  fornecedor: [
    'rides:read',
    'rides:execute',
    'contracts:read',
  ],
};

export const hasPermission = (profile: UserProfile | undefined, permission: Permission) => {
  if (!profile) return false;
  return PROFILE_PERMISSIONS[profile].includes(permission);
};

export const hasAnyPermission = (profile: UserProfile | undefined, permissions: Permission[]) => {
  if (!profile) return false;
  return permissions.some((permission) => hasPermission(profile, permission));
};

export const isAdminProfile = (profile: UserProfile | undefined) => profile === 'admin' || profile === 'admin-master';
