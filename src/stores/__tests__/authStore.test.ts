import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '../../types/auth.types';

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
