'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AssetInstance } from '@/components/three/AssetInstance';
import { gust, heightFactor, sway } from '@/engine/environment/wind';
import type { ResolvedAsset } from '@/engine/assets/registry';

/**
 * A prop that leans in the wind.
 *
 * Used for the flag, which is the one object on the street whose stillness is
 * conspicuous: a flag hanging dead reads as a flag on a windless day, and a
 * windless day reads as a scene that has stopped.
 *
 * The whole model leans rather than the cloth rippling. Rippling needs bones
 * the delivered file does not have, and at six metres a lean says wind well
 * enough that a child reads the street as alive.
 */
export function WindProp({
  asset,
  position,
  rotationY,
  reducedMotion,
}: {
  asset: ResolvedAsset;
  position: readonly [number, number, number];
  rotationY: number;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  const phase = position[0] * 0.21 + position[2] * 0.13;
  const factor = heightFactor(asset.entry.dimensions[1]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node || reducedMotion) return;
    elapsed.current += delta;
    const lean = sway(elapsed.current, phase, gust(elapsed.current)) * factor;
    node.rotation.set(lean * 0.5, rotationY, lean);
  });

  return (
    <group ref={group} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      <AssetInstance asset={asset} />
    </group>
  );
}
