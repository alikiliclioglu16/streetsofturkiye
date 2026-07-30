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
  /** Where it drifts, in world metres. */
  readonly position: readonly [number, number, number];
  readonly scale: number;
  /** Metres of drift along the street before turning back. */
  readonly drift: number;
  readonly phase: number;
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
     * Drifting, not flying a route.
     *
     * A balloon has no engine; it goes where the air goes. Slow lateral drift,
     * a slower rise and fall, and a lean from the same wind that moves the flag.
     */
    const alongZ = Math.sin(t * 0.035 + spec.phase) * spec.drift;
    const alongX = Math.sin(t * 0.021 + spec.phase * 1.6) * spec.drift * 0.45;
    const lift = Math.sin(t * 0.06 + spec.phase * 0.7) * 1.6;

    node.position.set(
      spec.position[0] + alongX,
      spec.position[1] + lift,
      spec.position[2] + alongZ,
    );
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
