'use client';

import { AssetInstance } from '@/components/three/AssetInstance';
import type { ResolvedAsset } from '@/engine/assets/registry';

/**
 * A statue on a plinth.
 *
 * The plinth is drawn rather than delivered: three boxes — a base slab, a
 * tapered shaft and a cap — in the city's own stone. That is on purpose. A
 * pedestal is a rectangle with a lip on it, and commissioning a model, hauling
 * 30 MB of baked texture through the optimiser and spending a registry entry to
 * get one would be paying a great deal for a cuboid. The play bounds are drawn
 * the same way and for the same reason.
 *
 * What sits on top is a real asset, because a dove is not a rectangle.
 *
 * The proportions are the ordinary ones a monument has: the cap slightly wider
 * than the shaft, the base wider than the cap, and the shaft narrowing as it
 * rises. Getting those wrong is what makes a plinth read as a cardboard box.
 */

export interface StatueMount {
  readonly key: string;
  readonly asset: ResolvedAsset;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  /** Height of the plinth's top face above the ground, in metres. */
  readonly plinthHeight: number;
  /** Width of the shaft at its top. The base and cap step out from this. */
  readonly plinthWidth: number;
  readonly stoneColor: string;
}

export function Statue({ mount }: { mount: StatueMount }) {
  const { position, rotationY, plinthHeight, plinthWidth: w, stoneColor } = mount;

  const baseH = plinthHeight * 0.14;
  const capH = plinthHeight * 0.1;
  const shaftH = plinthHeight - baseH - capH;

  return (
    <group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      {/* Base slab, stepped out and low. */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 1.5, baseH, w * 1.5]} />
        <meshStandardMaterial color={stoneColor} roughness={0.9} />
      </mesh>

      {/*
        The shaft, tapered. A cylinder with different top and bottom radii and
        four sides is a square shaft that narrows — cheaper than stacking boxes
        and it keeps the corners sharp, which stone has and a barrel does not.
      */}
      <mesh position={[0, baseH + shaftH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[(w * 0.86) / Math.SQRT2, w / Math.SQRT2, shaftH, 4]} />
        <meshStandardMaterial color={stoneColor} roughness={0.85} />
      </mesh>

      {/* Cap, the lip the statue stands on. */}
      <mesh position={[0, baseH + shaftH + capH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 1.22, capH, w * 1.22]} />
        <meshStandardMaterial color={stoneColor} roughness={0.8} />
      </mesh>

      {/*
        The bird. `AssetInstance` grounds a model to its own group's origin
        (D-185), so lifting the group to the top of the plinth stands it on the
        cap rather than burying it in the shaft.
      */}
      <group position={[0, plinthHeight, 0]}>
        <AssetInstance asset={mount.asset} castShadow />
      </group>
    </group>
  );
}
