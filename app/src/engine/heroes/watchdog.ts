/**
 * Choreography watchdogs.
 *
 * Every step that waits on the 3D layer — a camera reaching its anchor, an
 * animation clip firing `finished` — can fail to report. The model may be a
 * placeholder with no mixer at all, a clip may be missing, a lerp may never
 * quite converge. When that happens the sequence must move on, not strand the
 * player behind a locked input with no panel on screen.
 *
 * These are deliberately generous: long enough that a healthy scene always
 * reports first, short enough that a child does not decide the game is broken.
 */

/** Camera framing before an interaction opens. */
export const CAMERA_SETTLE_TIMEOUT_MS = 2_500;

/** A one-shot celebration or success beat. */
export const CLIP_TIMEOUT_MS = 6_000;

/** Ceiling for a whole completion sequence, however many clips it holds. */
export const CELEBRATION_TIMEOUT_MS = 20_000;

export function clipTimeoutFor(capSeconds: number | null): number {
  if (capSeconds === null) return CLIP_TIMEOUT_MS;
  // A capped clip already ends early; give it a second of slack.
  return Math.round(capSeconds * 1000) + 1_000;
}
