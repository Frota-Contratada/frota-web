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

export const geoService = {
  
  async buscarEnderecoPorCep(cep: string): Promise<EnderecoDetalhado | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!viaCepRes.ok) return null;
      const viaCepData = await viaCepRes.json();
      if (viaCepData.erro) return null;


      const query = `${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
      const coords = await this.geocodificarTexto(query, viaCepData.localidade, viaCepData.uf);

      return {
        cep: cleanCep,
        logradouro: viaCepData.logradouro || '',
        bairro: viaCepData.bairro || '',
        cidade: viaCepData.localidade || '',
        uf: viaCepData.uf || '',
        latitude: coords?.latitude ?? -23.55052,
        longitude: coords?.longitude ?? -46.633308,
      };
    } catch {
      return null;
    }
  },

  
  async buscarSugestoesEndereco(query: string): Promise<SugestaoEndereco[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=br&addressdetails=1&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });
      if (!res.ok) return [];

      interface NominatimItem {
        display_name: string;
        lat: string;
        lon: string;
        address?: {
          road?: string;
          suburb?: string;
          city?: string;
          town?: string;
          state?: string;
          postcode?: string;
        };
      }

      const data: NominatimItem[] = await res.json();
      return data.map((item) => ({
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        logradouro: item.address?.road,
        bairro: item.address?.suburb,
        cidade: item.address?.city || item.address?.town,
        uf: item.address?.state,
        cep: item.address?.postcode?.replace(/\D/g, ''),
      }));
    } catch {
      return [];
    }
  },

  
  async geocodificarTexto(
    query: string,
    cidadeFallback?: string,
    ufFallback?: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=br&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
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
