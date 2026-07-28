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
  reducedMotion,
}: {
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  color: string;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (reducedMotion || !mesh.current) return;
    elapsed.current += delta;
    mesh.current.position.y = Math.sin(elapsed.current * 0.6) * 0.04 - 0.06;
  });

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[centerX, -0.06, centerZ]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={color} roughness={0.22} metalness={0.15} />
    </mesh>
  );
}
