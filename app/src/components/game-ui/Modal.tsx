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
    /**
     * Focus the dialog, not the first thing in it.
     *
     * This focused the first button, which in the quiz is the first answer —
     * and the browser draws a focus ring around it. The options are shuffled,
     * so on thirty-six of the eighty-four questions the correct answer lands in
     * that slot and a child is shown a gold outline around the right answer
     * before they have read the question. The owner spotted it on Kars.
     *
     * The dialog takes focus instead. A screen reader still enters the dialog
     * and Tab still reaches every option in order; nothing is highlighted that
     * the child did not choose.
     */
    node.focus();

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
        /* Focusable so the dialog itself can take focus, but not in the tab
           order: Tab from here goes to the first real control. */
        tabIndex={-1}
        className="panel"
        style={{ width: 'min(560px, 100%)', padding: 'clamp(18px, 3vw, 28px)', outline: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
