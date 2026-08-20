import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from '../user/userApi';
import { apiClient } from '../api/apiClient';

describe('userApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls getMe and returns current user info', async () => {
    const mockUserMe = {
      response: {
        id: 10,
        nome: 'Marina Oliveira',
        email: 'marina@seara.com',
        cpf: '12345678900',
        dataAtivacao: '2026-01-01',
        fotoPerfil: 'fotos/marina.png',
        perfis: [
          {
            tipoPerfil: 'aprovador',
            dataInicioVigencia: '2026-01-01',
          },
        ],
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockUserMe);

    const result = await userApi.getMe();

    expect(getSpy).toHaveBeenCalledWith('/usuario/info/me');
    expect(result.response.id).toBe(10);
    expect(result.response.perfis[0].tipoPerfil).toBe('aprovador');
  });

  it('calls updateFotoPerfil with FormData containing foto', async () => {
    const mockResponse = {
      response: {
        id: 10,
        nome: 'Marina Oliveira',
        email: 'marina@seara.com',
        dataAtivacao: '2026-01-01',
        fotoPerfil: 'fotos/nova-foto.png',
        perfis: [],
      },
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

    const file = new File(['dummy content'], 'avatar.jpg', { type: 'image/jpeg' });
    const result = await userApi.updateFotoPerfil(file);

    expect(patchSpy).toHaveBeenCalledWith('/usuario/info/me/foto', expect.any(FormData));
    const formDataArg = patchSpy.mock.calls[0][1] as FormData;
    expect(formDataArg.get('foto')).toBe(file);
    expect(result.response.fotoPerfil).toBe('fotos/nova-foto.png');
  });
});
