'use client';

import { Modal } from '@/components/game-ui/Modal';
import { ui, type Locale } from '@/content/i18n';
import { resolveAsset, type QualityTier } from '@/engine/assets/registry';

export function RewardPanel({
  rewardId,
  locale,
  quality,
  onContinue,
}: {
  rewardId: string;
  locale: Locale;
  quality: QualityTier;
  onContinue: () => void;
}) {
  const asset = resolveAsset(rewardId, quality);

  return (
    <Modal labelledBy="reward-title" onDismiss={onContinue}>
      <h2 id="reward-title" style={{ fontSize: '1.5rem', marginBottom: 10 }}>
        {ui('rewardEarned', locale)}
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          borderRadius: 14,
          background: 'rgba(62, 198, 201, 0.16)',
          marginBottom: 18,
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 46, height: 46, borderRadius: 12, background: asset.entry.color, flexShrink: 0 }}
        />
        <div>
          <p style={{ margin: 0, fontWeight: 650 }}>{asset.entry.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.65 }}>{rewardId}</p>
        </div>
      </div>
      <button type="button" className="btn" onClick={onContinue}>
        {ui('continue', locale)}
      </button>
    </Modal>
  );
}
