import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Login } from '../Login';
import { authApi } from '../../../services/auth/authApi';
import { ToastProvider } from '../../../components/common/Toast/Toast';

describe('Login page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders login form elements properly', () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument();
  });

  it('shows error message when form is submitted empty', async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ToastProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
  });

  it('navigates to /home upon successful login', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      response: {
        accessToken: 'valid-access',
        refreshToken: 'valid-refresh',
        validade: '2026-08-17T12:00:00Z',
      },
    });

    vi.spyOn(authApi, 'me').mockResolvedValue({
      response: {
        id: 1,
        nome: 'Admin Seara',
        email: 'admin@seara.com',
        cpf: '11111111111',
        dataAtivacao: new Date().toISOString(),
        perfis: [
          {
            tipoPerfil: 'admin-master',
            dataInicioVigencia: '2026-01-01T00:00:00Z',
          },
        ],
      },
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<div>Tela Home Principal</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@seara.com');
    await userEvent.type(screen.getByLabelText(/senha/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Tela Home Principal')).toBeInTheDocument();
    });
    expect(localStorage.getItem('auth_token')).toBe('valid-access');
  });
});
