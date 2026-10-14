/**
 * The Time Window lifecycle, as a pure reducer.
 *
 * The hard part of this system is not the effects — it is putting the scene
 * back. A window temporarily changes the camera, the lights, the sky, material
 * emissive and opacity, object transforms, and spawns objects that did not
 * exist; and it can be abandoned from four different places: the skip button,
 * Back to map, a route change, and unmount.
 *
 * So `cancel` is not a side path. It is an equal exit, and both exits go
 * through the same restore and cleanup:
 *
 *   idle → starting → snapshot → playing → completing | cancelling
 *        → restoring → cleanup → reward gate → idle
 *
 * Keeping it a reducer means the order can be tested without a renderer, which
 * matters because every bug this system can have is invisible on screen until
 * it has already corrupted something.
 */

export type TimeWindowState =
  | 'idle'
  | 'starting'
  | 'playing'
  | 'completing'
  | 'cancelling'
  | 'restoring'
  | 'finished';

export type TimeWindowEvent =
  | { type: 'START' }
  /** The snapshot has been taken; effects may now touch the scene. */
  | { type: 'SNAPSHOT_TAKEN' }
  | { type: 'ELAPSED'; seconds: number }
  /** Skip, Back to map, route change, unmount — all arrive here. */
  | { type: 'CANCEL'; reason: CancelReason }
  | { type: 'RESTORED' }
  /**
   * Back to the beginning, for a different window or a second visit.
   *
   * A run ends in `completing`, `cancelling` or `finished` and nothing walked
   * it back, so one runner could play exactly one window for the life of a
   * city: a child who left a stop and returned found a state that was not
   * `idle`, an auto-play that refused to fire, and — because the card is
   * withheld wherever a window is eligible — a stop with nothing on it at all.
   * Reset is dispatched when the window being held changes, which includes
   * changing to none (D-226).
   */
  | { type: 'RESET'; duration: number };

export type CancelReason = 'skip' | 'leave' | 'route' | 'unmount';

export interface TimeWindowContext {
  readonly state: TimeWindowState;
  readonly elapsed: number;
  readonly duration: number;
  /** Null until the window ends. `complete` is the only one that pays out. */
  readonly outcome: 'complete' | 'cancel' | null;
  readonly cancelReason: CancelReason | null;
}

export function initialTimeWindowContext(duration: number): TimeWindowContext {
  return { state: 'idle', elapsed: 0, duration, outcome: null, cancelReason: null };
}

/**
 * A cancel is accepted in every state that has touched anything.
 *
 * Including `starting`: the snapshot may already have been taken when the
 * player hits Back, and dropping the cancel there would leave the scene with a
 * snapshot nobody restores.
 */
const CANCELLABLE: readonly TimeWindowState[] = ['starting', 'playing'];

export function timeWindowReducer(
  context: TimeWindowContext,
  event: TimeWindowEvent,
): TimeWindowContext {
  // Accepted from every state, including mid-flight: the window it belonged to
  // is gone, so there is nothing left for the old context to describe.
  if (event.type === 'RESET') return initialTimeWindowContext(event.duration);

  if (event.type === 'CANCEL' && CANCELLABLE.includes(context.state)) {
    return { ...context, state: 'cancelling', outcome: 'cancel', cancelReason: event.reason };
  }

  switch (context.state) {
    case 'idle':
      if (event.type === 'START') return { ...context, state: 'starting', elapsed: 0 };
      return context;

    case 'starting':
      if (event.type === 'SNAPSHOT_TAKEN') return { ...context, state: 'playing' };
      return context;

    case 'playing':
      if (event.type === 'ELAPSED') {
        const elapsed = context.elapsed + event.seconds;
        /**
         * Epsilon, because a clock is a sum of floats.
         *
         * Ninety frames of 0.1 s add up to 8.999999999999998, which is not
         * 9 — so a window driven at a steady rate would sit one frame short of
         * its own end forever, holding the controls locked and the HUD hidden
         * with no way out but a cancel. The tolerance is a hundredth of a
         * frame at 60 Hz: far below anything a child could see, far above the
         * error that accumulates over twelve seconds.
         */
        if (elapsed >= context.duration - 1e-4) {
          return { ...context, elapsed: context.duration, state: 'completing', outcome: 'complete' };
        }
        return { ...context, elapsed };
      }
      return context;

    case 'completing':
    case 'cancelling':
      if (event.type === 'RESTORED') return { ...context, state: 'restoring' };
      return context;

    case 'restoring':
      if (event.type === 'RESTORED') return { ...context, state: 'finished' };
      return context;

    default:
      return context;
  }
}

/** Only a window that ran to the end pays out. Skipping earns nothing. */
export function shouldGrantReward(context: TimeWindowContext): boolean {
  return context.outcome === 'complete';
}

/**
 * When the skip button may appear, in seconds.
 *
 * Not zero: the first moment belongs to the child working out that something is
 * happening, and a button that is there from the first frame reads the window
 * as a thing to be dismissed. Not hard-coded either — this is a pilot value and
 * the only way to settle it is to watch a child.
 */
export const SKIP_AVAILABLE_AFTER_SECONDS = 1.2;

export function skipAvailable(context: TimeWindowContext, after = SKIP_AVAILABLE_AFTER_SECONDS): boolean {
  return context.state === 'playing' && context.elapsed >= after;
}

/**
 * How long a stop waits for its window before giving up and showing the card.
 *
 * The card is withheld wherever a window is eligible, which is right until the
 * window does not start — and then the stop has no card, no cinematic and the
 * controls still taken away. That is the frozen screen, and no amount of
 * correctness elsewhere excuses leaving a child in front of it.
 *
 * Long enough that a normal start is never cut off (a start is one commit, so
 * tens of milliseconds), short enough that nobody reads the pause as the
 * window itself.
 */
export const WINDOW_STALL_MS = 900;
