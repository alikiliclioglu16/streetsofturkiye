/**
 * City completion choreography.
 *
 * Progress is persisted before any of this runs, so a dance that never
 * finishes — a closed tab, a failed clip — can never cost the child a city.
 */
export type CelebrationState =
  | 'idle'
  | 'saving'
  | 'framing'
  | 'dancing'
  | 'summary';

export type CelebrationEvent =
  | { type: 'CITY_COMPLETED' }
  | { type: 'PROGRESS_SAVED' }
  | { type: 'CAMERA_FRAMED' }
  | { type: 'DANCE_FINISHED' }
  | { type: 'ANOTHER_DANCE' }
  | { type: 'SKIP' };

export interface CelebrationContext {
  readonly state: CelebrationState;
  /** Movement and hotspot input are locked for the whole sequence. */
  readonly inputLocked: boolean;
  readonly dancesPlayed: number;
}

export const initialCelebration: CelebrationContext = {
  state: 'idle',
  inputLocked: false,
  dancesPlayed: 0,
};

/**
 * Reduced motion skips the dance entirely and goes straight to the summary;
 * the child still gets the reward, just without the movement.
 */
export function celebrationReducer(
  context: CelebrationContext,
  event: CelebrationEvent,
  options: { reducedMotion: boolean; hasDanceClips: boolean },
): CelebrationContext {
  const skipDance = options.reducedMotion || !options.hasDanceClips;

  switch (context.state) {
    case 'idle':
      if (event.type === 'CITY_COMPLETED') {
        return { state: 'saving', inputLocked: true, dancesPlayed: 0 };
      }
      return context;

    case 'saving':
      if (event.type === 'PROGRESS_SAVED') {
        return skipDance
          ? { ...context, state: 'summary' }
          : { ...context, state: 'framing' };
      }
      return context;

    case 'framing':
      if (event.type === 'CAMERA_FRAMED') return { ...context, state: 'dancing' };
      if (event.type === 'SKIP') return { ...context, state: 'summary' };
      return context;

    case 'dancing':
      if (event.type === 'DANCE_FINISHED') {
        return { ...context, state: 'summary', dancesPlayed: context.dancesPlayed + 1 };
      }
      if (event.type === 'SKIP') {
        return { ...context, state: 'summary', dancesPlayed: context.dancesPlayed + 1 };
      }
      return context;

    case 'summary':
      if (event.type === 'ANOTHER_DANCE' && !skipDance) {
        return { ...context, state: 'dancing' };
      }
      return context;

    default:
      return context;
  }
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
