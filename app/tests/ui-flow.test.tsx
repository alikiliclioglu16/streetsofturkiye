import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { citySchema } from '@/content/schemas/city';
import { Modal } from '@/components/game-ui/Modal';
import { QuizPanel } from '@/components/game-ui/QuizPanel';
import { FactCard } from '@/components/game-ui/FactCard';
import { CompletionPanel } from '@/components/game-ui/CompletionPanel';

/**
 * Real-DOM coverage for the UI layer. This does not replace the Playwright
 * suite (which needs a browser binary, see docs/QA_EVIDENCE.md) but it does
 * exercise focus, keyboard and panel flow in jsdom on every `npm test`.
 */

const city = citySchema.parse(
  JSON.parse(
    readFileSync(path.resolve(process.cwd(), '..', 'content/pilot/istanbul.json'), 'utf8'),
  ),
);

describe('modal accessibility', () => {
  it('moves focus into the dialog on open', async () => {
    render(
      <Modal labelledBy="t">
        <h2 id="t">Başlık</h2>
        <button type="button">İlk</button>
        <button type="button">Son</button>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'İlk' })).toHaveFocus();
  });

  it('closes on Escape when dismissible', async () => {
    const onDismiss = vi.fn();
    render(
      <Modal labelledBy="t" onDismiss={onDismiss}>
        <h2 id="t">Başlık</h2>
        <button type="button">Kapat</button>
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside the dialog', async () => {
    render(
      <Modal labelledBy="t">
        <h2 id="t">Başlık</h2>
        <button type="button">İlk</button>
        <button type="button">Son</button>
      </Modal>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Son' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'İlk' })).toHaveFocus();
  });

  it('marks itself as a modal dialog', () => {
    render(
      <Modal labelledBy="t">
        <h2 id="t">Başlık</h2>
        <button type="button">Tamam</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 't');
  });
});

describe('quiz gate', () => {
  it('shows the position in a two-question set', () => {
    const item = city.quiz[0]!;
    render(<QuizPanel item={item} index={0} total={city.quiz.length} locale="tr" onCorrect={vi.fn()} />);
    expect(screen.getByText(/1\/2/)).toBeInTheDocument();
  });

  it('advances only on the correct option', async () => {
    const onCorrect = vi.fn();
    const item = city.quiz[0]!;
    render(<QuizPanel item={item} index={0} total={2} locale="tr" onCorrect={onCorrect} />);

    const wrong = item.options.find((option) => !option.correct)!;
    await userEvent.click(screen.getByRole('button', { name: new RegExp(wrong.text.tr!) }));
    expect(onCorrect).not.toHaveBeenCalled();
    expect(screen.getByText(/Tekrar dene/)).toBeInTheDocument();

    const right = item.options.find((option) => option.correct)!;
    await userEvent.click(screen.getByRole('button', { name: new RegExp(right.text.tr!) }));
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('is fully operable from the keyboard', async () => {
    const onCorrect = vi.fn();
    const item = city.quiz[1]!;
    render(<QuizPanel item={item} index={1} total={2} locale="tr" onCorrect={onCorrect} />);
    const correctIndex = item.options.findIndex((option) => option.correct);
    for (let i = 0; i < correctIndex; i += 1) await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });
});

describe('fact card', () => {
  it('flags content that has not passed editorial review', () => {
    const hotspot = city.hotspots[0]!;
    render(<FactCard hotspot={hotspot} locale="tr" onContinue={vi.fn()} />);
    expect(screen.getByText(/Editör onayı bekliyor/)).toBeInTheDocument();
    expect(screen.getByText(hotspot.fact.body.tr!)).toBeInTheDocument();
  });

  it('falls back to English when Turkish is missing', () => {
    const hotspot = city.hotspots[0]!;
    const englishOnly = {
      ...hotspot,
      fact: { ...hotspot.fact, body: { tr: null, en: 'English only body' } },
    };
    render(<FactCard hotspot={englishOnly} locale="tr" onContinue={vi.fn()} />);
    expect(screen.getByText('English only body')).toBeInTheDocument();
  });
});

describe('completion panel', () => {
  it('separates earned collectibles from missing ones without relying on colour', () => {
    render(
      <CompletionPanel
        city={city}
        collectedRewardIds={[city.rewards.collectibleIds[0]!]}
        locale="tr"
        onLeave={vi.fn()}
      />,
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(city.rewards.collectibleIds.length - 1);
  });
});
