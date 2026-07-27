'use client';

import { useMemo } from 'react';
import { t, ui, type Locale } from '@/content/i18n';
import { shuffleOptions } from '@/content/compose';
import type { RuntimeChoice as ChoiceOption, RuntimeHotspot as HotspotDefinition } from '@/content/compose';
import type { InteractionType } from '@/content/schemas/scene';

interface InteractionPanelProps {
  hotspot: HotspotDefinition;
  resolvedType: InteractionType;
  degraded: boolean;
  attempts: number;
  locale: Locale;
  onAnswer: (correct: boolean) => void;
  onRotate: (direction: -1 | 1) => void;
}

/**
 * Docked panel rather than a full-screen sheet: the child must keep seeing the
 * object they are working on (EXPERIENCE_DESIGN, UI hierarchy).
 */
export function InteractionPanel({
  hotspot,
  resolvedType,
  degraded,
  attempts,
  locale,
  onAnswer,
  onRotate,
}: InteractionPanelProps) {
  const interaction = hotspot.interaction;
  // Instruction is gameplay copy; the options are canonical reward labels.
  const instruction = t(interaction.instruction, locale);
  const showHint = attempts >= interaction.hintAfterAttempts;
  const options: ChoiceOption[] = interaction.options;
  // Canonical order always puts the correct answer first, so never show it raw.
  const displayOptions = useMemo(() => shuffleOptions(options, hotspot.id), [options, hotspot.id]);

  return (
    <section
      aria-label={instruction}
      className="panel"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 'clamp(14px, 4vh, 34px)',
        transform: 'translateX(-50%)',
        width: 'min(560px, calc(100% - 28px))',
        padding: 'clamp(14px, 3vw, 22px)',
        zIndex: 25,
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.4 }}>
        {instruction}
      </p>

      {resolvedType === 'inspect-and-find' ? (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button type="button" className="btn btn--ghost" onClick={() => onRotate(-1)} aria-label={ui('turnLeft', locale)}>
              ←
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onRotate(1)} aria-label={ui('turnRight', locale)}>
              →
            </button>
            <p style={{ margin: 'auto 0', fontSize: 13, opacity: 0.75 }}>
              {ui('inspectHint', locale)}
            </p>
          </div>
          {/* Keyboard-equivalent path: the same canonical choices, no pointer aiming. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {displayOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                /* Every option looks the same. Styling the correct one
                   differently answered the question for the child. */
                className="btn btn--ghost"
                onClick={() => onAnswer(option.correct)}
              >
                {t(option.text, locale)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayOptions.length > 0 ? (
            displayOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="btn btn--ghost"
                style={{ textAlign: 'left', padding: '12px 16px' }}
                onClick={() => onAnswer(option.correct)}
              >
                {t(option.text, locale)}
              </button>
            ))
          ) : (
            <button type="button" className="btn" onClick={() => onAnswer(true)}>
              {ui('continue', locale)}
            </button>
          )}
        </div>
      )}

      {showHint ? (
        <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--cini-blue)', fontWeight: 600 }}>
          {ui('hint', locale)}: {t(hotspot.fact.guideLine, locale)}
        </p>
      ) : null}

      {degraded ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, opacity: 0.6 }}>
          {`This stop awaits its “${hotspot.interaction.type}” interaction; showing the simple choice for now.`}
        </p>
      ) : null}
    </section>
  );
}
