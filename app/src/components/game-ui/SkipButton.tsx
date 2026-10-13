'use client';

import type { Locale } from '@/content/i18n';

/**
 * Atla — the way out of a Time Window.
 *
 * Small, in a corner, and late. It appears about a second and a bit after the
 * window starts (`SKIP_AVAILABLE_AFTER_SECONDS`), because the first moment
 * belongs to the child working out that something is happening; a button
 * present from the first frame reads the whole window as a thing to be
 * dismissed.
 *
 * Pressing it cancels: the scene is restored and nothing is earned. That is the
 * honest behaviour — a child who skips has not seen the stop, and the window
 * plays again the next time they walk into the ring.
 */
export function SkipButton({
  visible,
  locale,
  onSkip,
}: {
  visible: boolean;
  locale: Locale;
  onSkip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      // Hidden from the tab order until it is really available, so a keyboard
      // user cannot land on a control that does nothing yet.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      style={{
        position: 'absolute',
        right: 'clamp(12px, 3vw, 28px)',
        bottom: 'clamp(12px, 3vh, 28px)',
        minHeight: 44,
        padding: '10px 18px',
        borderRadius: 999,
        border: '1.5px solid rgba(255, 248, 231, 0.55)',
        background: 'rgba(22, 50, 79, 0.45)',
        backdropFilter: 'blur(6px)',
        color: '#FFF8E7',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 260ms ease, transform 260ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {locale === 'tr' ? 'Atla' : 'Skip'}
    </button>
  );
}
