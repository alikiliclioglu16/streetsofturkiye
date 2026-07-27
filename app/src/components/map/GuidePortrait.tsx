'use client';

import { heroForGuide } from '@/engine/heroes/registry';

/**
 * 2D guide portrait for the map and collection routes.
 *
 * These routes must never mount a live 3D hero (policy rule 1): a 16 MB
 * character has no business loading on a screen that shows 81 provinces.
 */
export function GuidePortrait({ guideId, size = 34 }: { guideId: string; size?: number }) {
  const hero = heroForGuide(guideId);
  const initials = hero.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  return (
    <span
      title={hero.displayName}
      aria-label={hero.displayName}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: hero.portraitUrl ? `center/cover url(${hero.portraitUrl})` : hero.portraitColor,
        color: '#FFF8E7',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.4,
        fontWeight: 700,
        border: '2px solid rgba(22,50,79,0.15)',
      }}
    >
      {hero.portraitUrl ? '' : initials}
    </span>
  );
}
