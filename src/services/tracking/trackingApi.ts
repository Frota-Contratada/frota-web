import { apiClient } from '../api/apiClient';

export interface VehiclePosition {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface TrackingRoute {
  routeId?: string;
  version?: number;
  coordinates?: Array<[number, number]>;
  distanceMeters?: number;
  durationSeconds?: number;
  trafficDelaySeconds?: number;
  origin?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  stops?: Array<{ sequence: number; lat: number; lng: number; address?: string; completed?: boolean }>;
}

export interface TrackingSnapshot {
  tripId?: number | string;
  tripStatus: 'SCHEDULED' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
  waiting?: {
    active: boolean;
    startedAt?: string | null;
  };
  route?: TrackingRoute;
  vehiclePosition?: VehiclePosition;
  passengerPosition?: { lat: number; lng: number };
  driver?: {
    id: number;
    name: string;
    phone?: string;
    avatar?: string;
  };
  vehicle?: {
    id: number;
    plate: string;
    model: string;
    color?: string;
  };
  startedAt?: string;
  updatedAt?: string;
}

export const trackingApi = {
  getSnapshot(rideId: number | string) {
    return apiClient.get<{ response: TrackingSnapshot }>(`/corridas/${rideId}/tracking`);
  },

  postPositions(rideId: number | string, positions: VehiclePosition[]) {
    return apiClient.post(`/corridas/${rideId}/tracking/positions/batch`, { positions });
  },
};
