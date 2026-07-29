'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import type { StreetTreeSpec } from '@/components/three/StreetTree';
import { treeShape, FOLIAGE } from '@/components/three/StreetTree';

/**
 * Every tree in the city, in three draw calls.
 *
 * Twenty-one trees rendered as separate groups cost sixty-three draw calls —
 * more than half the frame's total — for under four thousand triangles. They
 * are the same three shapes repeated, which is exactly what instancing is for.
 *
 * Trees also stop casting shadows here. Twenty-one canopies in the shadow pass
 * bought a dappling nobody asked for on a street that already has shadows from
 * the things a child walks up to.
 */
export function StreetTrees({ trees }: { trees: readonly StreetTreeSpec[] }) {
  const trunks = useRef<InstancedMesh>(null);
  const lower = useRef<InstancedMesh>(null);
  const upper = useRef<InstancedMesh>(null);

  const layout = useMemo(
    () =>
      trees.map((spec) => {
        const shape = treeShape(spec.kind);
        return { spec, shape };
      }),
    [trees],
  );

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const colour = new Color();

    const place = (
      mesh: InstancedMesh | null,
      pick: (entry: (typeof layout)[number]) => { y: number; r: number; h: number; colour: number } | null,
    ) => {
      if (!mesh) return;
      let index = 0;
      for (const entry of layout) {
        const part = pick(entry);
        if (!part) continue;
        const [x, , z] = entry.spec.position;
        position.set(x, part.y * entry.spec.scale, z);
        quaternion.setFromAxisAngle(new Vector3(0, 1, 0), entry.spec.rotationY);
        scale.set(
          part.r * entry.spec.scale,
          part.h * entry.spec.scale,
          part.r * entry.spec.scale,
        );
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, colour.set(FOLIAGE[part.colour] ?? FOLIAGE[0]!));
        index += 1;
      }
      mesh.count = index;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    place(trunks.current, (entry) => ({
      y: entry.shape.trunk / 2,
      r: 0.16,
      h: entry.shape.trunk / 2,
      colour: -1,
    }));
    place(lower.current, (entry) => {
      const mass = entry.shape.masses[0];
      return mass ? { y: mass.y, r: mass.r, h: mass.h / 2, colour: mass.colour } : null;
    });
    place(upper.current, (entry) => {
      const mass = entry.shape.masses[1];
      return mass ? { y: mass.y, r: mass.r, h: mass.h / 2, colour: mass.colour } : null;
    });
  }, [layout]);

  if (trees.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} receiveShadow>
        <cylinderGeometry args={[1, 1.15, 2, 6]} />
        <meshStandardMaterial color="#6B5138" roughness={0.95} />
      </instancedMesh>

      <instancedMesh ref={lower} args={[undefined, undefined, trees.length]} receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} flatShading vertexColors />
      </instancedMesh>

      <instancedMesh ref={upper} args={[undefined, undefined, trees.length]} receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} flatShading vertexColors />
      </instancedMesh>
    </group>
  );
}
