import { stepDown, type QualityProfileId } from '@/engine/heroes/policy';

/**
 * Adaptive quality.
 *
 * Profile detection guesses from core count and memory, and it guessed wrong in
 * the field: a laptop that reported eight cores was given `high` and delivered
 * 19 fps. Guessing is unavoidable at startup; staying wrong is not. This walks
 * the profile down when measured frames say the guess was optimistic.
 *
 * It only ever steps down. Stepping back up on a brief good patch produces
 * visible oscillation, which reads worse than simply running one notch lower.
 */

/** Below this, the experience is visibly stuttering for a child. */
export const FPS_FLOOR = 28;

/** Consecutive samples under the floor before acting. Samples arrive at 2 Hz. */
export const SAMPLES_BEFORE_STEP = 6;

/** Samples to ignore after a change, so the new profile gets a fair reading. */
export const COOLDOWN_SAMPLES = 8;

export interface AdaptiveState {
  readonly consecutiveLow: number;
  readonly cooldown: number;
  /** Profiles the engine chose on the player's behalf, for the record. */
  readonly steps: readonly QualityProfileId[];
}

export const initialAdaptiveState: AdaptiveState = {
  consecutiveLow: 0,
  cooldown: 0,
  steps: [],
};

export interface AdaptiveDecision {
  readonly state: AdaptiveState;
  /** Non-null when the caller should switch to this profile. */
  readonly nextProfile: QualityProfileId | null;
}

export function considerSample(
  state: AdaptiveState,
  fps: number,
  current: QualityProfileId,
  /** False when the player chose a profile by hand; their choice is respected. */
  automatic: boolean,
): AdaptiveDecision {
  if (!automatic) return { state: initialAdaptiveState, nextProfile: null };

  if (state.cooldown > 0) {
    return { state: { ...state, cooldown: state.cooldown - 1, consecutiveLow: 0 }, nextProfile: null };
  }

  if (fps >= FPS_FLOOR) {
    return { state: { ...state, consecutiveLow: 0 }, nextProfile: null };
  }

  const consecutiveLow = state.consecutiveLow + 1;
  if (consecutiveLow < SAMPLES_BEFORE_STEP) {
    return { state: { ...state, consecutiveLow }, nextProfile: null };
  }

  const next = stepDown(current);
  if (!next) {
    // Already as light as the engine goes; stop counting and leave it alone.
    return { state: { ...state, consecutiveLow: 0 }, nextProfile: null };
  }

  return {
    state: { consecutiveLow: 0, cooldown: COOLDOWN_SAMPLES, steps: [...state.steps, next] },
    nextProfile: next,
  };
}
