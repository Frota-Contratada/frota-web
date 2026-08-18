import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { useAuthStore } from '../../stores/authStore';

describe('usePermissions', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('returns all permissions false when user is not authenticated', () => {
    const { result } = renderHook(() => usePermissions());

    expect(result.current.profile).toBeUndefined();
    expect(result.current.can('rides:read')).toBe(false);
    expect(result.current.isAdminMaster).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isApprover).toBe(false);
    expect(result.current.isSupplier).toBe(false);
  });

  it('grants full permissions to admin-master profile', () => {
    useAuthStore.getState().login(
      { id: '1', name: 'Master Admin', email: 'master@seara.com', profile: 'admin-master' },
      'tok',
      'ref'
    );

    const { result } = renderHook(() => usePermissions());

    expect(result.current.profile).toBe('admin-master');
    expect(result.current.isAdminMaster).toBe(true);
    expect(result.current.can('rides:create')).toBe(true);
    expect(result.current.can('branches:manage')).toBe(true);
    expect(result.current.can('users:manage')).toBe(true);
    expect(result.current.can('settings:manage')).toBe(true);
  });

  it('restricts permissions appropriately for fornecedor profile', () => {
    useAuthStore.getState().login(
      { id: '2', name: 'Fornecedor User', email: 'fornecedor@prime.com', profile: 'fornecedor' },
      'tok',
      'ref'
    );

    const { result } = renderHook(() => usePermissions());

    expect(result.current.profile).toBe('fornecedor');
    expect(result.current.isSupplier).toBe(true);
    expect(result.current.isAdminMaster).toBe(false);
    expect(result.current.can('rides:read')).toBe(true);
    expect(result.current.can('rides:execute')).toBe(true);
    expect(result.current.can('branches:manage')).toBe(false);
    expect(result.current.can('users:manage')).toBe(false);
  });

  it('allows aprovador profile to review and approve rides', () => {
    useAuthStore.getState().login(
      { id: '3', name: 'Aprovador User', email: 'aprovador@seara.com', profile: 'aprovador' },
      'tok',
      'ref'
    );

    const { result } = renderHook(() => usePermissions());

    expect(result.current.profile).toBe('aprovador');
    expect(result.current.isApprover).toBe(true);
    expect(result.current.can('rides:review')).toBe(true);
    expect(result.current.can('rides:approve')).toBe(true);
    expect(result.current.can('rides:reject')).toBe(true);
    expect(result.current.can('users:manage')).toBe(false);
  });
});
