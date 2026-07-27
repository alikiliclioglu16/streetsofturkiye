'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { CityDefinition } from '@/content/schemas/city';

/** Arrival beat: title, one guide line, always skippable. */
export function IntroPanel({
  city,
  locale,
  onStart,
}: {
  city: CityDefinition;
  locale: Locale;
  onStart: () => void;
}) {
  const title = city.intro ? t(city.intro.title, locale) : t(city.name, locale);
  const line = city.intro ? t(city.intro.guideLine, locale) : '';

  return (
    <Modal labelledBy="intro-title" onDismiss={onStart}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--cini-blue)' }}>
        {t(city.name, locale)}
        {city.estimatedMinutes ? ` · ${city.estimatedMinutes} ${ui('estimated', locale)}` : ''}
      </p>
      <h2 id="intro-title" style={{ fontSize: '1.9rem', margin: '6px 0 10px' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: '1.05rem', lineHeight: 1.5 }}>{line}</p>
      <button type="button" className="btn btn--gold" onClick={onStart}>
        {ui('skipIntro', locale)}
      </button>
    </Modal>
  );
}
