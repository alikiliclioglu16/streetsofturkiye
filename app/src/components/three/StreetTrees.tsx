'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { gust, heightFactor, sway } from '@/engine/environment/wind';
import type { StreetTreeSpec } from '@/components/three/StreetTree';
import { treeShape, FOLIAGE } from '@/components/three/StreetTree';

/**
 * Every tree in the city, in a handful of draw calls.
 *
 * Twenty-one trees rendered as separate groups cost sixty-three draw calls —
 * more than half the frame — for under four thousand triangles. They are the
 * same three shapes repeated, which is what instancing is for.
 *
 * Instances are grouped by colour and each group gets a plain material. The
 * first attempt used one material with `vertexColors` and per-instance colours,
 * and the trees rendered black: the instance colour attribute is added after
 * the shader is compiled, so the shader had no colour to read.
 *
 * Trees also stop casting shadows. Twenty-one canopies in the shadow pass
 * bought a dappling nobody asked for on a street that already has shadows from
 * everything a child walks up to.
 */

interface Placement {
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  /** Spreads the sway phase so the street does not lean in unison. */
  phase: number;
}

function InstancedGroup({
  placements,
  colour,
  geometry,
  reducedMotion,
}: {
  placements: readonly Placement[];
  colour: string;
  geometry: 'trunk' | 'canopy';
  reducedMotion: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const elapsed = useRef(0);
  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      euler: new Euler(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const node = mesh.current;
    if (!node) return;
    elapsed.current += delta;

    // Canopies lean; trunks hold still, because a swaying trunk reads as a
    // tree falling over rather than as wind.
    const strength = reducedMotion || geometry === 'trunk' ? 0 : gust(elapsed.current);
    const { matrix, position, quaternion, euler, scale } = scratch;

    placements.forEach((placement, index) => {
      const lean = strength === 0 ? 0 : sway(elapsed.current, placement.phase, strength) *
        heightFactor(placement.position[1] * 2);
      position.set(...placement.position);
      euler.set(lean * 0.6, placement.rotationY, lean);
      quaternion.setFromEuler(euler);
      scale.set(...placement.scale);
      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(index, matrix);
    });

    node.count = placements.length;
    node.instanceMatrix.needsUpdate = true;
  });

  if (placements.length === 0) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, placements.length]} receiveShadow>
      {geometry === 'trunk' ? (
        <cylinderGeometry args={[0.8, 1, 2, 6]} />
      ) : (
        <icosahedronGeometry args={[1, 0]} />
      )}
      <meshStandardMaterial color={colour} roughness={geometry === 'trunk' ? 0.95 : 1} flatShading />
    </instancedMesh>
  );
}

export function StreetTrees({
  trees,
  reducedMotion,
}: {
  trees: readonly StreetTreeSpec[];
  reducedMotion: boolean;
}) {
  const groups = useMemo(() => {
    const trunks: Placement[] = [];
    const canopies = new Map<string, Placement[]>();

    for (const spec of trees) {
      const shape = treeShape(spec.kind);
      const [x, , z] = spec.position;
      const s = spec.scale;

      const phase = x * 0.21 + z * 0.13;
      trunks.push({
        position: [x, (shape.trunk / 2) * s, z],
        rotationY: spec.rotationY,
        scale: [shape.radius * s, (shape.trunk / 2) * s, shape.radius * s],
        phase,
      });

      for (const mass of shape.masses) {
        const colour = FOLIAGE[mass.colour] ?? FOLIAGE[0]!;
        const list = canopies.get(colour) ?? [];
        list.push({
          position: [x, mass.y * s, z],
          rotationY: spec.rotationY,
          scale: [mass.r * s, (mass.h / 2) * s, mass.r * s],
          phase,
        });
        canopies.set(colour, list);
      }
    }

    return { trunks, canopies: [...canopies.entries()] };
  }, [trees]);

  if (trees.length === 0) return null;

  return (
    <group>
      <InstancedGroup
        placements={groups.trunks}
        colour="#6B5138"
        geometry="trunk"
        reducedMotion={reducedMotion}
      />
      {groups.canopies.map(([colour, placements]) => (
        <InstancedGroup
          key={colour}
          placements={placements}
          colour={colour}
          geometry="canopy"
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
