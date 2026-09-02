import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geoService } from '../geoService';
import { TOMTOM_CONFIG } from '../tomtomConfig';

describe('geoService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(TOMTOM_CONFIG, 'hasKey', 'get').mockReturnValue(true);
  });

  it('fetches address by CEP and geocodes coordinates via TomTom API', async () => {
    const mockViaCep = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    };

    const mockTomTom = {
      results: [
        {
          position: {
            lat: -23.561,
            lon: -46.656,
          },
        },
      ],
    };

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockViaCep,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTomTom,
      });

    const result = await geoService.buscarEnderecoPorCep('01310100');

    expect(result).not.toBeNull();
    expect(result?.logradouro).toBe('Avenida Paulista');
    expect(result?.cidade).toBe('São Paulo');
    expect(result?.latitude).toBe(-23.561);
    expect(result?.longitude).toBe(-46.656);
  });

  it('returns null for invalid CEP length', async () => {
    const result = await geoService.buscarEnderecoPorCep('123');
    expect(result).toBeNull();
  });

  it('fetches address suggestions from TomTom API', async () => {
    const mockTomTomSuggestions = {
      results: [
        {
          position: {
            lat: -26.9078,
            lon: -48.6619,
          },
          address: {
            streetName: 'Av. Marginal Oeste',
            municipalitySubdivision: 'Cordeiros',
            municipality: 'Itajaí',
            countrySubdivision: 'SC',
            postalCode: '88310-000',
            freeformAddress: 'Av. Marginal Oeste, Cordeiros, Itajaí - SC',
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTomTomSuggestions,
    });

    const results = await geoService.buscarSugestoesEndereco('Seara Itajaí');

    expect(results).toHaveLength(1);
    expect(results[0].cidade).toBe('Itajaí');
    expect(results[0].latitude).toBe(-26.9078);
  });

  it('performs reverse geocoding for coordinates via TomTom API', async () => {
    const mockTomTomReverse = {
      addresses: [
        {
          address: {
            streetName: 'Av. Paulista',
            municipalitySubdivision: 'Bela Vista',
            municipality: 'São Paulo',
            countrySubdivision: 'SP',
            postalCode: '01310-100',
            freeformAddress: 'Av. Paulista, Bela Vista, São Paulo - SP',
          },
          position: '-23.561,-46.656',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTomTomReverse,
    });

    const result = await geoService.geocodificarCoordenadas(-23.561, -46.656);

    expect(result).not.toBeNull();
    expect(result?.logradouro).toBe('Av. Paulista');
    expect(result?.bairro).toBe('Bela Vista');
    expect(result?.latitude).toBe(-23.561);
  });
});
