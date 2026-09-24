import { useEffect, useRef, useState, useCallback } from 'react';
import type { TrackingSnapshot } from '../../services/tracking/trackingApi';
import type { TrackingEnvelope } from '../../services/tracking/trackingSocket';
import styles from './AcompanhamentoEmbed.module.css';

export interface AcompanhamentoEmbedProps {
  rideId: number | string;
  role?: 'passenger' | 'driver';
  snapshot: TrackingSnapshot | null;
  lastEvent?: TrackingEnvelope | null;
  onCommand?: (commandType: string, payload: unknown) => void;
  className?: string;
}

const getAcompanhamentoUrl = (): string => {
  const url = import.meta.env.VITE_ACOMPANHAMENTO_URL;
  if (!url && import.meta.env.PROD) {
    throw new Error('VITE_ACOMPANHAMENTO_URL is required for a production build.');
  }
  return (url || 'http://localhost:3001').replace(/\/+$/, '');
};

export const AcompanhamentoEmbed = ({
  rideId,
  role = 'passenger',
  snapshot,
  lastEvent,
  onCommand,
  className,
}: AcompanhamentoEmbedProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const baseUrl = getAcompanhamentoUrl();
  const targetOrigin = new URL(baseUrl).origin;
  const iframeSrc = `${baseUrl}/?role=${role}`;

  const sendToIframe = useCallback((envelope: unknown) => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(envelope, targetOrigin);
    } catch (err) {
      console.warn('Falha ao enviar mensagem para o iframe de acompanhamento:', err);
    }
  }, [targetOrigin]);

  // Handshake inicial
  const handleIframeLoad = () => {
    setLoadError(null);
    sendToIframe({
      schemaVersion: 1,
      type: 'trip.context',
      tripId: String(rideId),
    });
  };

  // Escuta mensagens do micro-frontend
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      // Validação estrita da origem
      if (event.origin !== targetOrigin) {
        return;
      }
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'web.ready') {
        setIsReady(true);
        // Se temos um snapshot, enviamos o bootstrap imediatamente
        if (snapshot && snapshot.route) {
          sendToIframe({
            schemaVersion: 1,
            type: 'trip.bootstrap',
            eventId: crypto.randomUUID(),
            tripId: String(rideId),
            sentAt: new Date().toISOString(),
            payload: {
              role,
              tripStatus: snapshot.tripStatus,
              waiting: snapshot.waiting || { active: false, startedAt: null },
              route: snapshot.route,
              vehiclePosition: snapshot.vehiclePosition,
              passengerPosition: snapshot.passengerPosition,
            },
          });
        }
      } else if (data.type && onCommand) {
        onCommand(data.type, data.payload);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [targetOrigin, rideId, role, snapshot, sendToIframe, onCommand]);

  // Repasse do bootstrap quando o snapshot carregar depois do web.ready
  useEffect(() => {
    if (isReady && snapshot && snapshot.route) {
      sendToIframe({
        schemaVersion: 1,
        type: 'trip.bootstrap',
        eventId: crypto.randomUUID(),
        tripId: String(rideId),
        sentAt: new Date().toISOString(),
        payload: {
          role,
          tripStatus: snapshot.tripStatus,
          waiting: snapshot.waiting || { active: false, startedAt: null },
          route: snapshot.route,
          vehiclePosition: snapshot.vehiclePosition,
          passengerPosition: snapshot.passengerPosition,
        },
      });
    }
  }, [isReady, snapshot, rideId, role, sendToIframe]);

  // Encaminhamento de eventos WebSocket em tempo real para o iframe
  useEffect(() => {
    if (isReady && lastEvent) {
      sendToIframe(lastEvent);
    }
  }, [isReady, lastEvent, sendToIframe]);

  return (
    <div className={`${styles.embedContainer} ${className || ''}`}>
      {loadError ? (
        <div className={styles.errorFallback}>
          <p>Não foi possível carregar o micro-frontend de acompanhamento em <code>{baseUrl}</code>.</p>
          <small>Verifique se o serviço <strong>frota-acompanhamento</strong> está em execução na porta 3001.</small>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Acompanhamento ao Vivo - Frota Contratada"
          className={styles.iframe}
          onLoad={handleIframeLoad}
          onError={() => setLoadError('Falha ao carregar o aplicativo de mapa')}
          allow="geolocation"
        />
      )}
    </div>
  );
};
