'use client';

import { useMemo } from 'react';

/**
 * A stylised street tree.
 *
 * Generated rather than commissioned: a tree is a trunk and a few masses, and
 * at this art level geometry says more than a texture would. Roughly 250
 * triangles each, so a dozen of them cost less than one street cat.
 *
 * Three deterministic silhouettes — a cypress, a rounded plane tree, a smaller
 * shrub — because a street planted with one repeated shape reads as wallpaper.
 */

export type TreeKind = 'cypress' | 'plane' | 'shrub' | 'poplar';

export const FOLIAGE = ['#4F7A46', '#5C8A50', '#456B3E'];

export interface StreetTreeSpec {
  readonly key: string;
  readonly position: readonly [number, number, number];
  readonly kind: TreeKind;
  readonly scale: number;
  readonly rotationY: number;
}

/** Shared by the single-tree renderer and the instanced one. */
export function treeShape(kind: TreeKind) {
  switch (kind) {
    case 'cypress':
      return { trunk: 2.0, radius: 0.13, masses: [{ y: 3.4, r: 1.0, h: 4.6, colour: 0 }] };
    case 'poplar':
      // Tall, narrow, and planted in lines across the Anatolian plateau. A
      // street in Nevşehir lined with plane trees would be a picture of
      // somewhere else.
      return { trunk: 2.6, radius: 0.11, masses: [{ y: 4.6, r: 0.75, h: 6.2, colour: 1 }] };
    case 'plane':
      return {
        trunk: 1.9,
        radius: 0.19,
        masses: [
          { y: 3.0, r: 1.7, h: 2.3, colour: 1 },
          { y: 4.0, r: 1.2, h: 1.7, colour: 2 },
        ],
      };
    default:
      return { trunk: 0.5, radius: 0.1, masses: [{ y: 1.0, r: 0.9, h: 1.3, colour: 2 }] };
  }
}

export function StreetTree({ spec }: { spec: StreetTreeSpec }) {
  const shape = useMemo(() => treeShape(spec.kind), [spec.kind]);

  return (
    <group position={spec.position as [number, number, number]} rotation={[0, spec.rotationY, 0]} scale={spec.scale}>
      <mesh position={[0, shape.trunk / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[shape.radius * 0.8, shape.radius, shape.trunk, 7]} />
        <meshStandardMaterial color="#6B5138" roughness={0.95} />
      </mesh>
      {shape.masses.map((mass, index) => (
        <mesh
          key={index}
          position={[0, mass.y, 0]}
          scale={[1, mass.h / (mass.r * 2), 1]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[mass.r, 7, 5]} />
          <meshStandardMaterial color={FOLIAGE[mass.colour]} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}
