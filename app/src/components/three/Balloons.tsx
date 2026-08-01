'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AssetInstance } from '@/components/three/AssetInstance';
import { gust, sway } from '@/engine/environment/wind';
import type { ResolvedAsset } from '@/engine/assets/registry';

/**
 * Balloons over Cappadocia.
 *
 * The one image everybody has of this place, and the reason the front of the
 * street needed answering with sky rather than with a wall.
 *
 * One model, drawn at several sizes and distances. Size is the whole trick: a
 * sky of identical balloons is one balloon copied, while the same balloon at
 * four scales, four heights and four distances is a morning with balloons in it.
 * Perspective does the rest.
 */

export interface BalloonSpec {
  readonly key: string;
  /** Where its crossing is centred, in world metres. */
  readonly position: readonly [number, number, number];
  readonly scale: number;
  /** Multiplier on the crossing speed, so they do not fly in formation. */
  readonly driftSpeed: number;
  readonly phase: number;
  /**
   * How far it wanders either side of where it belongs, in metres.
   *
   * Forty-five by default, which is right over a Cappadocian valley and wrong
   * over a street: Ordu's paragliders were placed within thirty metres of the
   * walk and the drift carried them ninety metres across, so most of the time
   * they were outside the frame. Three placements were tried before the drift
   * turned out to be what was hiding them.
   */
  readonly driftAmplitude?: number;
}

/**
 * How far a balloon wanders either side of where it belongs, in metres.
 *
 * Large enough that the movement is obvious — the first attempt used six metres,
 * which at balloon distance is invisible.
 */
export const DRIFT_AMPLITUDE = 45;

/**
 * Radians per second of the wander. About a ninety second round trip, which puts
 * roughly thirty metres of travel in the first ten — visible immediately without
 * looking like a balloon in a hurry.
 */
export const DRIFT_RATE = 0.067;

/**
 * Where a balloon is at a moment, relative to where it belongs.
 *
 * A wander rather than a crossing that wraps. Wrapping meant a balloon reaching
 * the end of its run teleported back to the start, in full view of a child
 * looking up at it — and seeding a phase into that wrap put some of them a
 * hundred metres off-screen at load, so they took minutes to arrive. Nobody
 * stays in one city that long.
 *
 * Pure, so "is the sky full when a child arrives" is a test rather than
 * something to sit and watch for.
 */
export function balloonOffsetAt(spec: BalloonSpec, seconds: number): number {
  const amplitude = spec.driftAmplitude ?? DRIFT_AMPLITUDE;
  return Math.sin(seconds * DRIFT_RATE * spec.driftSpeed + spec.phase) * amplitude;
}

function Balloon({
  asset,
  spec,
  reducedMotion,
}: {
  asset: ResolvedAsset;
  spec: BalloonSpec;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    if (reducedMotion) {
      node.position.set(...(spec.position as [number, number, number]));
      return;
    }
    elapsed.current += delta;
    const t = elapsed.current;

    /**
     * Flying, and already in the sky when the child looks up.
     *
     * The travel is along x because a balloon goes where the air goes, and the
     * air here crosses the valley rather than running down the street.
     */
    const x = spec.position[0] + balloonOffsetAt(spec, t);

    // Slow rise and fall on top, at a period unrelated to the crossing.
    const lift = Math.sin(t * 0.055 + spec.phase * 0.7) * 2.4;
    const wander = Math.sin(t * 0.031 + spec.phase * 1.6) * 5;

    node.position.set(x, spec.position[1] + lift, spec.position[2] + wander);
    const lean = sway(t * 0.35, spec.phase, gust(t)) * 0.7;
    node.rotation.set(lean * 0.5, spec.phase, lean);
  });

  return (
    <group ref={group} position={spec.position as [number, number, number]} scale={spec.scale}>
      <AssetInstance asset={asset} castShadow={false} />
    </group>
  );
}

export function Balloons({
  asset,
  specs,
  reducedMotion,
}: {
  asset: ResolvedAsset | null;
  specs: readonly BalloonSpec[];
  reducedMotion: boolean;
}) {
  const list = useMemo(() => specs, [specs]);
  if (!asset || list.length === 0) return null;

  return (
    <group>
      {list.map((spec) => (
        <Balloon key={spec.key} asset={asset} spec={spec} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
