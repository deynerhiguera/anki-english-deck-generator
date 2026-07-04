import { useEffect } from 'react';
import './Toast.css';

export interface ToastState {
  kind: 'success' | 'error' | 'info';
  message: string;
}

export interface ToastProps {
  toast: ToastState | null;
  onDismiss(): void;
  durationMs?: number;
}

export function Toast({ toast, onDismiss, durationMs = 4000 }: ToastProps): JSX.Element | null {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => onDismiss(), durationMs);
    return () => clearTimeout(id);
  }, [toast, durationMs, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
