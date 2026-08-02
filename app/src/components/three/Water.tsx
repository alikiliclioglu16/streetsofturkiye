'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/**
 * The sea beyond the quay.
 *
 * İstanbul is the only pilot city on the water, and the last stop is a ferry —
 * a ferry moored on grass reads as a mistake before a child can name why.
 *
 * The plane starts past the play boundary, so the sea is something seen and
 * never walked into, and needs no collider. The surface is deliberately simple:
 * a slow vertical breathe at a few centimetres, which reads as water at fifty
 * metres and costs two triangles.
 */
export function Water({
  centerX,
  centerZ,
  width,
  depth,
  color,
  still = false,
  reducedMotion,
}: {
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  color: string;
  still?: boolean;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    /**
     * A still sea is still, and that is a per-city decision rather than a
     * motion preference: reduced motion already stops it for everyone who asks,
     * and `still` stops it because the swell was wrong for this sea.
     */
    if (still || reducedMotion || !mesh.current) return;
    elapsed.current += delta;
    mesh.current.position.y = Math.sin(elapsed.current * 0.6) * 0.04 - 0.06;
  });

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      /**
       * Above the ground, not below it.
       *
       * The sea used to sit at y = -0.06 — under a paving plane that is drawn
       * 44 m past the play boundary (D-082). Anything standing between the
       * boundary and the edge of that paving therefore stood on stone with the
       * sea hidden beneath: the ferry at z = -128 and the Maiden's Tower at
       * z = -146 had been on a cobbled quay the whole time, and Van's lake
       * looked missing for the same reason (D-152).
       *
       * Water over the bed is also the right way round physically. Two
       * centimetres up plus a depth bias keeps it off the ground at distance,
       * where either alone shows through.
       */
      position={[centerX, 0.02, centerZ]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        color={color}
        roughness={0.22}
        metalness={0.15}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}
