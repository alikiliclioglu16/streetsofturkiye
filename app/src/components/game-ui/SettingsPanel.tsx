'use client';

import { Modal } from '@/components/game-ui/Modal';
import { ui } from '@/content/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/stores/useGameStore';

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
        <span>{ui('reducedMotion', locale)}</span>
        <button
          type="button"
          className={settings.reducedMotion ? 'btn' : 'btn btn--ghost'}
          aria-pressed={settings.reducedMotion}
          onClick={() => settings.setReducedMotion(!settings.reducedMotion)}
        >
          {settings.reducedMotion ? ui('on', locale) : ui('off', locale)}
        </button>
      </div>

      <fieldset style={{ border: 'none', padding: '10px 0 0', margin: 0 }}>
        <legend style={{ padding: 0, fontWeight: 600 }}>{ui('audio', locale)}</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {(
            [
              ['ambient', settings.muteAmbient, ui('audioAmbient', locale)],
              ['ui', settings.muteUi, ui('audioInterface', locale)],
              ['guide', settings.muteGuide, ui('audioGuide', locale)],
            ] as const
          ).map(([channel, muted, label]) => (
            <button
              key={channel}
              type="button"
              className={muted ? 'btn btn--ghost' : 'btn'}
              aria-pressed={!muted}
              onClick={() => settings.toggleAudio(channel)}
            >
              {label}: {muted ? ui('off', locale).toLowerCase() : ui('on', locale).toLowerCase()}
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
