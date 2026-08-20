import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../auth/authApi';
import { apiClient } from '../api/apiClient';

describe('authApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls login with correct endpoint and payload', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        validade: '2026-08-17T12:00:00Z',
      },
    });

    const credentials = { email: 'user@test.com', senha: 'password123', plataforma: 'WEB' as const };
    const result = await authApi.login(credentials);

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/login', credentials, { skipAuth: true });
    expect(result.response.accessToken).toBe('access-token');
  });

  it('calls refresh with refreshToken', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        validade: '2026-08-17T13:00:00Z',
      },
    });

    const result = await authApi.refresh({ refreshToken: 'old-refresh-token' });

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/refresh', { refreshToken: 'old-refresh-token' }, { skipAuth: true });
    expect(result.response.accessToken).toBe('new-access-token');
  });

  it('calls signUp with token and senha', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    await authApi.signUp({ token: 'temp-token', senha: 'new-password' });

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/sign-up', { token: 'temp-token', senha: 'new-password' }, { skipAuth: true });
  });

  it('calls redefinirSenha with token and senha', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    await authApi.redefinirSenha({ token: 'reset-token', senha: 'new-password' });

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/redefinir-senha', { token: 'reset-token', senha: 'new-password' }, { skipAuth: true });
  });

  it('calls pinEnviar with email and tipoToken', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    await authApi.pinEnviar({ email: 'user@test.com', tipoToken: 'SIGN_UP' });

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/pin/enviar', { email: 'user@test.com', tipoToken: 'SIGN_UP' }, { skipAuth: true });
  });

  it('calls pinConfirmar with pin, email and tipoToken', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      response: { token: 'validated-token' },
    });

    const result = await authApi.pinConfirmar({ pin: '123456', email: 'user@test.com', tipoToken: 'SIGN_UP' });

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/pin/confirmar', { pin: '123456', email: 'user@test.com', tipoToken: 'SIGN_UP' }, { skipAuth: true });
    expect(result.response.token).toBe('validated-token');
  });

  it('calls verificarPrimeiroAcesso with encoded email', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: { primeiroAcesso: true },
    });

    const result = await authApi.verificarPrimeiroAcesso('user+test@test.com');

    expect(getSpy).toHaveBeenCalledWith('/autenticacao/primeiro-acesso/user%2Btest%40test.com', { skipAuth: true });
    expect(result.response.primeiroAcesso).toBe(true);
  });

  it('calls me to fetch current user profile', async () => {
    const mockUserMe = {
      id: 1,
      nome: 'Admin User',
      email: 'admin@seara.com',
      dataAtivacao: '2026-01-01',
      perfis: [{ tipoPerfil: 'admin-master', dataInicioVigencia: '2026-01-01' }],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      response: mockUserMe,
    });

    const result = await authApi.me();

    expect(getSpy).toHaveBeenCalledWith('/usuario/info/me');
    expect(result.response.nome).toBe('Admin User');
  });

  it('calls logout', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    await authApi.logout();

    expect(postSpy).toHaveBeenCalledWith('/autenticacao/logout');
  });
});
