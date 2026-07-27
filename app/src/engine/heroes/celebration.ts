import type { HeroClip, HeroDefinition } from '@/engine/heroes/registry';
import { celebrationSequence } from '@/engine/heroes/registry';

/**
 * City completion choreography.
 *
 * Progress is persisted before any of this runs, so a celebration that never
 * finishes — a closed tab, a missing clip — can never cost the child a city.
 *
 * The shape of the celebration comes from the hero's own policy, not from a
 * branch per character: Keloğlan draws one dance from a shuffle bag, Nasreddin
 * Hodja plays a measured agree-then-wave. A third guide only needs a policy.
 */
export type CelebrationState = 'idle' | 'saving' | 'framing' | 'performing' | 'summary';

export type CelebrationEvent =
  | { type: 'CITY_COMPLETED' }
  | { type: 'PROGRESS_SAVED' }
  | { type: 'CAMERA_FRAMED' }
  | { type: 'CLIP_FINISHED' }
  | { type: 'REPLAY' }
  | { type: 'SKIP' };

export interface CelebrationContext {
  readonly state: CelebrationState;
  /** Movement and hotspot input are locked for the whole sequence. */
  readonly inputLocked: boolean;
  /** Index into the current plan. */
  readonly step: number;
  readonly performances: number;
}

export interface CelebrationOptions {
  readonly reducedMotion: boolean;
  /** How many clips this guide plays for a completion. Zero skips straight to the panel. */
  readonly planLength: number;
}

export const initialCelebration: CelebrationContext = {
  state: 'idle',
  inputLocked: false,
  step: 0,
  performances: 0,
};

/**
 * The clips a guide plays on completion. A dance guide performs exactly one
 * drawn clip; a gesture guide performs its authored sequence.
 */
export function celebrationPlan(hero: HeroDefinition): readonly (HeroClip | 'dance')[] {
  if (hero.celebration.kind === 'dance-bag') {
    return hero.celebration.pool.length > 0 ? ['dance'] : [];
  }
  return celebrationSequence(hero);
}

export function celebrationReducer(
  context: CelebrationContext,
  event: CelebrationEvent,
  options: CelebrationOptions,
): CelebrationContext {
  // Reduced motion still awards everything; it just skips the performance.
  const skip = options.reducedMotion || options.planLength === 0;

  switch (context.state) {
    case 'idle':
      if (event.type === 'CITY_COMPLETED') {
        return { state: 'saving', inputLocked: true, step: 0, performances: 0 };
      }
      return context;

    case 'saving':
      if (event.type === 'PROGRESS_SAVED') {
        return skip ? { ...context, state: 'summary' } : { ...context, state: 'framing' };
      }
      return context;

    case 'framing':
      if (event.type === 'CAMERA_FRAMED') return { ...context, state: 'performing', step: 0 };
      if (event.type === 'SKIP') return { ...context, state: 'summary' };
      return context;

    case 'performing': {
      if (event.type === 'CLIP_FINISHED' || event.type === 'SKIP') {
        const nextStep = context.step + 1;
        const done = event.type === 'SKIP' || nextStep >= options.planLength;
        return done
          ? { ...context, state: 'summary', performances: context.performances + 1 }
          : { ...context, step: nextStep };
      }
      return context;
    }

    case 'summary':
      if (event.type === 'REPLAY' && !skip) {
        return { ...context, state: 'performing', step: 0 };
      }
      return context;

    default:
      return context;
  }
}

/** The clip to play right now, or null when nothing is being performed. */
export function currentCelebrationClip(
  context: CelebrationContext,
  plan: readonly (HeroClip | 'dance')[],
): HeroClip | null {
  if (context.state !== 'performing') return null;
  return (plan[context.step] as HeroClip | undefined) ?? null;
}

/** The camera anchor used to frame the guide for a celebration. */
export function celebrationCamera(position: readonly [number, number, number]): {
  position: [number, number, number];
  target: [number, number, number];
  durationMs: number;
} {
  const [x, , z] = position;
  return {
    // Medium/full-body framing: back off and drop to chest height.
    position: [x + 1.2, 2.2, z + 5.4],
    target: [x, 1.0, z],
    durationMs: 700,
  };
}
