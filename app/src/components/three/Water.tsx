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
/** Where the water plane rests: just above the ground it is drawn over. */
export const WATER_SURFACE_Y = 0.02;

/**
 * The swell, as arithmetic so it can be held by a test.
 *
 * It used to be written straight into the frame loop as
 * `sin(t * 0.6) * 0.04 - 0.06`, which swings between -0.10 and -0.02 — **every
 * value of it below the ground.** The static position was corrected to +0.02
 * when water started being drawn over the paving (D-154) and this line was not,
 * so on the first frame the sea rose to where it belonged and then sank back
 * under the ground and stayed there.
 *
 * That is what has been putting Van's boats on dry land. Not the boats: the
 * shore, the canoes and the island all come off one constant precisely so they
 * cannot drift apart, and they did not. The waterline moved. Seen at a grazing
 * angle a plane oscillating either side of the ground does not read as a plane
 * going up and down — it reads as the water running in and out, and anything
 * floating on it is left on the beach at low tide.
 *
 * So the swell now breathes *above* the surface rather than around zero. The
 * amplitude is half what it was for the same reason: what a child sees at fifty
 * metres is the waterline, and it should not travel.
 */
export function waterSurfaceY(elapsedSeconds: number): number {
  return WATER_SURFACE_Y + (Math.sin(elapsedSeconds * 0.6) + 1) * 0.01;
}

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
    mesh.current.position.y = waterSurfaceY(elapsed.current);
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
      position={[centerX, WATER_SURFACE_Y, centerZ]}
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
