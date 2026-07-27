'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { HotspotDefinition } from '@/content/schemas/city';

/** The fact arrives only after the action (D-009). Kept short by design. */
export function FactCard({
  hotspot,
  locale,
  onContinue,
}: {
  hotspot: HotspotDefinition;
  locale: Locale;
  onContinue: () => void;
}) {
  const unverified = hotspot.fact.editorialStatus !== 'verified';

  return (
    <Modal labelledBy="fact-title" onDismiss={onContinue}>
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--green)' }}>{ui('correct', locale)}</p>
      <h2 id="fact-title" style={{ fontSize: '1.6rem', margin: '6px 0 10px' }}>
        {t(hotspot.fact.title, locale)}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '1.02rem', lineHeight: 1.55 }}>
        {t(hotspot.fact.body, locale)}
      </p>
      {unverified ? (
        <p style={{ margin: '0 0 16px', fontSize: 12, opacity: 0.6 }}>
          {ui('unverified', locale)} · {hotspot.fact.editorialStatus}
        </p>
      ) : null}
      <button type="button" className="btn btn--gold" onClick={onContinue}>
        {ui('continue', locale)}
      </button>
    </Modal>
  );
}
