'use client';

import type { Locale } from '@/content/i18n';
import { ui } from '@/content/i18n';

interface HudProps {
  cityName: string;
  locale: Locale;
  completed: number;
  total: number;
  collected: number;
  prompt: string | null;
  onSettings: () => void;
  onLeave: () => void;
  onInteract: () => void;
}

/** Persistent in-city UI: name, route progress, collection, settings, prompt. */
export function Hud({
  cityName,
  locale,
  completed,
  total,
  collected,
  prompt,
  onSettings,
  onLeave,
  onInteract,
}: HudProps) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: 'clamp(10px, 2vw, 18px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        <div className="panel" style={{ padding: '10px 16px', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '1.25rem', lineHeight: 1.1 }}>{cityName}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600 }}>
            {/* Progress is stated numerically, never by colour alone. */}
            {completed}/{total} {ui('hotspotsDone', locale)} · {collected} ★
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            style={{ display: 'flex', gap: 4, marginTop: 8 }}
          >
            {Array.from({ length: total }, (_, index) => (
              <span
                key={index}
                style={{
                  width: 26,
                  height: 6,
                  borderRadius: 3,
                  background: index < completed ? 'var(--green)' : 'rgba(22,50,79,0.18)',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button type="button" className="btn btn--ghost" onClick={onSettings} style={{ background: 'var(--surface)' }}>
            {ui('settings', locale)}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLeave} style={{ background: 'var(--surface)' }}>
            {ui('backToMap', locale)}
          </button>
        </div>
      </div>

      {prompt ? (
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(16px, 4vh, 40px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button type="button" className="btn btn--gold" onClick={onInteract}>
            {prompt}
          </button>
        </div>
      ) : null}

      {
        <p
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            fontSize: 12,
            opacity: 0.65,
            textAlign: 'center',
            width: 'min(90%, 520px)',
          }}
        >
          {ui('moveHint', locale)}
        </p>
      }
    </>
  );
}
