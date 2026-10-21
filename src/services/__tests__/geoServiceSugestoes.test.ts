import { describe, it, expect, vi, afterEach } from 'vitest';
import { geoService } from '../maps/geoService';

const respostaJson = (corpo: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) } as Response);

const photonComResultado = {
  features: [
    {
      geometry: { coordinates: [-51.36, -23.31] },
      properties: {
        country: 'Brasil',
        street: 'Avenida Presidente Vargas',
        housenumber: '100',
        district: 'Centro',
        city: 'Rolândia',
        state: 'Paraná',
        postcode: '86600-000',
      },
    },
  ],
};

describe('geoService.buscarSugestoesEndereco', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('usa o Photon primeiro e não consome a cota da TomTom', async () => {
    vi.stubEnv('VITE_TOMTOM_API_KEY', 'chave-de-teste-tomtom');
    const fetchMock = vi.fn((url: string) =>
      url.includes('photon.komoot.io') ? respostaJson(photonComResultado) : respostaJson({}),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const sugestoes = await geoService.buscarSugestoesEndereco('Avenida Presidente Vargas 100');

    expect(sugestoes[0]).toMatchObject({ cidade: 'Rolândia', latitude: -23.31, longitude: -51.36 });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('tomtom.com'))).toBe(false);
  });

  it('reaproveita a mesma busca sem nova chamada externa', async () => {
    const fetchMock = vi.fn(() => respostaJson(photonComResultado));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await geoService.buscarSugestoesEndereco('Rua do Cache 10');
    await geoService.buscarSugestoesEndereco('rua do cache 10');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('recorre à TomTom só quando as fontes gratuitas não encontram nada', async () => {
    vi.stubEnv('VITE_TOMTOM_API_KEY', 'chave-de-teste-tomtom');
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('photon.komoot.io')) return respostaJson({ features: [] });
      if (url.includes('nominatim')) return respostaJson([]);
      return respostaJson({
        results: [
          {
            position: { lat: -23.3, lon: -51.37 },
            address: { freeformAddress: 'Rua Rara, Rolândia', municipality: 'Rolândia' },
          },
        ],
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const sugestoes = await geoService.buscarSugestoesEndereco('Rua Rara sem resultado');

    expect(sugestoes[0]).toMatchObject({ displayName: 'Rua Rara, Rolândia' });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('photon.komoot.io'),
      expect.stringContaining('nominatim'),
      expect.stringContaining('tomtom.com'),
    ]);
  });
});
