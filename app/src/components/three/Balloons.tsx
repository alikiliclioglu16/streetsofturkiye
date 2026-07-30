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
}

/** Metres a balloon crosses before wrapping round to start again. */
export const TRAVEL_SPAN = 260;

/** Metres per second at the base speed. A balloon is not in a hurry. */
export const DRIFT_SPEED = 1.15;

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
     * Actually flying, not swaying on the spot.
     *
     * The first version drifted six metres either side of a fixed point, which
     * at balloon distances is invisible: they read as pinned to the sky. A
     * balloon crosses the sky. These travel the length of the street and wrap
     * around to start again, so a child looking up twice sees a different sky.
     *
     * The travel is along x because a balloon goes where the air goes and the
     * air here is crossing the valley, not running down the street.
     */
    const travelled = (t * DRIFT_SPEED * spec.driftSpeed + spec.phase * 40) % TRAVEL_SPAN;
    const x = spec.position[0] - TRAVEL_SPAN / 2 + travelled;

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
