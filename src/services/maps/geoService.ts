import { TOMTOM_CONFIG } from './tomtomConfig';

export interface EnderecoDetalhado {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  displayName?: string;
}

export interface SugestaoEndereco {
  displayName: string;
  latitude: number;
  longitude: number;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

interface TomTomSearchResult {
  type?: string;
  id?: string;
  address?: {
    streetNumber?: string;
    streetName?: string;
    municipalitySubdivision?: string;
    municipality?: string;
    countrySecondarySubdivision?: string;
    countrySubdivision?: string;
    postalCode?: string;
    countryCode?: string;
    country?: string;
    freeformAddress?: string;
  };
  position?: {
    lat: number;
    lon: number;
  };
}

interface TomTomSearchResponse {
  results?: TomTomSearchResult[];
}

interface TomTomReverseGeocodeResponse {
  addresses?: Array<{
    address?: {
      streetNumber?: string;
      streetName?: string;
      municipalitySubdivision?: string;
      municipality?: string;
      countrySubdivision?: string;
      postalCode?: string;
      freeformAddress?: string;
    };
    position?: string | { lat: number; lon: number };
  }>;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export const geoService = {
  async buscarEnderecoPorCep(cep: string): Promise<EnderecoDetalhado | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!viaCepRes.ok) return null;
      const viaCepData = await viaCepRes.json();
      if (viaCepData.erro) return null;

      const query = [
        viaCepData.logradouro,
        viaCepData.bairro,
        viaCepData.localidade,
        viaCepData.uf,
        'Brasil',
      ]
        .filter(Boolean)
        .join(', ');

      const coords = await this.geocodificarTexto(query, viaCepData.localidade, viaCepData.uf);

      return {
        cep: cleanCep,
        logradouro: viaCepData.logradouro || '',
        bairro: viaCepData.bairro || '',
        cidade: viaCepData.localidade || '',
        uf: viaCepData.uf || '',
        latitude: coords?.latitude ?? -23.55052,
        longitude: coords?.longitude ?? -46.633308,
        displayName: query,
      };
    } catch {
      return null;
    }
  },

  async buscarSugestoesEndereco(query: string): Promise<SugestaoEndereco[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim();

    const cepMatch = cleanQuery.replace(/\D/g, '');
    if (cepMatch.length === 8) {
      const cepResult = await this.buscarEnderecoPorCep(cepMatch);
      if (cepResult) {
        return [
          {
            displayName:
              cepResult.displayName ||
              `${cepResult.logradouro}, ${cepResult.bairro}, ${cepResult.cidade} - ${cepResult.uf}`,
            latitude: cepResult.latitude,
            longitude: cepResult.longitude,
            logradouro: cepResult.logradouro,
            bairro: cepResult.bairro,
            cidade: cepResult.cidade,
            uf: cepResult.uf,
            cep: cepResult.cep,
          },
        ];
      }
    }

    if (TOMTOM_CONFIG.hasKey) {
      try {
        const tomtomUrl = TOMTOM_CONFIG.getSearchUrl(cleanQuery, 6);
        const res = await fetch(tomtomUrl);

        if (res.ok) {
          const data: TomTomSearchResponse = await res.json();
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            return data.results
              .filter((item) => item.position && typeof item.position.lat === 'number')
              .map((item) => {
                const addr = item.address || {};
                const road = addr.streetName || addr.freeformAddress?.split(',')[0] || '';
                const num = addr.streetNumber ? `, ${addr.streetNumber}` : '';
                const neighborhood = addr.municipalitySubdivision
                  ? ` - ${addr.municipalitySubdivision}`
                  : '';
                const city = addr.municipality || addr.countrySecondarySubdivision || '';
                const state = addr.countrySubdivision ? ` - ${addr.countrySubdivision}` : '';

                const formatted =
                  addr.freeformAddress ||
                  (road ? `${road}${num}${neighborhood}, ${city}${state}` : 'Endereço encontrado');

                return {
                  displayName: formatted,
                  latitude: item.position!.lat,
                  longitude: item.position!.lon,
                  logradouro: addr.streetName || road,
                  bairro: addr.municipalitySubdivision,
                  cidade: city,
                  uf: addr.countrySubdivision,
                  cep: addr.postalCode?.replace(/\D/g, ''),
                };
              });
          }
        }
      } catch {
        
      }
    }

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery
      )}&countrycodes=br&addressdetails=1&limit=6`;

      const res = await fetch(nominatimUrl, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.street || '';
            const num = addr.house_number ? `, ${addr.house_number}` : '';
            const neighborhood =
              addr.suburb || addr.neighbourhood || addr.city_district
                ? ` - ${addr.suburb || addr.neighbourhood || addr.city_district}`
                : '';
            const city = addr.city || addr.town || addr.municipality || '';
            const state = addr.state ? ` - ${addr.state}` : '';

            const formatted = road
              ? `${road}${num}${neighborhood}, ${city}${state}`
              : item.display_name;

            return {
              displayName: formatted,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              logradouro: road,
              bairro: addr.suburb || addr.neighbourhood || addr.city_district,
              cidade: city,
              uf: addr.state,
              cep: addr.postcode?.replace(/\D/g, ''),
            };
          });
        }
      }
    } catch {
      
    }

    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        cleanQuery
      )}&limit=6&lang=default&bbox=-73.98,-33.75,-34.79,5.27`;

      const photonRes = await fetch(photonUrl);
      if (photonRes.ok) {
        const data: { features?: PhotonFeature[] } = await photonRes.json();
        if (data.features && data.features.length > 0) {
          return data.features
            .filter((f) => f.properties.country === 'Brazil' || f.properties.country === 'Brasil' || !f.properties.country)
            .map((f) => {
              const p = f.properties;
              const street = p.street || p.name || '';
              const number = p.housenumber ? `, ${p.housenumber}` : '';
              const district = p.district ? ` - ${p.district}` : '';
              const city = p.city || '';
              const state = p.state ? ` - ${p.state}` : '';

              const formattedDisplay = `${street}${number}${district}, ${city}${state}`.replace(/^,\s*/, '');

              return {
                displayName: formattedDisplay || street || 'Endereço encontrado',
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0],
                logradouro: p.street || p.name,
                bairro: p.district,
                cidade: p.city,
                uf: p.state,
                cep: p.postcode?.replace(/\D/g, ''),
              };
            });
        }
      }
    } catch {
      
    }

    return [];
  },

  async geocodificarTexto(
    query: string,
    cidadeFallback?: string,
    ufFallback?: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    if (TOMTOM_CONFIG.hasKey) {
      try {
        const tomtomUrl = TOMTOM_CONFIG.getSearchUrl(query, 1);
        const res = await fetch(tomtomUrl);

        if (res.ok) {
          const data: TomTomSearchResponse = await res.json();
          if (data.results && data.results.length > 0 && data.results[0].position) {
            return {
              latitude: data.results[0].position.lat,
              longitude: data.results[0].position.lon,
            };
          }
        }

        if (cidadeFallback && ufFallback) {
          const fallbackQuery = `${cidadeFallback}, ${ufFallback}, Brasil`;
          const fallbackUrl = TOMTOM_CONFIG.getSearchUrl(fallbackQuery, 1);
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const fallbackData: TomTomSearchResponse = await fallbackRes.json();
            if (fallbackData.results && fallbackData.results.length > 0 && fallbackData.results[0].position) {
              return {
                latitude: fallbackData.results[0].position.lat,
                longitude: fallbackData.results[0].position.lon,
              };
            }
          }
        }
      } catch {
        
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=br&limit=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        }
      }

      if (cidadeFallback && ufFallback) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(
          cidadeFallback
        )}&state=${encodeURIComponent(ufFallback)}&country=Brasil&limit=1`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.length > 0) {
            return {
              latitude: parseFloat(fallbackData[0].lat),
              longitude: parseFloat(fallbackData[0].lon),
            };
          }
        }
      }
    } catch {
      
    }

    return null;
  },

  async geocodificarCoordenadas(
    lat: number,
    lng: number
  ): Promise<EnderecoDetalhado | null> {
    if (TOMTOM_CONFIG.hasKey) {
      try {
        const tomtomUrl = TOMTOM_CONFIG.getReverseGeocodeUrl(lat, lng);
        const res = await fetch(tomtomUrl);

        if (res.ok) {
          const data: TomTomReverseGeocodeResponse = await res.json();
          if (data.addresses && data.addresses.length > 0) {
            const item = data.addresses[0];
            const addr = item.address || {};
            return {
              cep: (addr.postalCode || '').replace(/\D/g, ''),
              logradouro: addr.streetName || '',
              bairro: addr.municipalitySubdivision || '',
              cidade: addr.municipality || '',
              uf: addr.countrySubdivision || '',
              latitude: lat,
              longitude: lng,
              displayName: addr.freeformAddress || `${addr.streetName}, ${addr.municipality}`,
            };
          }
        }
      } catch {
        
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data.address || {};

      return {
        cep: (addr.postcode || '').replace(/\D/g, ''),
        logradouro: addr.road || addr.street || '',
        bairro: addr.suburb || addr.neighbourhood || '',
        cidade: addr.city || addr.town || addr.municipality || '',
        uf: addr.state_code || addr.state || '',
        latitude: lat,
        longitude: lng,
        displayName: data.display_name,
      };
    } catch {
      return null;
    }
  },
};
