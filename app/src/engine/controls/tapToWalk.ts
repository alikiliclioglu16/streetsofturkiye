/**
 * Walking by tapping where you want to go.
 *
 * A virtual stick asks a child to learn a control before they can see the city.
 * It works — the owner confirmed the whole game runs on a tablet — but it
 * takes getting used to, and getting used to a joystick is not what this
 * product is for.
 *
 * Tapping the ground is the control every child already knows. The stick stays
 * for anyone who prefers it, and taking hold of it cancels the walk.
 */

export interface Destination {
  readonly x: number;
  readonly z: number;
}

/** How close counts as arrived, in metres. */
export const ARRIVE_RADIUS = 0.6;

/**
 * How long the guide will keep trying before giving up.
 *
 * A destination behind a building is reachable by walking round; a destination
 * inside one is not. Rather than pathfind, the guide walks and slides, and
 * stops asking after a while — which looks like a child changing their mind
 * and is far less code than a navigation mesh for a street.
 */
export const GIVE_UP_SECONDS = 12;

export interface WalkState {
  destination: Destination | null;
  elapsed: number;
  /** Where the guide was a moment ago, to notice being wedged. */
  lastProgressAt: number;
  lastDistance: number;
}

export const idleWalk: WalkState = {
  destination: null,
  elapsed: 0,
  lastProgressAt: 0,
  lastDistance: Infinity,
};

export function walkTo(destination: Destination): WalkState {
  return { destination, elapsed: 0, lastProgressAt: 0, lastDistance: Infinity };
}

export interface WalkStep {
  readonly state: WalkState;
  /** Heading to face, or null when there is nowhere to go. */
  readonly heading: number | null;
  readonly forward: number;
}

/**
 * One frame of walking towards a tapped point.
 *
 * Pure: a guide who never arrives, or who keeps walking into a wall forever,
 * is a failing test rather than something to notice while playing.
 */
export function stepWalk(
  state: WalkState,
  at: { x: number; z: number },
  delta: number,
): WalkStep {
  const { destination } = state;
  if (!destination) return { state, heading: null, forward: 0 };

  const dx = destination.x - at.x;
  const dz = destination.z - at.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= ARRIVE_RADIUS) {
    return { state: idleWalk, heading: null, forward: 0 };
  }

  const elapsed = state.elapsed + delta;
  if (elapsed > GIVE_UP_SECONDS) {
    return { state: idleWalk, heading: null, forward: 0 };
  }

  // Wedged against something: closer than a metre of progress in three seconds.
  const madeProgress = distance < state.lastDistance - 0.05;
  const lastProgressAt = madeProgress ? elapsed : state.lastProgressAt;
  if (elapsed - lastProgressAt > 3) {
    return { state: idleWalk, heading: null, forward: 0 };
  }

  return {
    state: {
      destination,
      elapsed,
      lastProgressAt,
      lastDistance: madeProgress ? distance : state.lastDistance,
    },
    heading: Math.atan2(dx, dz),
    forward: 1,
  };
}

/**
 * Turns towards a heading at a rate a child can follow.
 *
 * Snapping to face the tap would be correct and would look like the guide had
 * been teleported round. He turns.
 */
export const TURN_RATE = 4.5;

export function turnTowards(current: number, target: number, delta: number): number {
  let difference = target - current;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  const step = Math.max(-1, Math.min(1, difference / 0.35)) * TURN_RATE * delta;
  return current + step;
}
