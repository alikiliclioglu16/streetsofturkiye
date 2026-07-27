'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  labelledBy: string;
  children: ReactNode;
  onDismiss?: () => void;
  /** Keeps short panels from covering the scene (EXPERIENCE_DESIGN, UI hierarchy). */
  align?: 'center' | 'bottom';
}

/**
 * Focus-trapping dialog shell. Every gameplay panel uses it so keyboard users
 * always land inside the panel and Escape behaves consistently.
 */
export function Modal({ labelledBy, children, onDismiss, align = 'center' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const focusable = node.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onDismiss) {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: align === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 32px)',
        background: 'rgba(22, 50, 79, 0.34)',
        zIndex: 40,
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="panel"
        style={{ width: 'min(560px, 100%)', padding: 'clamp(18px, 3vw, 28px)' }}
      >
        {children}
      </div>
    </div>
  );
}
