export const TOMTOM_CONFIG = {
  get apiKey(): string {
    return (import.meta.env.VITE_TOMTOM_API_KEY || '').trim();
  },

  get hasKey(): boolean {
    const key = this.apiKey;
    return Boolean(key && key.length > 8 && key !== 'sua_chave_aqui');
  },

  tileLayer: {
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noopener noreferrer">TomTom</a>',
    maxZoom: 22,
  },

  fallbackTileLayer: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },

  getTileUrl(): string {
    if (!this.hasKey) {
      return this.fallbackTileLayer.url;
    }
    return `https://{s}.api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${this.apiKey}`;
  },

  getTileAttribution(): string {
    return this.hasKey ? this.tileLayer.attribution : this.fallbackTileLayer.attribution;
  },

  getTileSubdomains(): string | string[] {
    return this.hasKey ? this.tileLayer.subdomains : this.fallbackTileLayer.subdomains;
  },

  getTileMaxZoom(): number {
    return this.hasKey ? this.tileLayer.maxZoom : this.fallbackTileLayer.maxZoom;
  },

  getSearchUrl(query: string, limit = 6): string {
    return `https://api.tomtom.com/search/2/search/${encodeURIComponent(
      query
    )}.json?key=${this.apiKey}&countrySet=BR&language=pt-BR&limit=${limit}`;
  },

  getReverseGeocodeUrl(lat: number, lon: number): string {
    return `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${this.apiKey}&language=pt-BR`;
  },

  getCalculateRouteUrl(locations: string): string {
    return `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${this.apiKey}&travelMode=car&traffic=true`;
  },
};
