'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
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
}

function InstancedGroup({
  placements,
  colour,
  geometry,
}: {
  placements: readonly Placement[];
  colour: string;
  geometry: 'trunk' | 'canopy';
}) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const axis = new Vector3(0, 1, 0);

    placements.forEach((placement, index) => {
      position.set(...placement.position);
      quaternion.setFromAxisAngle(axis, placement.rotationY);
      scale.set(...placement.scale);
      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(index, matrix);
    });
    node.count = placements.length;
    node.instanceMatrix.needsUpdate = true;
    node.computeBoundingSphere();
  }, [placements]);

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

export function StreetTrees({ trees }: { trees: readonly StreetTreeSpec[] }) {
  const groups = useMemo(() => {
    const trunks: Placement[] = [];
    const canopies = new Map<string, Placement[]>();

    for (const spec of trees) {
      const shape = treeShape(spec.kind);
      const [x, , z] = spec.position;
      const s = spec.scale;

      trunks.push({
        position: [x, (shape.trunk / 2) * s, z],
        rotationY: spec.rotationY,
        scale: [shape.radius * s, (shape.trunk / 2) * s, shape.radius * s],
      });

      for (const mass of shape.masses) {
        const colour = FOLIAGE[mass.colour] ?? FOLIAGE[0]!;
        const list = canopies.get(colour) ?? [];
        list.push({
          position: [x, mass.y * s, z],
          rotationY: spec.rotationY,
          scale: [mass.r * s, (mass.h / 2) * s, mass.r * s],
        });
        canopies.set(colour, list);
      }
    }

    return { trunks, canopies: [...canopies.entries()] };
  }, [trees]);

  if (trees.length === 0) return null;

  return (
    <group>
      <InstancedGroup placements={groups.trunks} colour="#6B5138" geometry="trunk" />
      {groups.canopies.map(([colour, placements]) => (
        <InstancedGroup key={colour} placements={placements} colour={colour} geometry="canopy" />
      ))}
    </group>
  );
}
