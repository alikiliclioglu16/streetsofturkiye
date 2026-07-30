'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationMixer, Box3, LoopRepeat, Vector3, type AnimationAction, type Group } from 'three';
import { isApprovedClip, type FeaturedNpc as NpcDefinition } from '@/engine/npc/registry';

/**
 * A person standing at their post.
 *
 * The owner placed each of these deliberately — a craftsman by the simit cart,
 * a soldier at the tower gate, a traveller at the bazaar arch — so they hold
 * their position rather than wander. Wandering would also risk walking into a
 * stop camera, and those cameras now sit as close as 5.8 m.
 *
 * They cycle through their approved clips with a dwell in between, so a child
 * who looks twice sees someone shift their weight and glance around rather than
 * a statue.
 */

/** Metres per second. A person going about their day, not commuting. */
export const WALK_SPEED = 0.85;
export const PAUSE_MIN_S = 3;
export const PAUSE_MAX_S = 7;

const DWELL_MIN_S = 4;
const DWELL_MAX_S = 9;

interface FeaturedNpcProps {
  npc: NpcDefinition;
  position: readonly [number, number, number];
  rotationY: number;
  /** Far end of a short beat this person walks and returns along. */
  walkTo?: readonly [number, number, number] | null;
  reducedMotion?: boolean;
  /** Offsets the cycle so three NPCs do not change pose on the same beat. */
  phase?: number;
}

export function FeaturedNpcActor({
  npc,
  position,
  rotationY,
  walkTo = null,
  reducedMotion = false,
  phase = 0,
}: FeaturedNpcProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(npc.modelUrl);

  // Skinned: a plain clone keeps the original skeleton and renders wrong.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  const current = useRef<AnimationAction | null>(null);
  const index = useRef(0);
  const dwell = useRef(DWELL_MIN_S + phase * (DWELL_MAX_S - DWELL_MIN_S));

  /**
   * Standing clips, for the pauses between walks.
   *
   * `Running` stays out: someone running past a stop reads as an emergency.
   */
  const standing = useMemo(
    () => npc.clips.filter((name) => name !== 'Walking' && name !== 'Running'),
    [npc.clips],
  );

  /**
   * A beat, walked and returned along.
   *
   * These people used to hold one spot for a whole visit, which reads as a
   * statue of a person. They now walk a few metres and come back, pausing at
   * each end — the application moves them and the clip only moves their legs,
   * which is the same rule the cat and the tram follow.
   */
  const walk = useRef({ t: 0, forward: true, waitLeft: 2 + phase * 3 });
  const home = useMemo(() => new Vector3(...position), [position]);
  const away = useMemo(() => (walkTo ? new Vector3(...walkTo) : null), [walkTo]);
  const beat = useMemo(() => (away ? home.distanceTo(away) : 0), [home, away]);
  const walking = useRef(false);

  useEffect(() => {
    const node = group.current;
    if (!node) return;
    node.scale.setScalar(1);
    node.updateMatrixWorld(true);
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    if (size.y > 1e-6) node.scale.setScalar(npc.heightMeters / size.y);

    model.traverse((child) => {
      const mesh = child as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [model, npc.heightMeters]);

  const play = useMemo(
    () => (name: string) => {
      // The whitelist is enforced here, not just respected by convention.
      if (!isApprovedClip(npc, name)) return;
      const clip = animations.find((candidate) => candidate.name === name);
      if (!clip) return;
      const next = mixer.clipAction(clip);
      next.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.35).play();
      current.current?.fadeOut(0.35);
      current.current = next;
    },
    [animations, mixer, npc],
  );

  useEffect(() => {
    if (standing.length > 0) play(standing[0]!);
    return () => {
      mixer.stopAllAction();
    };
  }, [play, standing, mixer]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    mixer.update(delta);

    const node = group.current;
    if (node && away && beat > 0.5 && !reducedMotion) {
      const state = walk.current;
      if (state.waitLeft > 0) {
        state.waitLeft = Math.max(0, state.waitLeft - delta);
        if (walking.current) {
          walking.current = false;
          if (standing.length > 0) play(standing[index.current % standing.length]!);
        }
      } else {
        if (!walking.current) {
          walking.current = true;
          play('Walking');
        }
        state.t += ((state.forward ? 1 : -1) * WALK_SPEED * delta) / beat;
        if (state.t >= 1) {
          state.t = 1;
          state.forward = false;
          state.waitLeft = PAUSE_MIN_S + Math.random() * (PAUSE_MAX_S - PAUSE_MIN_S);
        } else if (state.t <= 0) {
          state.t = 0;
          state.forward = true;
          state.waitLeft = PAUSE_MIN_S + Math.random() * (PAUSE_MAX_S - PAUSE_MIN_S);
        }
        node.position.lerpVectors(home, away, state.t);
        // Facing the way they are going, and back to their post when returning.
        const dx = (away.x - home.x) * (state.forward ? 1 : -1);
        const dz = (away.z - home.z) * (state.forward ? 1 : -1);
        node.rotation.y = Math.atan2(dx, dz);
      }
    }

    if (walking.current || standing.length < 2) return;
    dwell.current -= delta;
    if (dwell.current <= 0) {
      index.current = (index.current + 1) % standing.length;
      play(standing[index.current]!);
      dwell.current = DWELL_MIN_S + Math.random() * (DWELL_MAX_S - DWELL_MIN_S);
    }
  });

  return (
    <group ref={group} position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      <primitive object={model} />
    </group>
  );
}
