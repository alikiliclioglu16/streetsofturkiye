'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AssetInstance } from '@/components/three/AssetInstance';
import type { ResolvedAsset } from '@/engine/assets/registry';

/**
 * The nostalgic tram, running its line.
 *
 * A tram parked at the kerb is a model of a tram. One that arrives, passes and
 * comes back is the thing that makes a street look inhabited — and İstanbul's
 * red tram does exactly this, up and down one street, all day.
 *
 * It runs on the far side of the walk and is not solid: a child who wanders on
 * to the line should not be stopped by a vehicle they cannot see coming.
 */

export const TRAM_SPEED = 3.4;
export const TRAM_PAUSE_SECONDS = 4;

export interface TramState {
  /** Distance along the line from the first end, in metres. */
  travelled: number;
  direction: 1 | -1;
  waitLeft: number;
}

export function initialTramState(): TramState {
  return { travelled: 0, direction: 1, waitLeft: 0 };
}

/**
 * One step of the run. Pure, so a tram that never arrives or never turns round
 * is a failing test rather than something to watch for.
 */
export function stepTram(state: TramState, lineLength: number, delta: number): TramState {
  if (state.waitLeft > 0) {
    return { ...state, waitLeft: Math.max(0, state.waitLeft - delta) };
  }

  const travelled = state.travelled + state.direction * TRAM_SPEED * delta;

  if (travelled >= lineLength) {
    return { travelled: lineLength, direction: -1, waitLeft: TRAM_PAUSE_SECONDS };
  }
  if (travelled <= 0) {
    return { travelled: 0, direction: 1, waitLeft: TRAM_PAUSE_SECONDS };
  }
  return { ...state, travelled };
}

interface TramProps {
  asset: ResolvedAsset;
  /** Both ends of the line, in world metres. */
  from: readonly [number, number];
  to: readonly [number, number];
  reducedMotion: boolean;
}

export function Tram({ asset, from, to, reducedMotion }: TramProps) {
  const group = useRef<Group>(null);
  const state = useRef<TramState>(initialTramState());

  const line = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);

    /**
     * Which way the model already points.
     *
     * A heading of `atan2(dx, dz)` assumes the model's nose is along +Z. This
     * tram is 4.8 m wide and 1.9 m deep, so its length lies along X and it was
     * running down the street sideways. Reading the footprint is more reliable
     * than remembering a per-asset convention.
     */
    const [width, , depth] = asset.entry.dimensions;
    const modelFacesX = width > depth;

    return {
      dx: dx / length,
      dz: dz / length,
      length,
      heading: Math.atan2(dx, dz) + (modelFacesX ? Math.PI / 2 : 0),
    };
  }, [from, to, asset.entry.dimensions]);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node) return;
    if (!reducedMotion) {
      state.current = stepTram(state.current, line.length, Math.min(rawDelta, 0.05));
    }
    const { travelled, direction } = state.current;
    node.position.set(from[0] + line.dx * travelled, 0, from[1] + line.dz * travelled);
    // The tram faces the way it is going; İstanbul's has a driver's cab at both
    // ends, so turning round is a heading flip and not a manoeuvre.
    node.rotation.y = direction > 0 ? line.heading : line.heading + Math.PI;
  });

  return (
    <group ref={group}>
      <AssetInstance asset={asset} />
    </group>
  );
}
