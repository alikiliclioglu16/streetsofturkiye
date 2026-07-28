import type { Vec3 } from '@/content/schemas/scene';

export const MIN_PITCH = -0.35;
export const MAX_PITCH = 0.45;
/**
 * Follow camera framing.
 *
 * At 7.5 m back and 3.4 m up with a 55° field of view, the guide filled about
 * a fifth of the frame — the whole street read as a model seen from across a
 * room, and everything in it looked small even though every object was the
 * size it claimed. Third-person framing usually puts the character at a
 * quarter to two fifths of frame height; this sits at about a third.
 */
export const FOLLOW_DISTANCE = 5.2;
export const FOLLOW_HEIGHT = 2.3;

/**
 * How fast a dragged camera swings back behind the guide once he moves.
 *
 * The camera used to be locked to his heading, so turning turned them both and
 * his face was never visible. Now dragging orbits freely; walking gently
 * recentres, so a child cannot get stuck staring sideways.
 */
export const ORBIT_RECENTRE_PER_SECOND = 0.8;

export function decayOrbit(offset: number, moving: boolean, delta: number): number {
  if (!moving) return offset;
  const decay = Math.exp(-ORBIT_RECENTRE_PER_SECOND * delta);
  return Math.abs(offset) < 0.01 ? 0 : offset * decay;
}

export function clampPitch(pitch: number): number {
  return Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitch));
}

/** Third-person follow position behind the player for the given heading. */
export function followCameraPosition(
  x: number,
  z: number,
  heading: number,
  pitch: number,
): Vec3 {
  const distance = FOLLOW_DISTANCE * Math.cos(pitch);
  return [
    x - Math.sin(heading) * distance,
    FOLLOW_HEIGHT + FOLLOW_DISTANCE * Math.sin(pitch),
    z - Math.cos(heading) * distance,
  ];
}

/**
 * Smoothing factor that is frame-rate independent.
 * Returns 1 when motion should be instant (reduced-motion), avoiding the
 * forced camera travel that EXPERIENCE_DESIGN rules out.
 */
export function smoothing(delta: number, durationMs: number, reducedMotion: boolean): number {
  if (reducedMotion || durationMs <= 0) return 1;
  return Math.min(1, delta / (durationMs / 1000) * 2.2);
}
