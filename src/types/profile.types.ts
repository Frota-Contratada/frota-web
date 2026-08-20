export type UserProfile =
  | 'admin-master'
  | 'admin-filial'
  | 'admin-fornecedor'
  | 'solicitante'
  | 'solicitante-emergencia'
  | 'aprovador'
  | 'motorista'
  | 'admin'
  | 'fornecedor';

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
  'admin-filial': 'Admin Filial',
  'admin-fornecedor': 'Admin Fornecedor',
  solicitante: 'Solicitante',
  'solicitante-emergencia': 'Solicitante Emergência',
  aprovador: 'Aprovador',
  motorista: 'Motorista',
  admin: 'Admin',
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
  'admin-filial': [
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
  ],
  'admin-fornecedor': [
    'rides:read',
    'rides:execute',
    'contracts:read',
    'suppliers:read',
    'employees:read',
  ],
  solicitante: [
    'rides:read',
    'rides:create',
  ],
  'solicitante-emergencia': [
    'rides:read',
    'rides:create',
  ],
  aprovador: [
    'dashboard:read',
    'rides:read',
    'rides:review',
    'rides:approve',
    'rides:reject',
  ],
  motorista: [
    'rides:read',
    'rides:execute',
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
  fornecedor: [
    'rides:read',
    'rides:execute',
    'contracts:read',
  ],
};

export const hasPermission = (profile: UserProfile | undefined, permission: Permission): boolean => {
  if (!profile || !PROFILE_PERMISSIONS[profile]) return false;
  return PROFILE_PERMISSIONS[profile].includes(permission);
};

export const hasAnyPermission = (profiles: (UserProfile | string)[] | undefined, permission: Permission): boolean => {
  if (!profiles || profiles.length === 0) return false;
  return profiles.some((p) => hasPermission(p as UserProfile, permission));
};

export const isAdminProfile = (profile: UserProfile | undefined) =>
  profile === 'admin' || profile === 'admin-master' || profile === 'admin-filial';
