'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, type Locale } from '@/content/i18n';
import type { RuntimeCity as CityDefinition } from '@/content/compose';
import { fillTemplate, type Presentation } from '@/content/schemas/presentation';

/**
 * Arrival at a city.
 *
 * The guide introduces himself, says how many stops the street has and what
 * winning looks like. This copy is extracted from the source, not written here:
 * an earlier build used the first stop's line as a welcome, which dropped the
 * player into the middle of a thought.
 */
export function IntroPanel({
  city,
  locale,
  presentation,
  onStart,
}: {
  city: CityDefinition;
  locale: Locale;
  presentation: Presentation | null;
  onStart: () => void;
}) {
  const cityName = t(city.name, locale);
  const guide = presentation?.guides[city.guideId];
  const values = { name: 'explorer', city: cityName, stopCount: city.canonicalStopCount };

  const title = presentation
    ? fillTemplate(presentation.city.welcomeTitle, values)
    : `Welcome to ${cityName}!`;
  const body = presentation
    ? `${fillTemplate(guide?.greeting ?? '', values)} ${fillTemplate(presentation.city.welcomeBody, values)}`.trim()
    : t(city.intro.guideLine, locale);

  return (
    <Modal labelledBy="intro-title" onDismiss={onStart}>
      {guide ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--cini-blue)',
          }}
        >
          {guide.name}
        </p>
      ) : null}

      <h2 id="intro-title" style={{ fontSize: '1.9rem', margin: '6px 0 10px' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: '1.05rem', lineHeight: 1.55 }}>{body}</p>

      <button type="button" className="btn btn--gold" onClick={onStart}>
        {presentation?.city.startButton ?? "Let's go!"} 🚶
      </button>
    </Modal>
  );
}
