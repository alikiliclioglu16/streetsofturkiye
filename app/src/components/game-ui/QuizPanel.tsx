'use client';

import { useState } from 'react';
import { Modal } from '@/components/game-ui/Modal';
import { t, ui, type Locale } from '@/content/i18n';
import type { QuizItem } from '@/content/schemas/city';

/** Quiz gate. Wrong answers retry without punishment. */
export function QuizPanel({
  item,
  index,
  total,
  locale,
  onCorrect,
}: {
  item: QuizItem;
  index: number;
  total: number;
  locale: Locale;
  onCorrect: () => void;
}) {
  const [wrongId, setWrongId] = useState<string | null>(null);

  return (
    <Modal labelledBy="quiz-title">
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--cini-blue)' }}>
        {ui('quizTitle', locale)} · {index + 1}/{total}
      </p>
      <h2 id="quiz-title" style={{ fontSize: '1.5rem', margin: '6px 0 16px' }}>
        {t(item.question, locale)}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {item.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="btn btn--ghost"
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              borderColor: wrongId === option.id ? 'var(--flag-red)' : undefined,
            }}
            onClick={() => (option.correct ? onCorrect() : setWrongId(option.id))}
          >
            {t(option.text, locale)}
            {wrongId === option.id ? ` — ${ui('tryAgain', locale)}` : ''}
          </button>
        ))}
      </div>
    </Modal>
  );
}
