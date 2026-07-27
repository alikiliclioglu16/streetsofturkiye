import type { HeroClip } from '@/engine/heroes/registry';

/**
 * Data-driven clip selection. The scene reports what the hero is doing and this
 * maps it to a clip; adding a state means editing this table, not the renderer.
 */
export interface HeroMotionState {
  /** Metres per second along the ground plane. */
  readonly speed: number;
  /** Height above the ground; anything above zero is mid-hop. */
  readonly airborne?: boolean;
  readonly interacting: boolean;
  /**
   * A one-shot clip the choreography is driving — a celebration step or a
   * success gesture. It outranks locomotion so the guide finishes the beat.
   */
  readonly performing: HeroClip | null;
}

const WALK_THRESHOLD = 0.15;
/**
 * Sits between the walk and run speeds (4.2 and 7.4 m/s). It used to be 5.0
 * with a 4.2 top speed, so the run clip could never play at all.
 */
const RUN_THRESHOLD = 5.6;

export function clipForState(state: HeroMotionState): HeroClip {
  if (state.performing) return state.performing;
  if (state.interacting) return 'talk';
  /**
   * Neither hero ships a jump clip, so a hop keeps whatever locomotion clip
   * was already playing rather than snapping to idle in mid-air. A `Jump`
   * clip in the next Meshy export would replace this line.
   */
  if (state.airborne) return state.speed >= RUN_THRESHOLD ? 'run' : 'walk';
  if (state.speed >= RUN_THRESHOLD) return 'run';
  if (state.speed >= WALK_THRESHOLD) return 'walk';
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
