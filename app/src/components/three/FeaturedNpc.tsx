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

const DWELL_MIN_S = 4;
const DWELL_MAX_S = 9;

interface FeaturedNpcProps {
  npc: NpcDefinition;
  position: readonly [number, number, number];
  rotationY: number;
  /** Offsets the cycle so three NPCs do not change pose on the same beat. */
  phase?: number;
}

export function FeaturedNpcActor({ npc, position, rotationY, phase = 0 }: FeaturedNpcProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(npc.modelUrl);

  // Skinned: a plain clone keeps the original skeleton and renders wrong.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  const current = useRef<AnimationAction | null>(null);
  const index = useRef(0);
  const dwell = useRef(DWELL_MIN_S + phase * (DWELL_MAX_S - DWELL_MIN_S));

  /**
   * Standing clips only.
   *
   * `Walking` is on the whitelist because the model ships with it, but an NPC
   * holding a post has no use for it — playing a walk cycle on the spot is the
   * skating that the cat integration was careful to avoid.
   */
  const standing = useMemo(
    () => npc.clips.filter((name) => name !== 'Walking' && name !== 'Running'),
    [npc.clips],
  );

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

    if (standing.length < 2) return;
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
