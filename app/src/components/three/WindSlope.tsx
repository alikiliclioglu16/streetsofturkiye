'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AssetInstance } from '@/components/three/AssetInstance';
import { gust, sway } from '@/engine/environment/wind';
import type { ResolvedAsset } from '@/engine/assets/registry';

/**
 * A hillside that breathes in the wind.
 *
 * **This is not the right tool and it is worth saying so in the file.** What
 * moves on a tea terrace is the bushes, and the delivered slope is one baked
 * mesh with the bushes painted into it — so the only thing that can move is the
 * whole hill, and a hill that sways is an earthquake.
 *
 * So the amplitude is held to a fifteenth of the flag's: about a quarter of a
 * degree, which at thirteen metres moves the ridgeline six centimetres. That is
 * under a pixel of travel for most of the slope and just enough at the
 * silhouette to stop the horizon reading as a photograph. It is a floor, not
 * the effect that was asked for.
 *
 * The effect that was asked for needs a `kit_trabzon_tea_bush` to scatter and
 * sway at full strength, the way `kit_bolu_leaf_fall` sits on Bolu's street.
 * `WindProp` already does that job and nothing here would be needed.
 *
 * `heightFactor` is deliberately not used. It scales sway *up* with height and
 * caps at six metres, which is right for a flagpole and exactly backwards for a
 * landform — a thirteen metre hill would take the full four degrees.
 */

/** How much of the flag's sway a landform gets. */
export const SLOPE_SWAY_FRACTION = 1 / 15;

export function WindSlope({
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
  /**
   * Phase from the piece's own place, so fourteen slopes do not lean together.
   * Same trick as the street trees, and the same reason: unison reads as the
   * ground moving rather than as air moving over it.
   */
  const phase = position[0] * 0.19 + position[2] * 0.11;

  useFrame((_, delta) => {
    const node = group.current;
    if (!node || reducedMotion) return;
    elapsed.current += Math.min(delta, 0.05);
    const lean = sway(elapsed.current, phase, gust(elapsed.current)) * SLOPE_SWAY_FRACTION;
    // Rolled about Z only. A landform pitching forward and back looks like it
    // is coming loose; rolling reads as the canopy moving across it.
    node.rotation.set(0, rotationY, lean);
  });

  return (
    <group ref={group} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      <AssetInstance asset={asset} castShadow={false} />
    </group>
  );
}
