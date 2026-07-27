import type { HeroClip } from '@/engine/heroes/registry';

/**
 * Data-driven clip selection. The scene reports what the hero is doing and this
 * maps it to a clip; adding a state means editing this table, not the renderer.
 */
export interface HeroMotionState {
  /** Metres per second along the ground plane. */
  readonly speed: number;
  readonly interacting: boolean;
  readonly celebrating: boolean;
}

const WALK_THRESHOLD = 0.15;
const RUN_THRESHOLD = 5.0;

export function clipForState(state: HeroMotionState): HeroClip {
  if (state.celebrating) return 'dance';
  if (state.interacting) return 'talk';
  if (state.speed >= RUN_THRESHOLD) return 'run';
  if (state.speed >= WALK_THRESHOLD) return 'walk';
  return 'idle';
}

/** Cross-fade duration in seconds; celebration snaps in for punch. */
export function transitionDuration(from: HeroClip | null, to: HeroClip): number {
  if (from === null) return 0;
  if (to === 'dance') return 0.12;
  if (from === 'idle' || to === 'idle') return 0.25;
  return 0.18;
}
