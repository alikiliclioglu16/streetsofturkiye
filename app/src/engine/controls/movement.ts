import type { Vec3 } from '@/content/schemas/scene';

export interface Point2 {
  x: number;
  z: number;
}

export const toPoint2 = (v: Vec3): Point2 => ({ x: v[0], z: v[2] });

/**
 * Curated boundary test. The route polygon in city data is the play area;
 * this is a ray-casting point-in-polygon check, not a physics simulation
 * (PRODUCT_REQUIREMENTS: "gentle collision and curated boundaries").
 */
export function isInsideBounds(point: Point2, bounds: readonly Vec3[]): boolean {
  let inside = false;
  for (let i = 0, j = bounds.length - 1; i < bounds.length; j = i, i += 1) {
    const a = bounds[i];
    const b = bounds[j];
    if (!a || !b) continue;
    const [ax, , az] = a;
    const [bx, , bz] = b;
    const intersects =
      az > point.z !== bz > point.z &&
      point.x < ((bx - ax) * (point.z - az)) / (bz - az) + ax;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Returns the requested position when legal, otherwise slides along whichever
 * single axis remains legal. Prevents the player sticking to a wall.
 */
export function clampToBounds(from: Point2, to: Point2, bounds: readonly Vec3[]): Point2 {
  if (isInsideBounds(to, bounds)) return to;

  const slideX = { x: to.x, z: from.z };
  if (isInsideBounds(slideX, bounds)) return slideX;

  const slideZ = { x: from.x, z: to.z };
  if (isInsideBounds(slideZ, bounds)) return slideZ;

  return from;
}

export interface MoveInput {
  forward: number;
  strafe: number;
}

export const MOVE_SPEED = 4.2;
/** Shift. Kept clearly above the walk speed so the run clip actually plays. */
export const RUN_SPEED = 7.4;


/** Frame-rate independent step. Diagonal input is normalised. */
export function stepPosition(
  position: Point2,
  input: MoveInput,
  heading: number,
  delta: number,
  bounds: readonly Vec3[],
): Point2 {
  const magnitude = Math.hypot(input.forward, input.strafe);
  if (magnitude < 0.001) return position;

  const forward = input.forward / magnitude;
  const strafe = input.strafe / magnitude;
  const distance = MOVE_SPEED * delta;

  const sin = Math.sin(heading);
  const cos = Math.cos(heading);

  const target: Point2 = {
    x: position.x + (forward * sin + strafe * cos) * distance,
    z: position.z + (forward * cos - strafe * sin) * distance,
  };

  return clampToBounds(position, target, bounds);
}

export function distance2(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Axis-aligned solid footprint on the ground plane. */
export interface RectCollider {
  readonly x: number;
  readonly z: number;
  readonly halfWidth: number;
  readonly halfDepth: number;
}

/** Roughly the guide's shoulder width, so he stops at a wall rather than in it. */
export const PLAYER_RADIUS = 0.45;

export function isInsideCollider(point: Point2, collider: RectCollider, padding = PLAYER_RADIUS): boolean {
  return (
    Math.abs(point.x - collider.x) <= collider.halfWidth + padding &&
    Math.abs(point.z - collider.z) <= collider.halfDepth + padding
  );
}

export function blockedBy(
  point: Point2,
  colliders: readonly RectCollider[],
  padding = PLAYER_RADIUS,
): RectCollider | null {
  for (const collider of colliders) {
    if (isInsideCollider(point, collider, padding)) return collider;
  }
  return null;
}

/**
 * Gentle collision, as the product brief asks for: the player never passes
 * through a building, but never gets stuck on one either. A blocked move is
 * retried one axis at a time so walking into a wall slides along it.
 */
export function resolveMovement(
  from: Point2,
  to: Point2,
  bounds: readonly Vec3[],
  colliders: readonly RectCollider[],
): Point2 {
  const legal = (candidate: Point2) =>
    isInsideBounds(candidate, bounds) && blockedBy(candidate, colliders) === null;

  if (legal(to)) return to;

  const slideX = { x: to.x, z: from.z };
  if (legal(slideX)) return slideX;

  const slideZ = { x: from.x, z: to.z };
  if (legal(slideZ)) return slideZ;

  return from;
}

/** Manual movement with both the play-area boundary and solid objects applied. */
export function stepWithCollision(
  position: Point2,
  input: MoveInput,
  heading: number,
  delta: number,
  bounds: readonly Vec3[],
  colliders: readonly RectCollider[],
  running = false,
): Point2 {
  const magnitude = Math.hypot(input.forward, input.strafe);
  if (magnitude < 0.001) return position;

  const forward = input.forward / magnitude;
  const strafe = input.strafe / magnitude;
  const distance = (running ? RUN_SPEED : MOVE_SPEED) * delta;
  const sin = Math.sin(heading);
  const cos = Math.cos(heading);

  const target: Point2 = {
    x: position.x + (forward * sin + strafe * cos) * distance,
    z: position.z + (forward * cos - strafe * sin) * distance,
  };

  return resolveMovement(position, target, bounds, colliders);
}
