import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TwoFactor } from '../TwoFactor';
import { authApi } from '../../../services/auth/authApi';
import { ToastProvider } from '../../../components/common/Toast/Toast';

describe('TwoFactor page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_email', 'admin@seara.com');
    localStorage.setItem('auth_token', 'token-123');
    localStorage.setItem('refresh_token', 'refresh-123');
  });

  it('renders 6 digit inputs for verification code', () => {
    vi.spyOn(authApi, 'pinEnviar').mockResolvedValue(undefined);

    render(
      <ToastProvider>
        <MemoryRouter>
          <TwoFactor />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(screen.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dígito 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Dígito 6')).toBeInTheDocument();
  });

  it('submits code, fetches current user and navigates to /visao-executiva', async () => {
    vi.spyOn(authApi, 'pinEnviar').mockResolvedValue(undefined);
    vi.spyOn(authApi, 'pinConfirmar').mockResolvedValue({
      response: { token: 'validated' },
    });
    vi.spyOn(authApi, 'me').mockResolvedValue({
      response: {
        id: 1,
        nome: 'Admin Seara',
        email: 'admin@seara.com',
        dataAtivacao: '2026-01-01',
        perfis: [{ tipoPerfil: 'admin-master', dataInicioVigencia: '2026-01-01' }],
      },
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/two-factor']}>
          <Routes>
            <Route path="/two-factor" element={<TwoFactor />} />
            <Route path="/visao-executiva" element={<div>Visão Executiva Principal</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    for (let i = 1; i <= 6; i++) {
      await userEvent.type(screen.getByLabelText(`Dígito ${i}`), String(i));
    }

    await userEvent.click(screen.getByRole('button', { name: 'Verificar código' }));

    await waitFor(() => {
      expect(screen.getByText('Visão Executiva Principal')).toBeInTheDocument();
    });
  });
});
