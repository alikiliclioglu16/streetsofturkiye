'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationMixer, Box3, LoopRepeat, Vector3, type Group } from 'three';

/**
 * Birds over the city.
 *
 * The delivery is skinned and carries one 2.62 s flap. Three things about it
 * needed care, and each of them is a rule this project already learned:
 *
 * **It must be cloned with `SkeletonUtils.clone`.** `Object3D.clone` keeps the
 * original bones, so every copy after the first renders at bind pose or at the
 * wrong scale entirely — which is what drew Nasreddin Hodja 1.7 cm tall (D-042).
 *
 * **Its recorded size is armature scale and means nothing.** The file measures
 * 10.65 m tall in bind pose because that is the box around its skeleton; the
 * mesh inside is a bird 0.53 m across the wings. Height is a useless scale key
 * for a shape held flat with its wings out, so this scales off the wingspan
 * instead — measured from the loaded geometry rather than typed, and applied
 * here rather than in the registry, the way the heroes are handled.
 *
 * **The clip only moves limbs.** Its translation channels are all on wing and
 * tail bones; there is no root motion, so wiring it up is safe. The flying is
 * done here, by the application, which is the rule everything that moves in
 * this project follows.
 */

/** How wide a bird is, wingtip to wingtip. */
export const BIRD_WINGSPAN = 1.6;

export interface BirdPath {
  /** Centre of the circle it flies, in world metres. */
  readonly centre: readonly [number, number, number];
  readonly radius: number;
  /** Turns per second. Negative circles the other way. */
  readonly rate: number;
  /** Where on the circle it starts, in radians. */
  readonly phase: number;
  /** Metres the altitude rises and falls over a lap. */
  readonly bob: number;
}

/**
 * Mounted only once there is a model to load.
 *
 * `useGLTF` is a hook and cannot be called conditionally, and a fallback path
 * written here would be an asset URL living in a component — which is the one
 * thing the registry exists to stop. So the guard is a wrapper instead.
 */
export function Birds({
  modelUrl,
  paths,
  reducedMotion,
}: {
  modelUrl: string | null;
  paths: readonly BirdPath[];
  reducedMotion: boolean;
}) {
  if (!modelUrl || paths.length === 0) return null;
  return <BirdFlock modelUrl={modelUrl} paths={paths} reducedMotion={reducedMotion} />;
}

function BirdFlock({
  modelUrl,
  paths,
  reducedMotion,
}: {
  modelUrl: string;
  paths: readonly BirdPath[];
  reducedMotion: boolean;
}) {
  const { scene, animations } = useGLTF(modelUrl);
  const group = useRef<Group>(null);
  const elapsed = useRef(0);

  /**
   * One clone and one mixer per bird.
   *
   * A shared mixer would flap all five in perfect unison, which reads as a
   * mobile hanging over the street rather than as birds — the same fault the
   * street trees avoid by giving each a phase.
   */
  const birds = useMemo(() => {
    return paths.map((path, index) => {
      const model = cloneSkinned(scene);

      /**
       * Scale from the wingspan the mesh actually has, and centre it.
       *
       * The bind-pose box is measured here rather than assumed, because the
       * delivery sits about half a metre off its own origin and would otherwise
       * fly beside its path instead of along it.
       */
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const span = Math.max(size.x, size.z, 0.001);
      const factor = BIRD_WINGSPAN / span;
      model.scale.setScalar(factor);

      const centre = box.getCenter(new Vector3()).multiplyScalar(factor);
      model.position.set(-centre.x, -centre.y, -centre.z);

      const mixer = new AnimationMixer(model);
      const clip = animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.setLoop(LoopRepeat, Infinity);
        // Started part-way in, so five birds are never on the same wingbeat.
        action.time = (clip.duration * index) / Math.max(paths.length, 1);
        action.play();
      }
      return { model, mixer, path };
    });
  }, [scene, animations, paths]);

  useEffect(() => {
    return () => {
      for (const bird of birds) bird.mixer.stopAllAction();
    };
  }, [birds]);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node) return;
    const delta = Math.min(rawDelta, 0.05);
    /**
     * Reduced motion stops the birds where they are rather than removing them.
     * Anything that moves takes reduced motion as zero strength; it does not
     * take it as a reason to empty the sky.
     */
    if (reducedMotion) return;
    elapsed.current += delta;

    birds.forEach((bird, index) => {
      bird.mixer.update(delta);
      const { centre, radius, rate, phase, bob } = bird.path;
      const angle = phase + elapsed.current * rate * Math.PI * 2;
      const holder = node.children[index];
      if (!holder) return;
      holder.position.set(
        centre[0] + Math.cos(angle) * radius,
        centre[1] + Math.sin(angle * 2) * bob,
        centre[2] + Math.sin(angle) * radius,
      );
      /**
       * Facing is the tangent of the circle, and the model's nose runs along
       * its own +Z after the centring above. Banking is left out on purpose:
       * a roll on a flat spread-wing mesh shows its edge and the bird vanishes.
       */
      holder.rotation.y = -angle + (rate > 0 ? 0 : Math.PI);
    });
  });

  return (
    <group ref={group}>
      {birds.map((bird, index) => (
        <group key={`bird-${index}`}>
          <primitive object={bird.model} />
        </group>
      ))}
    </group>
  );
}
