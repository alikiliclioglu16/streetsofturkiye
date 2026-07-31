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
  it('moves focus to the dialog itself, not to the first answer', async () => {
    /**
     * This used to focus the first button, and the browser draws a ring around
     * whatever has focus. In the quiz the first button is the first answer, the
     * options are shuffled, and on thirty-six of the eighty-four questions the
     * correct one lands in that slot — so a child was shown a gold outline
     * around the right answer before reading the question (D-139).
     */
    render(
      <Modal labelledBy="t">
        <h2 id="t">Başlık</h2>
        <button type="button">İlk</button>
        <button type="button">Son</button>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'İlk' })).not.toHaveFocus();
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
    // Focus starts on the dialog, so the first Tab reaches the first control
    // and the last one wraps back to it.
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'İlk' })).toHaveFocus();
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
    /**
     * Tab through what is on screen rather than through the canonical order.
     * The panel shuffles the options, so counting from `item.options` only
     * worked while the two happened to line up — and it would have gone on
     * passing whether or not the keyboard reached the right button.
     */
    // English only (D-014): the tr strings are null and `t` falls back to en.
    const correctOption = item.options.find((option) => option.correct)!;
    const correctText = correctOption.text.tr ?? correctOption.text.en!;
    const rendered = screen.getAllByRole('button');
    const target = rendered.findIndex((button) => button.textContent?.startsWith(correctText));
    expect(target).toBeGreaterThanOrEqual(0);
    for (let i = 0; i <= target; i += 1) await userEvent.tab();
    expect(rendered[target]).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });
});

describe('fact card', () => {
  it('presents the stop and offers the collectible, without asking anything', () => {
    const hotspot = city.hotspots[0]!;
    render(<FactCard hotspot={hotspot} locale="en" presentation={null} onCollect={vi.fn()} />);

    expect(screen.getByText(hotspot.fact.body.en!)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: hotspot.fact.title.en! })).toBeInTheDocument();
    // One action, and it is not a question.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(new RegExp(`Collect ${hotspot.reward.label.en}`));
  });

  it('quotes the guide before the fact', () => {
    const hotspot = city.hotspots[0]!;
    render(<FactCard hotspot={hotspot} locale="en" presentation={null} onCollect={vi.fn()} />);
    expect(screen.getByText(new RegExp(hotspot.fact.guideLine.en!))).toBeInTheDocument();
  });

  it('collects on click', async () => {
    const onCollect = vi.fn();
    render(
      <FactCard hotspot={city.hotspots[0]!} locale="en" presentation={null} onCollect={onCollect} />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });

  it('falls back to English when Turkish is missing', () => {
    const hotspot = city.hotspots[0]!;
    const englishOnly = {
      ...hotspot,
      fact: { ...hotspot.fact, body: { tr: null, en: 'English only body' } },
    };
    render(<FactCard hotspot={englishOnly} locale="tr" presentation={null} onCollect={vi.fn()} />);
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
