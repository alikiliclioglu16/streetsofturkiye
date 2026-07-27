import type { Vec3 } from '@/content/schemas/city';

export const MIN_PITCH = -0.35;
export const MAX_PITCH = 0.45;
export const FOLLOW_DISTANCE = 7.5;
export const FOLLOW_HEIGHT = 3.4;

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
