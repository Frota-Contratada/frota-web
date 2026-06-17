import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import CheckIcon from '../../../assets/icons/check.svg?react';
import ErroIcon from '../../../assets/icons/erro.svg?react';
import InfoIcon from '../../../assets/icons/info.svg?react';
import WarningIcon from '../../../assets/icons/warning.svg?react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface ShowToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: <CheckIcon width={18} height={18} />,
  error: <ErroIcon width={18} height={18} />,
  warning: <WarningIcon width={18} height={18} />,
  info: <InfoIcon width={18} height={18} />,
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, description, duration = DEFAULT_DURATION }: ShowToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { id, type, title, description, duration };

      setToasts((current) => [...current, toast]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-relevant="additions removals">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <span className={styles.icon} aria-hidden="true">
              {TOAST_ICONS[toast.type]}
            </span>
            <div className={styles.content}>
              <strong className={styles.title}>{toast.title}</strong>
              {toast.description && <span className={styles.description}>{toast.description}</span>}
            </div>
            <button className={styles.closeButton} type="button" onClick={() => dismissToast(toast.id)} aria-label="Fechar aviso">
              Fechar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }

  return context;
}
