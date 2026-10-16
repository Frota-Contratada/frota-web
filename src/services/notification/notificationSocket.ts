import { io, Socket } from 'socket.io-client';
import type { NotificacaoDto } from './notificationApi';

export interface NotificationSocketCallbacks {
  onNotificationCreated?: (notificacao: NotificacaoDto) => void;
  onNotificationRemoved?: (notificacaoId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const getWsUrl = (): string => {
  const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL;
  return new URL(wsUrl || 'http://localhost:3000', window.location.origin)
    .toString()
    .replace(/\/+$/, '');
};

export class NotificationSocketClient {
  private socket: Socket | null = null;
  private callbacks: NotificationSocketCallbacks = {};

  constructor(callbacks: NotificationSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: NotificationSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  connect(token?: string | null): void {
    if (this.socket) {
      this.disconnect();
    }

    const authToken = token || localStorage.getItem('token') || localStorage.getItem('access_token');
    const baseUrl = getWsUrl();
    this.socket = io(`${baseUrl}/notificacoes`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      extraHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    this.socket.on('connect', () => {
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (err) => {
      this.callbacks.onError?.(err);
    });

    this.socket.on('notificacao.criada', (data: { schemaVersion: number; notificacao: NotificacaoDto }) => {
      if (data?.notificacao) {
        this.callbacks.onNotificationCreated?.(data.notificacao);
      }
    });

    this.socket.on('notificacao.removida', (data: { schemaVersion: number; notificacaoId: string }) => {
      if (data?.notificacaoId) {
        this.callbacks.onNotificationRemoved?.(data.notificacaoId);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export const notificationSocket = new NotificationSocketClient();
