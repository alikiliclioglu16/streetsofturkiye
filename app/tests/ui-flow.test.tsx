import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/game-ui/Modal';
import { QuizPanel } from '@/components/game-ui/QuizPanel';
import { FactCard } from '@/components/game-ui/FactCard';
import { CompletionPanel } from '@/components/game-ui/CompletionPanel';

/**
 * Real-DOM coverage for the UI layer. This does not replace the Playwright
 * suite (which needs a browser binary, see docs/QA_EVIDENCE.md) but it does
 * exercise focus, keyboard and panel flow in jsdom on every `npm test`.
 */

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

import { loadComposedCity } from './helpers';

const city = loadComposedCity('istanbul');

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

    // Migrated content is English-only, so the UI shows the fallback locale.
    const wrong = item.options.find((option) => !option.correct)!;
    await userEvent.click(screen.getByRole('button', { name: new RegExp(escapeRegExp(wrong.text.en!)) }));
    expect(onCorrect).not.toHaveBeenCalled();
    expect(screen.getByText(/Tekrar dene/)).toBeInTheDocument();

    const right = item.options.find((option) => option.correct)!;
    await userEvent.click(screen.getByRole('button', { name: new RegExp(escapeRegExp(right.text.en!)) }));
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
  it('shows the canonical description and guide line as authored', () => {
    const hotspot = city.hotspots[0]!;
    render(<FactCard hotspot={hotspot} locale="tr" onContinue={vi.fn()} />);
    expect(screen.getByText(hotspot.fact.body.en!)).toBeInTheDocument();
    expect(screen.getByText(hotspot.fact.guideLine.en!)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: hotspot.fact.title.en! })).toBeInTheDocument();
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
        collectedRewardIds={[city.rewards.collectibleAssetIds[0]!]}
        locale="tr"
        onLeave={vi.fn()}
      />,
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(city.hotspots.length - 1);
    // Collectible names come from canonical content, not from asset labels.
    expect(screen.getByText(city.hotspots[0]!.reward.label.en!)).toBeInTheDocument();
  });
});
