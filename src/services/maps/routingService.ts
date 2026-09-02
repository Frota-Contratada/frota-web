import { TOMTOM_CONFIG } from './tomtomConfig';

export interface RoutePoint {
  lat: number;
  lng: number;
  label?: string;
  type?: 'origin' | 'destination' | 'stop';
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: Array<[number, number]>;
  summary?: string;
}

interface TomTomRouteResponse {
  routes?: Array<{
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
      trafficDelayInSeconds?: number;
    };
    legs?: Array<{
      summary?: {
        lengthInMeters: number;
        travelTimeInSeconds: number;
      };
      points?: Array<{
        latitude: number;
        longitude: number;
      }>;
    }>;
  }>;
}

export const routingService = {
  async calcularRota(pontos: RoutePoint[]): Promise<RouteResult> {
    if (pontos.length < 2) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        coordinates: pontos.map((p) => [p.lat, p.lng]),
      };
    }

    if (TOMTOM_CONFIG.hasKey) {
      try {
        const locations = pontos.map((p) => `${p.lat},${p.lng}`).join(':');
        const url = TOMTOM_CONFIG.getCalculateRouteUrl(locations);

        const res = await fetch(url);
        if (res.ok) {
          const data: TomTomRouteResponse = await res.json();
          if (data.routes && data.routes.length > 0) {
            const primaryRoute = data.routes[0];
            const distanceKm = Math.round((primaryRoute.summary.lengthInMeters / 1000) * 10) / 10;
            const durationMinutes = Math.round(primaryRoute.summary.travelTimeInSeconds / 60);

            const coordinates: Array<[number, number]> = [];
            if (primaryRoute.legs && Array.isArray(primaryRoute.legs)) {
              primaryRoute.legs.forEach((leg) => {
                if (leg.points && Array.isArray(leg.points)) {
                  leg.points.forEach((pt) => {
                    coordinates.push([pt.latitude, pt.longitude]);
                  });
                }
              });
            }

            return {
              distanceKm,
              durationMinutes,
              coordinates: coordinates.length > 0 ? coordinates : pontos.map((p) => [p.lat, p.lng]),
            };
          }
        }
      } catch {
        
      }
    }

    try {
      const coordsString = pontos.map((p) => `${p.lng},${p.lat}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl);
      if (res.ok) {
        interface OsrmResponse {
          routes?: Array<{
            distance: number;
            duration: number;
            geometry?: {
              coordinates: Array<[number, number]>;
            };
          }>;
        }

        const data: OsrmResponse = await res.json();
        if (data.routes && data.routes.length > 0) {
          const primaryRoute = data.routes[0];
          const distanceKm = Math.round((primaryRoute.distance / 1000) * 10) / 10;
          const durationMinutes = Math.round(primaryRoute.duration / 60);

          const coordinates: Array<[number, number]> = (primaryRoute.geometry?.coordinates || []).map(
            ([lng, lat]) => [lat, lng]
          );

          return {
            distanceKm,
            durationMinutes,
            coordinates: coordinates.length > 0 ? coordinates : pontos.map((p) => [p.lat, p.lng]),
          };
        }
      }
    } catch {
      
    }

    return this.calcularDistanciaFallback(pontos);
  },

  calcularDistanciaFallback(pontos: RoutePoint[]): RouteResult {
    let totalDistKm = 0;
    const R = 6371;

    for (let i = 0; i < pontos.length - 1; i++) {
      const p1 = pontos[i];
      const p2 = pontos[i + 1];

      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
          Math.cos((p2.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistKm += R * c;
    }

    const distanceKm = Math.round(totalDistKm * 1.25 * 10) / 10;
    const durationMinutes = Math.max(1, Math.round((distanceKm / 40) * 60));

    return {
      distanceKm,
      durationMinutes,
      coordinates: pontos.map((p) => [p.lat, p.lng]),
    };
  },
};
