'use client';

import { Modal } from '@/components/game-ui/Modal';
import { ui } from '@/content/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/stores/useGameStore';
import type { QualityProfileId } from '@/engine/heroes/policy';

/** Profiles differ in environment cost only; the hero mesh is identical in all three. */
const PROFILES: QualityProfileId[] = ['safe', 'balanced', 'high'];

export function SettingsPanel() {
  const settings = useSettingsStore();
  const toggleSettings = useGameStore((state) => state.toggleSettings);
  const resetAllProgress = useGameStore((state) => state.resetAllProgress);
  const locale = settings.locale;

  const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0' } as const;

  return (
    <Modal labelledBy="settings-title" onDismiss={() => toggleSettings(false)}>
      <h2 id="settings-title" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
        {ui('settings', locale)}
      </h2>

      <div style={rowStyle}>
        <span>{locale === 'tr' ? 'Dil' : 'Language'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={locale === 'tr' ? 'btn' : 'btn btn--ghost'}
            aria-pressed={locale === 'tr'}
            onClick={() => settings.setLocale('tr')}
          >
            Türkçe
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'btn' : 'btn btn--ghost'}
            aria-pressed={locale === 'en'}
            onClick={() => settings.setLocale('en')}
          >
            English
          </button>
        </div>
      </div>

      <div style={rowStyle}>
        <span>{ui('guidedMode', locale)}</span>
        <button
          type="button"
          className={settings.controlMode === 'guided' ? 'btn' : 'btn btn--ghost'}
          aria-pressed={settings.controlMode === 'guided'}
          onClick={() => settings.setControlMode(settings.controlMode === 'guided' ? 'explore' : 'guided')}
        >
          {settings.controlMode === 'guided' ? ui('guidedMode', locale) : ui('exploreMode', locale)}
        </button>
      </div>

      <div style={rowStyle}>
        <span>{ui('quality', locale)}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {PROFILES.map((tier) => (
            <button
              key={tier}
              type="button"
              className={settings.quality === tier ? 'btn' : 'btn btn--ghost'}
              aria-pressed={settings.quality === tier}
              onClick={() => settings.setQuality(tier)}
            >
              {tier === 'safe' ? ui('qualityLow', locale) : tier === 'balanced' ? ui('qualityMedium', locale) : ui('qualityHigh', locale)}
            </button>
          ))}
        </div>
      </div>

      <div style={rowStyle}>
        <span>{ui('reducedMotion', locale)}</span>
        <button
          type="button"
          className={settings.reducedMotion ? 'btn' : 'btn btn--ghost'}
          aria-pressed={settings.reducedMotion}
          onClick={() => settings.setReducedMotion(!settings.reducedMotion)}
        >
          {settings.reducedMotion ? (locale === 'tr' ? 'Açık' : 'On') : locale === 'tr' ? 'Kapalı' : 'Off'}
        </button>
      </div>

      <fieldset style={{ border: 'none', padding: '10px 0 0', margin: 0 }}>
        <legend style={{ padding: 0, fontWeight: 600 }}>{ui('audio', locale)}</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {(
            [
              ['ambient', settings.muteAmbient, locale === 'tr' ? 'Ortam' : 'Ambient'],
              ['ui', settings.muteUi, locale === 'tr' ? 'Arayüz' : 'Interface'],
              ['guide', settings.muteGuide, locale === 'tr' ? 'Rehber' : 'Guide'],
            ] as const
          ).map(([channel, muted, label]) => (
            <button
              key={channel}
              type="button"
              className={muted ? 'btn btn--ghost' : 'btn'}
              aria-pressed={!muted}
              onClick={() => settings.toggleAudio(channel)}
            >
              {label}: {muted ? (locale === 'tr' ? 'kapalı' : 'off') : locale === 'tr' ? 'açık' : 'on'}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 22 }}>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ color: 'var(--flag-red)' }}
          onClick={() => void resetAllProgress()}
        >
          {ui('resetProgress', locale)}
        </button>
        <button type="button" className="btn" onClick={() => toggleSettings(false)}>
          {ui('close', locale)}
        </button>
      </div>
    </Modal>
  );
}
