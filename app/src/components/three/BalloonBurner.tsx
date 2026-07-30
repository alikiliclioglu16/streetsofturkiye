'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, PointLight } from 'three';

/**
 * The burner on the tethered balloon at the stop.
 *
 * A balloon standing still is a balloon; a balloon that fires its burner every
 * so often is a balloon about to go somewhere, which is a much better thing for
 * a child to walk up to. It is also the only way to say "this thing flies" about
 * an object that is, at that moment, not flying.
 *
 * The flame is a cone and a point light, both pulsing. No particles: at this
 * size and distance a shaped, flickering cone reads as flame, and particles
 * would cost a system for something on screen two seconds in ten.
 */

const CYCLE_SECONDS = 9;
const BURN_SECONDS = 1.9;

/** True while the burner is firing, at a moment in the cycle. */
export function isBurning(elapsedSeconds: number, offset = 0): boolean {
  return (elapsedSeconds + offset) % CYCLE_SECONDS < BURN_SECONDS;
}

/**
 * How strongly, 0 to 1.
 *
 * Ramped rather than switched: a burner roars up and dies away, and a flame that
 * appears at full size in one frame reads as a bug.
 */
export function burnerIntensity(elapsedSeconds: number, offset = 0): number {
  const t = (elapsedSeconds + offset) % CYCLE_SECONDS;
  if (t >= BURN_SECONDS) return 0;
  const phase = t / BURN_SECONDS;
  const envelope = Math.sin(phase * Math.PI);
  // Flicker on top of the swell, or it reads as a lamp rather than a flame.
  const flicker = 0.82 + 0.18 * Math.sin(elapsedSeconds * 27);
  return envelope * flicker;
}

export function BalloonBurner({
  height,
  reducedMotion,
}: {
  /** Height of the balloon, so the flame sits under its mouth. */
  height: number;
  reducedMotion: boolean;
}) {
  const flame = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  const elapsed = useRef(0);

  // Just above the basket, under the mouth of the envelope.
  const y = useMemo(() => height * 0.28, [height]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const strength = reducedMotion ? 0 : burnerIntensity(elapsed.current);

    if (flame.current) {
      flame.current.visible = strength > 0.01;
      const scale = 0.4 + strength * 0.9;
      flame.current.scale.set(scale * 0.7, scale, scale * 0.7);
    }
    if (light.current) {
      light.current.intensity = strength * 9;
    }
  });

  return (
    <group position={[0, y, 0]}>
      <mesh ref={flame} visible={false}>
        <coneGeometry args={[0.22, 0.85, 8]} />
        <meshBasicMaterial color="#FFB03A" transparent opacity={0.85} />
      </mesh>
      <pointLight ref={light} color="#FF9A2E" intensity={0} distance={7} decay={2} />
    </group>
  );
}
