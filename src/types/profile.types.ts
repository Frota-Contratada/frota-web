export type UserProfile =
  | 'admin-master'
  | 'admin-filial'
  | 'admin-fornecedor'
  | 'solicitante'
  | 'solicitante-emergencia'
  | 'aprovador'
  | 'motorista';

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
};

export const normalizeProfile = (raw?: string | null): UserProfile | undefined => {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase().replace(/_/g, '-');

  if (cleaned === 'admin-master' || cleaned === 'administrador-matriz' || cleaned === 'master' || cleaned === 'admin') {
    return 'admin-master';
  }
  if (cleaned === 'admin-filial' || cleaned === 'administrador-filial' || cleaned === 'filial') {
    return 'admin-filial';
  }
  if (cleaned === 'admin-fornecedor' || cleaned === 'administrador-fornecedor' || cleaned === 'fornecedor') {
    return 'admin-fornecedor';
  }
  if (cleaned === 'aprovador' || cleaned === 'gestor') {
    return 'aprovador';
  }
  if (cleaned === 'solicitante-emergencia' || cleaned === 'solicitante-emergencial') {
    return 'solicitante-emergencia';
  }
  if (cleaned === 'solicitante' || cleaned === 'colaborador') {
    return 'solicitante';
  }
  if (cleaned === 'motorista' || cleaned === 'driver') {
    return 'motorista';
  }
  return undefined;
};

export const hasPermission = (profile: UserProfile | undefined, permission: Permission): boolean => {
  const norm = normalizeProfile(profile);
  if (!norm || !PROFILE_PERMISSIONS[norm]) return false;
  return PROFILE_PERMISSIONS[norm].includes(permission);
};

export const hasAnyPermission = (profiles: (UserProfile | string)[] | undefined, permission: Permission): boolean => {
  if (!profiles || profiles.length === 0) return false;
  return profiles.some((p) => hasPermission(p as UserProfile, permission));
};

export const getTokenNormalizedProfiles = (): UserProfile[] => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];
    const parts = token.split('.');
    if (parts.length !== 3) return [];
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { perfis?: string[] };
    if (Array.isArray(payload?.perfis)) {
      const profiles = new Set<UserProfile>();
      payload.perfis.forEach((raw) => {
        const norm = normalizeProfile(raw);
        if (norm) profiles.add(norm);
      });
      return Array.from(profiles);
    }
  } catch {

  }
  return [];
};

export const getUserNormalizedProfiles = (
  user?: { profile?: string | null; perfis?: Array<{ tipoPerfil: string }> } | null
): UserProfile[] => {
  const tokenProfiles = getTokenNormalizedProfiles();
  if (tokenProfiles.length > 0) {
    return tokenProfiles;
  }
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
};

export const isAdminProfile = (profile: UserProfile | undefined): boolean => {
  const norm = normalizeProfile(profile);
  return norm === 'admin-master' || norm === 'admin-filial';
};

export const getDefaultRouteForProfiles = (profiles: (UserProfile | string)[] | undefined): string => {
  if (!profiles || profiles.length === 0) return '/corridas/solicitacoes';
  const normalized = profiles.map(normalizeProfile).filter(Boolean) as UserProfile[];

  if (normalized.includes('admin-master') || normalized.includes('admin-filial')) {
    return '/visao-executiva';
  }
  if (normalized.includes('aprovador')) {
    return '/corridas/solicitacoes';
  }
  if (normalized.includes('admin-fornecedor')) {
    return '/terceiros/motoristas';
  }
  if (normalized.includes('motorista')) {
    return '/corridas/historico';
  }
  return '/corridas/solicitacoes';
};
