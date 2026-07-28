'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, type Locale } from '@/content/i18n';
import type { RuntimeHotspot as HotspotDefinition } from '@/content/compose';
import type { Presentation } from '@/content/schemas/presentation';

/**
 * Arriving at a stop.
 *
 * The source presents; it does not examine. A stop shows the guide's line, the
 * category badge, the title and the description, and offers the collectible.
 * There is no question here — questions belong to the Quiz Gate at the end of
 * the street. An earlier build asked one at every stop, which was invented.
 */
export function FactCard({
  hotspot,
  locale,
  presentation,
  onCollect,
}: {
  hotspot: HotspotDefinition;
  locale: Locale;
  presentation: Presentation | null;
  onCollect: () => void;
}) {
  const guideLine = t(hotspot.fact.guideLine, locale);
  const category = presentation?.categories[hotspot.category];
  const rewardLabel = t(hotspot.reward.label, locale);

  return (
    <Modal labelledBy="fact-title">
      {guideLine ? (
        <p style={{ margin: '0 0 12px', fontSize: 15, fontStyle: 'italic', opacity: 0.8 }}>
          {hotspot.guideName ? `${hotspot.guideName}: ` : ''}
          “{guideLine}”
        </p>
      ) : null}

      {category ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            background: category.color,
            color: '#FFF8E7',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {category.label}
        </span>
      ) : null}

      <h2 id="fact-title" style={{ fontSize: '1.6rem', margin: '4px 0 10px' }}>
        {t(hotspot.fact.title, locale)}
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: '1.02rem', lineHeight: 1.55 }}>
        {t(hotspot.fact.body, locale)}
      </p>

      <button type="button" className="btn btn--gold" onClick={onCollect}>
        {hotspot.reward.emoji} Collect {rewardLabel}!
      </button>
    </Modal>
  );
}
