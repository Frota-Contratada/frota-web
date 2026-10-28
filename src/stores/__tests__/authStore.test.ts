import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { authApi } from '../../services/auth/authApi';
import type { User } from '../../types/auth.types';

const meAdmin = {
  response: {
    id: 1,
    nome: 'Admin Master',
    email: 'admin.master@frota.com.br',
    dataAtivacao: '2026-01-01T00:00:00.000Z',
    perfis: [{ tipoPerfil: 'admin-master', dataInicioVigencia: '2026-01-01T00:00:00.000Z' }],
  },
};

describe('authStore: sessão sem perfil no navegador', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guarda só os tokens no localStorage após o login', () => {
    useAuthStore.getState().login(
      { id: '1', name: 'Admin', email: 'admin@frota.com.br', profile: 'admin-master' },
      'access-123',
      'refresh-456'
    );

    expect(Object.keys(localStorage).sort()).toEqual(['auth_token', 'refresh_token']);
  });

  it('restaura a sessão com os perfis devolvidos pela API', async () => {
    localStorage.setItem('auth_token', 'access-123');
    vi.spyOn(authApi, 'me').mockResolvedValue(meAdmin as never);

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isRestoring).toBe(false);
    expect(state.user?.perfis?.map((p) => p.tipoPerfil)).toEqual(['admin-master']);
  });

  it('ignora o auth-storage antigo e encerra a sessão se a API recusar o token', async () => {
    localStorage.setItem('auth_token', 'adulterado');
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user: { profile: 'admin-master' }, isAuthenticated: true } })
    );
    vi.spyOn(authApi, 'me').mockRejectedValue(new Error('401'));

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth-storage')).toBeNull();
  });

  it('não chama a API sem token', async () => {
    const me = vi.spyOn(authApi, 'me');

    await useAuthStore.getState().restoreSession();

    expect(me).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isRestoring).toBe(false);
  });
});

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('updates state and localStorage on login', () => {
    const mockUser: User = {
      id: '1',
      name: 'Admin User',
      email: 'admin@seara.com',
      profile: 'admin-master',
    };

    useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(localStorage.getItem('auth_token')).toBe('access-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-456');
  });

  it('clears state and localStorage on logout', () => {
    const mockUser: User = {
      id: '1',
      name: 'Admin User',
      email: 'admin@seara.com',
      profile: 'admin-master',
    };

    useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('manages loading and error states', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setError('Erro de conexão');
    expect(useAuthStore.getState().error).toBe('Erro de conexão');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
