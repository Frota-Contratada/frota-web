import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('redirects to /login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Conteúdo Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Tela de Login')).toBeInTheDocument();
  });

  it('renders child content when user is authenticated with allowed profile', () => {
    useAuthStore.getState().login(
      { id: '99', name: 'Marina Real', email: 'marina@seara.com', profile: 'admin-master' },
      'tok',
      'ref'
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedProfiles={['admin-master']}>
                <div>Painel Logado</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Painel Logado')).toBeInTheDocument();
    expect(useAuthStore.getState().user?.name).toBe('Marina Real');
  });

  it('redirects to permitted page when user profile is not allowed', () => {
    useAuthStore.getState().login(
      { id: '50', name: 'Passageiro', email: 'pass@seara.com', profile: 'solicitante' },
      'tok',
      'ref'
    );

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route path="/corridas/solicitacoes" element={<div>Minhas Solicitações</div>} />
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute allowedProfiles={['admin-master']}>
                <div>Área Administrativa</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Minhas Solicitações')).toBeInTheDocument();
  });
});
