'use client';

import { t, ui, type Locale } from '@/content/i18n';
import type { ChoiceOption, HotspotDefinition, InteractionType } from '@/content/schemas/city';

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
  const config = hotspot.interaction.config;
  const instruction = t(config.instruction ?? config.question, locale);
  const showHint = attempts >= (config.hintAfterAttempts ?? 2);

  const options: ChoiceOption[] = config.options ?? [];

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
            <button type="button" className="btn btn--ghost" onClick={() => onRotate(-1)} aria-label={locale === 'tr' ? 'Sola çevir' : 'Turn left'}>
              ←
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onRotate(1)} aria-label={locale === 'tr' ? 'Sağa çevir' : 'Turn right'}>
              →
            </button>
            <p style={{ margin: 'auto 0', fontSize: 13, opacity: 0.75 }}>
              {locale === 'tr' ? 'Çevir, sonra doğru motife dokun' : 'Turn it, then tap the right motif'}
            </p>
          </div>
          {/* Keyboard-equivalent path: the same choice without pointer targeting. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn" onClick={() => onAnswer(true)}>
              {locale === 'tr' ? 'Lale motifi' : 'Tulip motif'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onAnswer(false)}>
              {locale === 'tr' ? 'Kare desen' : 'Square pattern'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onAnswer(false)}>
              {locale === 'tr' ? 'Yuvarlak nokta' : 'Round dot'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.length > 0 ? (
            options.map((option) => (
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
          {ui('hint', locale)}:{' '}
          {locale === 'tr'
            ? 'Uzun, sivri uçlu olanı ara.'
            : 'Look for the tall, pointed one.'}
        </p>
      ) : null}

      {degraded ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, opacity: 0.6 }}>
          {locale === 'tr'
            ? `Bu durak “${hotspot.interaction.type}” etkileşimi bekliyor; şimdilik basit seçim gösteriliyor.`
            : `This stop awaits its “${hotspot.interaction.type}” interaction; showing the simple choice for now.`}
        </p>
      ) : null}
    </section>
  );
}
