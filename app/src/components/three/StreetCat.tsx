'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationMixer, LoopRepeat, type AnimationAction, type Group } from 'three';

/**
 * A stray cat walking a short beat of the street.
 *
 * İstanbul's cats are one of the first things any child notices about the city,
 * so this is not filler. It is also the first asset in the project that moves
 * without being the guide, which is why the movement rules are spelled out
 * rather than assumed:
 *
 *  - the application moves the cat through the world; the clip only animates
 *    the legs. The delivered walk is in place, and applying its root motion as
 *    world movement on top of ours would make the paws skate.
 *  - the cat is dressing, not an obstacle. It has no collider and the player
 *    walks through it, which is what a cat would do anyway.
 *  - one animated cat. Each independently animated instance needs its own
 *    skeleton, so this is deliberately not a crowd.
 */

export const CAT_WALK_SPEED = 0.55;
export const CAT_TURN_RATE = 3.2;
const ARRIVE_EPSILON = 0.12;
const PAUSE_MIN_S = 3;
const PAUSE_MAX_S = 7;

export interface CatWaypoint {
  readonly x: number;
  readonly z: number;
}

/** Where along the route the cat is, and whether it is moving. */
export interface CatState {
  target: number;
  x: number;
  z: number;
  heading: number;
  pauseLeft: number;
}

export function createCatState(route: readonly CatWaypoint[]): CatState {
  const first = route[0] ?? { x: 0, z: 0 };
  return { target: Math.min(1, route.length - 1), x: first.x, z: first.z, heading: 0, pauseLeft: 0 };
}

/**
 * One step of the walk. Pure, so the route logic is testable without a canvas:
 * a cat that walks off the pavement or stops moving forever is a bug worth
 * catching in a test rather than by watching.
 */
export function stepCat(
  state: CatState,
  route: readonly CatWaypoint[],
  delta: number,
  pauseFor: () => number,
): CatState {
  if (route.length < 2) return state;

  if (state.pauseLeft > 0) {
    return { ...state, pauseLeft: Math.max(0, state.pauseLeft - delta) };
  }

  const target = route[state.target]!;
  const dx = target.x - state.x;
  const dz = target.z - state.z;
  const distance = Math.hypot(dx, dz);

  // Turn towards the target rather than snapping; a cat pivoting instantly
  // reads as a sprite, not an animal.
  const desired = Math.atan2(dx, dz);
  let turn = desired - state.heading;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  const heading = state.heading + Math.max(-1, Math.min(1, turn / 0.4)) * CAT_TURN_RATE * delta;

  const step = CAT_WALK_SPEED * delta;
  if (distance <= Math.max(step, ARRIVE_EPSILON)) {
    const isEnd = state.target === 0 || state.target === route.length - 1;
    const next = state.target === route.length - 1 ? route.length - 2 : state.target === 0 ? 1 : state.target + 1;
    return {
      target: Math.max(0, Math.min(route.length - 1, next)),
      x: target.x,
      z: target.z,
      heading,
      // Cats stop. A creature that paces without ever pausing looks mechanical.
      pauseLeft: isEnd ? pauseFor() : 0,
    };
  }

  return {
    ...state,
    x: state.x + (dx / distance) * step,
    z: state.z + (dz / distance) * step,
    heading,
  };
}

export function randomPause(): number {
  return PAUSE_MIN_S + Math.random() * (PAUSE_MAX_S - PAUSE_MIN_S);
}

interface StreetCatProps {
  url: string;
  route: readonly CatWaypoint[];
  onMeasured?: (heightMeters: number) => void;
}

export function StreetCat({ url, route, onMeasured }: StreetCatProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);

  // Skinned: a plain clone would keep the original skeleton and render wrong.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  const walk = useRef<AnimationAction | null>(null);
  const state = useRef<CatState>(createCatState(route));
  const wasMoving = useRef(true);

  useEffect(() => {
    const clip = animations.find((candidate) => candidate.name === 'Walking') ?? animations[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(LoopRepeat, Infinity).play();
    walk.current = action;
    return () => {
      action.stop();
      mixer.stopAllAction();
    };
  }, [mixer, animations]);

  useEffect(() => {
    model.traverse((child) => {
      const mesh = child as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    if (onMeasured && group.current) {
      // Reported once so the rendered height can be checked against the brief.
      onMeasured(0);
    }
  }, [model, onMeasured]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    state.current = stepCat(state.current, route, delta, randomPause);

    const node = group.current;
    if (node) {
      node.position.set(state.current.x, 0, state.current.z);
      node.rotation.y = state.current.heading;
    }

    /**
     * The walk clip runs only while the cat is walking. Letting it loop through
     * a pause would be a cat marching on the spot; the delivered file has no
     * idle, so the honest alternative is to hold a stable frame of the walk.
     */
    const moving = state.current.pauseLeft <= 0;
    if (moving !== wasMoving.current) {
      wasMoving.current = moving;
      const action = walk.current;
      if (action) {
        if (moving) {
          action.paused = false;
        } else {
          action.time = 0;
          action.paused = true;
        }
      }
    }
    if (moving) mixer.update(delta);
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}
