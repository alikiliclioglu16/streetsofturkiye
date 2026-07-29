/**
 * Wind.
 *
 * A street where nothing moves reads as a photograph of a street. Two layers of
 * sine at unrelated periods, so the motion never visibly repeats the way a
 * single wave does.
 *
 * Pure, so the amount of sway at a given moment is testable without a canvas —
 * and so reduced motion is honoured by passing zero strength rather than by
 * threading a flag through every component that moves.
 */

/** Radians of sway at full strength. About four degrees. */
export const SWAY_RADIANS = 0.07;

/** How much a tall thing leans compared with a low one. */
export function heightFactor(metres: number): number {
  // A six metre flagpole moves; a shrub barely does.
  return Math.min(1, metres / 6);
}

/**
 * Sway at a moment, for something at a place.
 *
 * The phase offset spreads the motion across the street, so twenty-one trees do
 * not lean in unison — which reads as an earthquake rather than a breeze.
 */
export function sway(elapsedSeconds: number, phase: number, strength = 1): number {
  const slow = Math.sin(elapsedSeconds * 0.7 + phase);
  const fast = Math.sin(elapsedSeconds * 1.9 + phase * 2.3) * 0.35;
  return (slow + fast) * SWAY_RADIANS * strength;
}

/** A gust that occasionally lifts the whole street a little. */
export function gust(elapsedSeconds: number): number {
  return 0.75 + 0.25 * Math.sin(elapsedSeconds * 0.23);
}
