'use client';

import type { Locale } from '@/content/i18n';

/**
 * The one sentence a Time Window says.
 *
 * Deliberately not a card. The whole point of this system is that a child
 * watches the scene rather than reads a panel, so this sits low, over the
 * picture, and leaves the middle of the screen — where the window is happening
 * — alone. A box in the centre would be the fact card again in a smaller font.
 *
 * It takes no clicks and offers no buttons: the window ends on its own clock.
 */
export function CaptionOverlay({
  text,
  locale,
  visible,
}: {
  text: { tr: string; en: string } | null;
  locale: Locale;
  visible: boolean;
}) {
  if (!text) return null;
  const line = locale === 'tr' ? text.tr : text.en;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 'clamp(56px, 12vh, 120px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px',
        pointerEvents: 'none',
        // Fades rather than appears: the sentence arrives into a moving picture.
        opacity: visible ? 1 : 0,
        transition: 'opacity 420ms ease',
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: '26ch',
          textAlign: 'center',
          fontSize: 'clamp(1.05rem, 2.6vw, 1.5rem)',
          lineHeight: 1.35,
          fontWeight: 600,
          color: '#FFF8E7',
          /**
           * A shadow rather than a panel. The caption has to stay legible over
           * a bright sky and a dark facade in the same nine seconds, and a
           * plate behind it would hide the thing it is describing.
           */
          textShadow: '0 2px 10px rgba(10, 26, 40, 0.85), 0 0 2px rgba(10, 26, 40, 0.9)',
        }}
      >
        {line}
      </p>
    </div>
  );
}
