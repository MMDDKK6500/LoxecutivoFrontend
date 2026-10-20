import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi';
import { ToastContext } from './toastStore';
import type { ToastKind } from './toastStore';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, kind, message }].slice(-4));
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-label="Notificações" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = toast.kind === 'success' ? FiCheckCircle : toast.kind === 'error' ? FiXCircle : FiInfo;
          return (
            <div className={`toast toast-${toast.kind}`} key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'}>
              <Icon className="toast-icon" aria-hidden="true" />
              <span className="toast-message">{toast.message}</span>
              <button type="button" className="toast-dismiss" aria-label="Dispensar notificação" onClick={() => dismiss(toast.id)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
