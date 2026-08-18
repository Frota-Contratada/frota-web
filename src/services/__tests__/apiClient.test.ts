import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../api/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('performs a successful GET request and returns JSON', async () => {
    const mockData = { id: 1, name: 'Test' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await apiClient.get<typeof mockData>('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('attaches Authorization Bearer token when token is in localStorage', async () => {
    localStorage.setItem('auth_token', 'my-jwt-token');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await apiClient.get('/protected-route');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/protected-route'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      })
    );
  });

  it('omits Authorization Bearer token when skipAuth is true', async () => {
    localStorage.setItem('auth_token', 'my-jwt-token');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await apiClient.get('/public-route', { skipAuth: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/public-route'),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      })
    );
  });

  it('serializes query parameters correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [],
    });

    await apiClient.get('/items', {
      query: {
        search: 'teste',
        page: 2,
        active: true,
        tags: ['a', 'b'],
      },
    });

    const calledUrl = (fetch as unknown as { mock: { calls: [string][] } }).mock.calls[0][0];
    expect(calledUrl).toContain('search=teste');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('active=true');
    expect(calledUrl).toContain('tags=a');
    expect(calledUrl).toContain('tags=b');
  });

  it('handles 204 No Content response gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await apiClient.delete('/items/1');
    expect(result).toBeNull();
  });

  it('throws ApiError when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Dados inválidos' }),
    });

    await expect(apiClient.post('/invalid', {})).rejects.toThrow(ApiError);
    await expect(apiClient.post('/invalid', {})).rejects.toMatchObject({
      message: 'Dados inválidos',
      status: 400,
    });
  });

  it('sends FormData properly without Content-Type header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ uploaded: true }),
    });

    const formData = new FormData();
    formData.append('foto', new Blob(['test']), 'photo.png');

    await apiClient.patch('/upload', formData);

    const callArgs = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1];
    expect(callArgs.body).toBe(formData);
    expect(callArgs.headers).not.toHaveProperty('Content-Type');
  });

  it('silently refreshes expired access token on 401 and retries original request', async () => {
    localStorage.setItem('auth_token', 'expired-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    const fetchMock = vi.fn()

      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Token de acesso inválido.' }),
      })

      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          response: {
            accessToken: 'brand-new-access-token',
            refreshToken: 'brand-new-refresh-token',
            validade: '2026-08-18T12:00:00Z',
          },
        }),
      })

      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'sucesso pós-refresh' }),
      });

    globalThis.fetch = fetchMock;

    const result = await apiClient.get<{ data: string }>('/protected-data');

    expect(result).toEqual({ data: 'sucesso pós-refresh' });
    expect(localStorage.getItem('auth_token')).toBe('brand-new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('brand-new-refresh-token');
  });
});
