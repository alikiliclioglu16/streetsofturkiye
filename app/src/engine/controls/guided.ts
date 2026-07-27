import type { Vec3 } from '@/content/schemas/scene';
import { distance2, toPoint2, type Point2 } from '@/engine/controls/movement';

export interface GuidedState {
  /** Index of the route point currently being approached. */
  targetIndex: number;
  position: Point2;
  finished: boolean;
}

export const GUIDED_SPEED = 3.0;
const ARRIVE_EPSILON = 0.25;

export function createGuidedState(points: readonly Vec3[]): GuidedState {
  const first = points[0];
  return {
    targetIndex: Math.min(1, points.length - 1),
    position: first ? toPoint2(first) : { x: 0, z: 0 },
    finished: points.length < 2,
  };
}

/**
 * Automated route follower. Shares the movement contract with the manual
 * controller: both produce a Point2 per frame, so downstream systems
 * (hotspot proximity, camera, animation) do not know which mode is active.
 */
export function advanceGuided(
  state: GuidedState,
  points: readonly Vec3[],
  delta: number,
  paused: boolean,
): GuidedState {
  if (state.finished || paused) return state;

  const target = points[state.targetIndex];
  if (!target) return { ...state, finished: true };

  const targetPoint = toPoint2(target);
  const remaining = distance2(state.position, targetPoint);
  const step = GUIDED_SPEED * delta;

  if (remaining <= Math.max(step, ARRIVE_EPSILON)) {
    const nextIndex = state.targetIndex + 1;
    if (nextIndex >= points.length) {
      return { targetIndex: state.targetIndex, position: targetPoint, finished: true };
    }
    return { targetIndex: nextIndex, position: targetPoint, finished: false };
  }

  const ratio = step / remaining;
  return {
    ...state,
    position: {
      x: state.position.x + (targetPoint.x - state.position.x) * ratio,
      z: state.position.z + (targetPoint.z - state.position.z) * ratio,
    },
  };
}

export function headingTowards(from: Point2, to: Point2): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

export interface GuidedStop {
  readonly id: string;
  readonly position: Point2;
  readonly triggerRadius: number;
  readonly order: number;
}

/**
 * Guided mode must stop at each unfinished stop instead of walking past it
 * (Gate A finding A-03).
 *
 * Returns the id of the stop that is currently holding the walk, or null when
 * the route is free to continue. A stop that is already completed never blocks
 * again, so the walk resumes by itself once the reward panel is dismissed and
 * progress has recorded the hotspot.
 */
export function guidedPauseHotspot(
  position: Point2,
  stops: readonly GuidedStop[],
  completedIds: readonly string[],
): string | null {
  const completed = new Set(completedIds);
  const blocking = stops
    .filter((stop) => !completed.has(stop.id))
    .filter((stop) => distance2(position, stop.position) <= stop.triggerRadius)
    .sort((a, b) => a.order - b.order);

  return blocking[0]?.id ?? null;
}
