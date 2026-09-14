import { apiClient } from '../api/apiClient';

export interface TrackingPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface RouteWaypoint {
  id: string;
  sequence: number;
  kind: 'origin' | 'stop' | 'destination';
  label: string;
  lat: number;
  lng: number;
}

export interface TrafficSection {
  startIndex: number;
  endIndex: number;
  delaySeconds: number;
  category: string;
}

export interface RouteInstruction {
  id: string;
  instruction: string;
  streetName: string;
  distanceMeters: number;
  durationSeconds: number;
  type: string;
  modifier: string | null;
  icon: string | null;
  location: { lat: number; lng: number };
  coordinateIndex: number;
}

export interface CanonicalRoute {
  routeId: string;
  version: number;
  calculatedAt: string;
  origin: RouteWaypoint;
  stops: RouteWaypoint[];
  destination: RouteWaypoint;
  coordinates: Array<{ lat: number; lng: number }>;
  distanceMeters: number;
  durationSeconds: number;
  trafficDelaySeconds: number;
  trafficSections: TrafficSection[];
  instructions: RouteInstruction[];
}

export interface TrackingWaiting {
  active: boolean;
  startedAt: string | null;
}

export interface TrackingSnapshot {
  tripStatus: 'scheduled' | 'in_progress' | 'finished' | 'canceled' | string;
  waiting: TrackingWaiting;
  route: CanonicalRoute;
  vehiclePosition: TrackingPosition | null;
  passengerPosition: TrackingPosition | null;
  driver: {
    id: string | number;
    displayName: string;
  };
  vehicle: {
    id: string | number;
    plate: string;
    description?: string;
  };
  startedAt: string;
  updatedAt: string;
}

export const trackingApi = {
  /**
   * Obtém o snapshot autoritativo da corrida (GET /corridas/:id/tracking)
   */
  getSnapshot(rideId: number | string) {
    return apiClient.get<{ response: TrackingSnapshot }>(`/corridas/${rideId}/tracking`);
  },

  /**
   * Persiste lote de posições do veículo (POST /corridas/:id/tracking/positions/batch)
   */
  postPositions(rideId: number | string, positions: TrackingPosition[]) {
    return apiClient.post<{ response: { accepted: TrackingPosition | null } }>(
      `/corridas/${rideId}/tracking/positions/batch`,
      { positions }
    );
  },

  /**
   * Atualiza posição do passageiro (POST /corridas/:id/tracking/passenger-position)
   */
  postPassengerPosition(rideId: number | string, position: TrackingPosition) {
    return apiClient.post<{ response: { accepted: TrackingPosition | null } }>(
      `/corridas/${rideId}/tracking/passenger-position`,
      position
    );
  },

  /**
   * Inicia espera do motorista (POST /corridas/:id/waiting/start)
   */
  startWaiting(rideId: number | string, idempotencyKey: string = crypto.randomUUID()) {
    return apiClient.post<{ response: TrackingWaiting }>(
      `/corridas/${rideId}/waiting/start`,
      {},
      { headers: { 'idempotency-key': idempotencyKey } }
    );
  },

  /**
   * Retoma corrida após espera (POST /corridas/:id/waiting/resume)
   */
  resumeWaiting(rideId: number | string, idempotencyKey: string = crypto.randomUUID()) {
    return apiClient.post<{ response: TrackingWaiting }>(
      `/corridas/${rideId}/waiting/resume`,
      {},
      { headers: { 'idempotency-key': idempotencyKey } }
    );
  },

  /**
   * Conclui a corrida (POST /corridas/:id/finish)
   */
  finishTrip(rideId: number | string, idempotencyKey: string = crypto.randomUUID()) {
    return apiClient.post<{ response: { tripStatus: 'finished'; finishedAt: string } }>(
      `/corridas/${rideId}/finish`,
      {},
      { headers: { 'idempotency-key': idempotencyKey } }
    );
  },

  /**
   * Solicita recálculo da rota com base no desvio (POST /corridas/:id/route/reroute)
   */
  reroute(rideId: number | string, position: TrackingPosition, idempotencyKey: string = crypto.randomUUID()) {
    return apiClient.post<{ response: CanonicalRoute }>(
      `/corridas/${rideId}/route/reroute`,
      { position },
      { headers: { 'idempotency-key': idempotencyKey } }
    );
  },
};

