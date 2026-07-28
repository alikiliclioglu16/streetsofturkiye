import type { HeroClip } from '@/engine/heroes/registry';

/**
 * Data-driven clip selection. The scene reports what the hero is doing and this
 * maps it to a clip; adding a state means editing this table, not the renderer.
 */
export interface HeroMotionState {
  /** Metres per second along the ground plane. */
  readonly speed: number;
  readonly interacting: boolean;
  /**
   * A one-shot clip the choreography is driving — a celebration step or a
   * success gesture.
   */
  readonly performing: HeroClip | null;
  /**
   * True while the performance owns the screen and input is locked, as during a
   * city celebration. A success nod is not locked: the child usually walks off
   * the moment they collect, and a nod that outranks walking left the guide
   * gliding in a held pose for five seconds.
   */
  readonly performanceLocked?: boolean;
}

/**
 * Hysteresis. A single threshold made the clip flip between idle and walk many
 * times a second around the boundary, and with a quarter-second cross-fade on
 * each flip every action could end up at zero weight — the guide snapped to his
 * bind pose and slid along the ground.
 */
const WALK_THRESHOLD = 0.6;
const STOP_THRESHOLD = 0.2;
/**
 * Sits between the walk and run speeds (4.2 and 7.4 m/s). It used to be 5.0
 * with a 4.2 top speed, so the run clip could never play at all.
 */
const RUN_THRESHOLD = 5.6;

export function clipForState(state: HeroMotionState, previous: HeroClip | null = null): HeroClip {
  const wasMoving = previous === 'walk' || previous === 'run';
  const threshold = wasMoving ? STOP_THRESHOLD : WALK_THRESHOLD;
  const walking = state.speed >= threshold;

  // Walking cancels an unlocked beat. A locked one is the whole screen.
  if (state.performing && (state.performanceLocked || !walking)) return state.performing;
  if (state.interacting && !walking) return 'talk';
  if (state.speed >= RUN_THRESHOLD) return 'run';
  if (walking) return 'walk';
  return 'idle';
}

/** Cross-fade duration in seconds; one-shot beats snap in for punch. */
export function transitionDuration(from: HeroClip | null, to: HeroClip): number {
  if (from === null) return 0;
  if (to === 'dance' || to === 'agree' || to === 'wave') return 0.12;
  if (from === 'idle' || to === 'idle') return 0.25;
  return 0.18;
}

/** One-shot clips play once and hand control back; the rest loop. */
export function isOneShot(clip: HeroClip): boolean {
  return clip === 'dance' || clip === 'agree' || clip === 'wave';
}
