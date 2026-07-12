import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { Button } from './Button';
import { cn } from './cn';

type ToastVariant = 'success' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION = 4200;

const ToastContext = createContext<ToastContextValue>({
  showToast: () => '',
  dismissToast: () => undefined
});

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-success/45',
  info: 'border-info/45',
  warning: 'border-warning/45'
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = 'info', duration = DEFAULT_DURATION, action }: ShowToastOptions) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const nextToast: ToastItem = { id, title, description, variant, duration, action };
      setToasts((current) => [...current, nextToast]);

      timersRef.current[id] = window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.7rem+env(safe-area-inset-bottom))] z-[80] space-y-2 md:inset-x-auto md:bottom-4 md:right-4 md:w-full md:max-w-sm">
        {toasts.map((toast) => (
          <section
            key={toast.id}
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-auto rounded-xl border bg-surface px-4 py-3 shadow-lg',
              'backdrop-blur-sm',
              variantClasses[toast.variant]
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{toast.title}</p>
                {toast.description && <p className="mt-1 text-xs text-muted">{toast.description}</p>}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm !min-h-[36px] !px-2"
                onClick={() => dismissToast(toast.id)}
                aria-label="Toast schließen"
              >
                ×
              </button>
            </div>
            {toast.action && (
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="!min-h-[36px] !text-xs"
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
