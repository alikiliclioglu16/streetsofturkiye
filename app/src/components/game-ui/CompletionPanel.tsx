'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { RuntimeCity as CityDefinition } from '@/content/compose';
import { resolveAsset } from '@/engine/assets/registry';

/** Exit beat: collection recap, province star, return to map. */
export function CompletionPanel({
  city,
  collectedRewardIds,
  locale,
  onLeave,
  onKeepExploring,
}: {
  city: CityDefinition;
  collectedRewardIds: readonly string[];
  locale: Locale;
  onLeave: () => void;
  /**
   * Back to the street rather than back to the map.
   *
   * A finished city is still a city worth walking around, and the only way out
   * of this panel used to be leaving.
   */
  onKeepExploring?: () => void;
}) {
  // Labels come from canonical content, not from the asset registry.
  const collectibles = city.hotspots.map((hotspot) => hotspot.reward);
  return (
    <Modal labelledBy="complete-title" onDismiss={onLeave}>
      <h2 id="complete-title" style={{ fontSize: '1.7rem', marginBottom: 6 }}>
        ★ {ui('cityComplete', locale)}
      </h2>
      <p style={{ margin: '0 0 16px', opacity: 0.8 }}>{t(city.name, locale)}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {collectibles.map((reward) => {
          const owned = collectedRewardIds.includes(reward.assetId);
          const asset = resolveAsset(reward.assetId, 'medium');
          return (
            <li key={reward.assetId} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: owned ? 1 : 0.45 }}>
              <span aria-hidden="true" style={{ fontSize: 26, width: 30, flexShrink: 0 }}>
                {reward.emoji}
              </span>
              <span style={{ fontWeight: 600 }}>{t(reward.label, locale) || asset.entry.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}>
                {owned ? '✓' : '—'}
              </span>
            </li>
          );
        })}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {onKeepExploring ? (
          <button type="button" className="btn" onClick={onKeepExploring}>
            {ui('keepExploring', locale)}
          </button>
        ) : null}
        <button type="button" className="btn btn--gold" onClick={onLeave}>
          {ui('backToMap', locale)}
        </button>
      </div>
    </Modal>
  );
}
