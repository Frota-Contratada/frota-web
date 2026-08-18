import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geoService } from '../geoService';

describe('geoService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches address by CEP and geocodes coordinates', async () => {
    const mockViaCep = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    };

    const mockNominatim = [
      {
        lat: '-23.561',
        lon: '-46.656',
        display_name: 'Avenida Paulista, São Paulo, SP, Brasil',
      },
    ];

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockViaCep,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNominatim,
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

  it('fetches address suggestions from Nominatim', async () => {
    const mockSuggestions = [
      {
        display_name: 'Seara Alimentos, Itajaí, SC, Brasil',
        lat: '-26.9078',
        lon: '-48.6619',
        address: {
          road: 'Av. Marginal Oeste',
          suburb: 'Cordeiros',
          city: 'Itajaí',
          state: 'SC',
          postcode: '88310-000',
        },
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSuggestions,
    });

    const results = await geoService.buscarSugestoesEndereco('Seara Itajaí');

    expect(results).toHaveLength(1);
    expect(results[0].cidade).toBe('Itajaí');
    expect(results[0].latitude).toBe(-26.9078);
  });

  it('performs reverse geocoding for coordinates', async () => {
    const mockReverse = {
      display_name: 'Av. Paulista, Bela Vista, São Paulo, SP, Brasil',
      address: {
        road: 'Av. Paulista',
        suburb: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01310-100',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReverse,
    });

    const result = await geoService.geocodificarCoordenadas(-23.561, -46.656);

    expect(result).not.toBeNull();
    expect(result?.logradouro).toBe('Av. Paulista');
    expect(result?.bairro).toBe('Bela Vista');
    expect(result?.latitude).toBe(-23.561);
  });
});
