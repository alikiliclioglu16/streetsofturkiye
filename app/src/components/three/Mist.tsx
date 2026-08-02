'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, type Group, type Mesh } from 'three';

/**
 * Mist drifting across a face of rock.
 *
 * Sümela is described to a child as clinging to a cliff three hundred metres up,
 * and the thing that sells that height is not the rock — it is cloud crossing in
 * front of it. Painted into the texture it would be a grey smear that never
 * moves, which reads as a stain rather than as weather.
 *
 * Each band is a soft quad that crosses the face, leaves, and comes back on the
 * other side. They travel at different speeds so the wall never looks like it is
 * being wiped by one cloth.
 *
 * The quads are billboards in nothing but name: they face down +Z because the
 * street is a corridor and the rock is only ever seen from one side. Turning
 * them to the camera every frame would cost more and change nothing.
 */

/** A soft blob, drawn once and shared by every band. */
function useMistTexture(): CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    /**
     * An ellipse rather than a circle, and softer at the edges than the middle.
     *
     * A linear falloff leaves a visible disc edge against the sky; the squared
     * stops below fade the rim to nothing well before the quad ends, so what a
     * child sees has no border at all.
     */
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new CanvasTexture(canvas);
  }, []);
}

export interface MistBand {
  readonly centre: readonly [number, number, number];
  readonly width: number;
  readonly height: number;
  /** Metres per second across the face. Negative runs the other way. */
  readonly drift: number;
  readonly opacity: number;
}

export function Mist({
  bands,
  reducedMotion,
}: {
  bands: readonly MistBand[];
  reducedMotion: boolean;
}) {
  const texture = useMistTexture();
  const group = useRef<Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node || reducedMotion) return;
    elapsed.current += Math.min(delta, 0.05);

    node.children.forEach((child, index) => {
      const band = bands[index];
      if (!band) return;
      /**
       * The travel is one and a half widths, so a band is fully clear of the
       * rock before it reappears. Wrapping over exactly one width puts the
       * trailing edge back on screen as the leading edge leaves, which reads as
       * a teleport — the mistake three attempts at Nevşehir's balloons made
       * (D-109).
       */
      const span = band.width * 1.5;
      const travelled = (elapsed.current * band.drift) % span;
      const offset = travelled < 0 ? travelled + span : travelled;
      (child as Mesh).position.x = band.centre[0] - span / 2 + offset;
    });
  });

  if (!texture || bands.length === 0) return null;

  return (
    <group ref={group}>
      {bands.map((band, index) => (
        <mesh
          key={`mist-${index}`}
          position={[band.centre[0], band.centre[1], band.centre[2]]}
          renderOrder={2}
        >
          <planeGeometry args={[band.width, band.height]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={band.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
