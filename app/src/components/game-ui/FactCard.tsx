'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { RuntimeHotspot as HotspotDefinition } from '@/content/compose';

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
  // Canonical content is presented as authored; the guide line comes with it.
  const guideLine = t(hotspot.fact.guideLine, locale);

  return (
    <Modal labelledBy="fact-title" onDismiss={onContinue}>
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--green)' }}>{ui('correct', locale)}</p>
      <h2 id="fact-title" style={{ fontSize: '1.6rem', margin: '6px 0 10px' }}>
        {t(hotspot.fact.title, locale)}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '1.02rem', lineHeight: 1.55 }}>
        {t(hotspot.fact.body, locale)}
      </p>
      {guideLine ? (
        <p style={{ margin: '0 0 16px', fontSize: 14, fontStyle: 'italic', opacity: 0.75 }}>
          {guideLine}
        </p>
      ) : null}
      <button type="button" className="btn btn--gold" onClick={onContinue}>
        {ui('continue', locale)}
      </button>
    </Modal>
  );
}
