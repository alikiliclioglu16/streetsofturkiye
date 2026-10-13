import type { TimeWindowCommand } from '@/content/schemas/timewindow';

/**
 * The window's clock: which commands have fired, and how far each one has run.
 *
 * Pure, and deliberately so. Everything about a Time Window that can be wrong
 * in a way a screenshot does not show — an event that never fires, one that
 * runs past the end, a tween that is still moving when the scene is restored —
 * is decidable from the event list and a number. None of it needs a renderer.
 */

export interface FiredCommand {
  readonly command: TimeWindowCommand;
  /** 0 at the moment it fires, 1 when its duration is up. Instant ones are 1. */
  readonly progress: number;
}

/** How long a command runs. Instant commands return 0. */
export function commandSeconds(command: TimeWindowCommand): number {
  return 'seconds' in command && typeof command.seconds === 'number' ? command.seconds : 0;
}

export function commandEnds(command: TimeWindowCommand): number {
  return command.at + commandSeconds(command);
}

/**
 * Every command that has started by `elapsed`, with its progress.
 *
 * Commands that have finished stay in the list at progress 1, because an
 * effect's final value must keep being applied — a tween removed the frame it
 * completes snaps back to where it started.
 */
export function activeCommands(
  events: readonly TimeWindowCommand[],
  elapsed: number,
): FiredCommand[] {
  const out: FiredCommand[] = [];
  for (const command of events) {
    if (elapsed < command.at) continue;
    const seconds = commandSeconds(command);
    const progress = seconds <= 0 ? 1 : Math.min(1, (elapsed - command.at) / seconds);
    out.push({ command, progress });
  }
  return out;
}

/**
 * Commands that fire in the step from `previous` to `elapsed`.
 *
 * For the one-shot kind — a sound, a spawn — which must happen exactly once
 * however the frame rate moves. `activeCommands` would re-report them every
 * frame.
 */
export function commandsFiredBetween(
  events: readonly TimeWindowCommand[],
  previous: number,
  elapsed: number,
): TimeWindowCommand[] {
  return events.filter((command) => command.at > previous && command.at <= elapsed);
}

/** The caption, and whether it should be on screen now. */
export function captionAt(
  events: readonly TimeWindowCommand[],
  elapsed: number,
): { text: { tr: string; en: string }; visible: boolean } | null {
  const caption = events.find((command) => command.do === 'caption');
  if (!caption || caption.do !== 'caption') return null;
  return {
    text: caption.text,
    visible: elapsed >= caption.at && elapsed <= caption.at + caption.seconds,
  };
}

/**
 * Eased 0..1. One curve for the whole system.
 *
 * Linear motion is what makes a camera move read as a machine rather than as
 * someone looking at something, and every window here is a camera move.
 */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
