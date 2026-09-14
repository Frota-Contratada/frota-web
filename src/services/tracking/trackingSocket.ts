import { io, Socket } from 'socket.io-client';
import type { TrackingPosition, CanonicalRoute, TrackingWaiting } from './trackingApi';

export type TrackingEventType =
  | 'vehicle.location'
  | 'passenger.location'
  | 'route.replaced'
  | 'waiting.changed'
  | 'trip.statusChanged';

export interface TrackingEnvelope<T = unknown> {
  schemaVersion: number;
  type: TrackingEventType;
  eventId: string;
  tripId: string;
  sentAt: string;
  payload: T;
}

export interface TrackingSocketCallbacks {
  onVehicleLocation?: (position: TrackingPosition) => void;
  onPassengerLocation?: (position: TrackingPosition) => void;
  onRouteReplaced?: (route: CanonicalRoute) => void;
  onWaitingChanged?: (waiting: TrackingWaiting) => void;
  onTripStatusChanged?: (status: { tripStatus: string }) => void;
  onRawEvent?: (envelope: TrackingEnvelope) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const getWsUrl = (): string => {
  const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return wsUrl.replace(/\/+$/, '');
};

export class TrackingSocketClient {
  private socket: Socket | null = null;
  private tripId: number | string | null = null;
  private role: 'passenger' | 'driver' = 'passenger';
  private callbacks: TrackingSocketCallbacks = {};

  constructor(callbacks: TrackingSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: TrackingSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  connect(tripId: number | string, role: 'passenger' | 'driver' = 'passenger'): void {
    this.tripId = tripId;
    this.role = role;

    if (this.socket) {
      this.disconnect();
    }

    const token = localStorage.getItem('auth_token');
    const wsUrl = getWsUrl();

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      auth: token ? { token } : undefined,
    });

    this.socket.on('connect', () => {
      this.callbacks.onConnect?.();
      if (this.tripId) {
        this.socket?.emit('trip.join', {
          tripId: Number(this.tripId),
          role: this.role,
        });
      }
    });

    this.socket.on('trip.joined', () => {
      // Ingresso confirmado no canal da corrida
    });

    this.socket.on('trip.event', (envelope: TrackingEnvelope) => {
      this.callbacks.onRawEvent?.(envelope);

      switch (envelope.type) {
        case 'vehicle.location':
          this.callbacks.onVehicleLocation?.(envelope.payload as TrackingPosition);
          break;
        case 'passenger.location':
          this.callbacks.onPassengerLocation?.(envelope.payload as TrackingPosition);
          break;
        case 'route.replaced':
          this.callbacks.onRouteReplaced?.(envelope.payload as CanonicalRoute);
          break;
        case 'waiting.changed':
          this.callbacks.onWaitingChanged?.(envelope.payload as TrackingWaiting);
          break;
        case 'trip.statusChanged':
          this.callbacks.onTripStatusChanged?.(envelope.payload as { tripStatus: string });
          break;
      }
    });

    this.socket.on('disconnect', () => {
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (err) => {
      this.callbacks.onError?.(err);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.tripId = null;
  }
}
