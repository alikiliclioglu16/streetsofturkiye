'use client';

import { useMemo, useRef, useState } from 'react';
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

/* ------------------------------------------------------------------ */

export const TRAIN_SPEED = 11;
/** Seconds between one train leaving and the next arriving. */
export const TRAIN_INTERVAL_SECONDS = 15;

export interface TrainState {
  /** Distance along the line from the arriving end, in metres. */
  travelled: number;
  /** Seconds left before the next one appears. */
  waitLeft: number;
}

export function initialTrainState(): TrainState {
  // Starts waiting, so a child who arrives in the city gets to see one come in
  // rather than finding one already halfway across.
  return { travelled: 0, waitLeft: TRAIN_INTERVAL_SECONDS };
}

/**
 * One step of the run. Pure, so a train that never arrives or never leaves can
 * be caught in a test rather than by watching for a minute.
 *
 * Not the tram's motion. The tram works one street all day and turns round at
 * each end in front of the child; a train comes in from somewhere else, crosses
 * and goes somewhere else. So there is no direction to flip and no pause at the
 * end of the line — it runs off the end, disappears, and the clock starts.
 */
export function stepTrain(state: TrainState, lineLength: number, delta: number): TrainState {
  if (state.waitLeft > 0) {
    return { travelled: 0, waitLeft: Math.max(0, state.waitLeft - delta) };
  }

  const travelled = state.travelled + TRAIN_SPEED * delta;
  if (travelled >= lineLength) {
    return { travelled: 0, waitLeft: TRAIN_INTERVAL_SECONDS };
  }
  return { travelled, waitLeft: 0 };
}

interface TrainProps {
  asset: ResolvedAsset;
  from: readonly [number, number];
  to: readonly [number, number];
  reducedMotion: boolean;
}

/**
 * The Eastern Express, crossing Kars and leaving again.
 *
 * Both ends of its line are outside the play area, so it is never seen to
 * appear or vanish — it comes in from off the map and goes off the other side.
 * Between runs it is not merely parked at the end: it is not rendered at all,
 * because a twenty metre locomotive sitting still at the edge of a plateau is a
 * strange thing to leave in shot for fifteen seconds.
 *
 * Reduced motion holds it off the map entirely rather than freezing it in the
 * middle of the city, which is the same choice every other moving thing here
 * makes: zero strength, not a still frame in an odd place.
 */
export function Train({ asset, from, to, reducedMotion }: TrainProps) {
  const group = useRef<Group>(null);
  const state = useRef<TrainState>(initialTrainState());
  const [running, setRunning] = useState(false);

  const line = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);
    // Same reasoning as the tram: read the footprint rather than remember which
    // axis a given file was authored along.
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
    if (!node || reducedMotion) return;

    state.current = stepTrain(state.current, line.length, Math.min(rawDelta, 0.05));
    const moving = state.current.waitLeft === 0;
    if (moving !== running) setRunning(moving);
    if (!moving) return;

    const { travelled } = state.current;
    node.position.set(from[0] + line.dx * travelled, 0, from[1] + line.dz * travelled);
    node.rotation.y = line.heading;
  });

  if (reducedMotion || !running) return null;

  return (
    <group ref={group}>
      <AssetInstance asset={asset} />
    </group>
  );
}
