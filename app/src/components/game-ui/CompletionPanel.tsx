'use client';

import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { CityDefinition } from '@/content/schemas/city';
import { resolveAsset } from '@/engine/assets/registry';

/** Exit beat: collection recap, province star, return to map. */
export function CompletionPanel({
  city,
  collectedRewardIds,
  locale,
  onLeave,
}: {
  city: CityDefinition;
  collectedRewardIds: readonly string[];
  locale: Locale;
  onLeave: () => void;
}) {
  return (
    <Modal labelledBy="complete-title" onDismiss={onLeave}>
      <h2 id="complete-title" style={{ fontSize: '1.7rem', marginBottom: 6 }}>
        ★ {ui('cityComplete', locale)}
      </h2>
      <p style={{ margin: '0 0 16px', opacity: 0.8 }}>{t(city.name, locale)}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {city.rewards.collectibleIds.map((rewardId) => {
          const owned = collectedRewardIds.includes(rewardId);
          const asset = resolveAsset(rewardId, 'medium');
          return (
            <li key={rewardId} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: owned ? 1 : 0.45 }}>
              <span
                aria-hidden="true"
                style={{ width: 30, height: 30, borderRadius: 9, background: asset.entry.color, flexShrink: 0 }}
              />
              <span style={{ fontWeight: 600 }}>{asset.entry.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}>
                {owned ? '✓' : '—'}
              </span>
            </li>
          );
        })}
      </ul>

      <button type="button" className="btn btn--gold" onClick={onLeave}>
        {ui('backToMap', locale)}
      </button>
    </Modal>
  );
}
