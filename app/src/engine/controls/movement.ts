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
