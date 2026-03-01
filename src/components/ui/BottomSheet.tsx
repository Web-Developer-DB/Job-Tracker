import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from './cn';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
  );

export const BottomSheet = ({ open, onClose, title, children, initialFocusRef, className }: BottomSheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const focusTarget = initialFocusRef?.current ?? closeButtonRef.current;
      focusTarget?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialFocusRef, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/48"
        aria-label="Bottom Sheet schließen"
        onClick={onClose}
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[92dvh] overflow-hidden rounded-t-3xl border border-border bg-base-elevated shadow-2xl',
          'md:mx-4 md:rounded-3xl',
          className
        )}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border md:hidden" aria-hidden="true" />
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id={titleId} className="font-display text-lg">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn-ghost btn-sm !min-h-[44px] !px-3"
            onClick={onClose}
          >
            Schließen
          </button>
        </header>

        <div className="max-h-[calc(92dvh-4.5rem)] overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </section>
    </div>
  );
};
