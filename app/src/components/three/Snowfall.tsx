'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  type Points,
} from 'three';

/**
 * Falling snow.
 *
 * Erzurum is the first city drawn in winter and the ground texture only gets
 * half way there: settled snow says it has been cold, and falling snow says it
 * is cold now. It is the cheapest thing in the project by a wide margin — one
 * draw call, one buffer, no models — and it carries a whole season.
 *
 * **The box follows the camera.** Snow is drawn in a volume centred on wherever
 * a child is standing rather than over the whole city, so twelve hundred flakes
 * are always the twelve hundred nearest them. Filling an 85 m street to the same
 * density would cost twenty times as many for a picture that is identical.
 *
 * Flakes wrap rather than respawn: one that falls out of the bottom is moved to
 * the top with its x and z kept, so there is no puff of new snow appearing and
 * no bookkeeping.
 *
 * Reduced motion stops it in the air rather than clearing the sky. Everything
 * that moves in this project treats reduced motion as zero strength, not as a
 * reason to delete itself.
 */

/** Half-width of the volume snow is drawn in, in metres. */
const BOX = 26;
/** Height of the volume. Above this a flake is out of frame anyway (D-183). */
const BOX_TOP = 18;
const COUNT = 1200;

/**
 * A deterministic scatter, seeded by the flake's own index.
 *
 * `Math.random` in a render is both a lint error and a real bug: a re-render
 * would deal a fresh sky and every flake would jump. This gives the same
 * scatter every time from the same integer, which also means a screenshot of
 * the snow is reproducible.
 */
function hashed(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A soft round dot, drawn once and shared by every flake. */
function useFlakeTexture(): CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);
}

export function Snowfall({ reducedMotion }: { reducedMotion: boolean }) {
  const texture = useFlakeTexture();
  const points = useRef<Points>(null);
  const { camera } = useThree();

  /**
   * Position, fall speed and sway phase per flake.
   *
   * Speeds vary by a factor of three. Snow all falling at one rate reads as a
   * screen effect laid over the picture rather than as weather inside it — the
   * same reason the street trees each get their own phase.
   */
  const { geometry, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sp = new Float32Array(COUNT);
    const ph = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (hashed(i, 1) - 0.5) * BOX * 2;
      positions[i * 3 + 1] = hashed(i, 2) * BOX_TOP;
      positions[i * 3 + 2] = (hashed(i, 3) - 0.5) * BOX * 2;
      sp[i] = 0.5 + hashed(i, 4) * 1.1;
      ph[i] = hashed(i, 5) * Math.PI * 2;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry: geo, speeds: sp, phases: ph };
  }, []);

  const elapsed = useRef(0);

  useFrame((_, rawDelta) => {
    const node = points.current;
    if (!node) return;

    // The volume rides with the camera, snapped to whole metres so the wrap
    // maths never sees the box jump underneath it.
    node.position.set(Math.round(camera.position.x), 0, Math.round(camera.position.z));

    if (reducedMotion) return;
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;

    const attr = geometry.getAttribute('position') as BufferAttribute;
    const array = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i += 1) {
      const ix = i * 3;
      const y = (array[ix + 1] ?? 0) - (speeds[i] ?? 1) * delta;
      if (y < 0) {
        array[ix + 1] = BOX_TOP;
      } else {
        array[ix + 1] = y;
        // A slow lateral wander, different per flake. Snow does not fall
        // straight, and a straight fall is the thing that reads as rain.
        const phase = phases[i] ?? 0;
        array[ix] = (array[ix] ?? 0) + Math.sin(elapsed.current * 0.6 + phase) * delta * 0.35;
        array[ix + 2] = (array[ix + 2] ?? 0) + Math.cos(elapsed.current * 0.44 + phase) * delta * 0.28;
      }
      // Wrap sideways so drift never empties one side of the box.
      const x = array[ix] ?? 0;
      if (x > BOX) array[ix] = x - BOX * 2;
      else if (x < -BOX) array[ix] = x + BOX * 2;
      const z = array[ix + 2] ?? 0;
      if (z > BOX) array[ix + 2] = z - BOX * 2;
      else if (z < -BOX) array[ix + 2] = z + BOX * 2;
    }
    attr.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} renderOrder={3}>
      <pointsMaterial
        map={texture}
        size={0.13}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
