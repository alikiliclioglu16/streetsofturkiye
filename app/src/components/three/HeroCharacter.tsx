'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useFrame } from '@react-three/fiber';
import type { AnimationAction, AnimationClip, Group, Material, Mesh, Object3D } from 'three';
import { AnimationMixer, Box3, LoopOnce, LoopRepeat, Vector3 } from 'three';
import { resolveAsset } from '@/engine/assets/registry';
import { PlaceholderAsset } from '@/components/three/PlaceholderAsset';
import { clipForState, isOneShot, transitionDuration, type HeroMotionState } from '@/engine/heroes/animation';
import { draw, loadShuffleBag, saveShuffleBag, type ShuffleBag } from '@/engine/heroes/danceBag';
import { requestHero } from '@/engine/heroes/heroCache';
import {
  clipDurationCap,
  heroModelUrl,
  isLocomotion,
  resolveClipName,
  type HeroClip,
  type HeroDefinition,
  type HeroId,
} from '@/engine/heroes/registry';
import type { QualitySettings } from '@/engine/heroes/policy';

/**
 * The one place a hero character is mounted.
 *
 * The mesh is always the full-quality approved model — quality profiles change
 * the hero's shadow, never its geometry (policy rule 4). Exactly one
 * AnimationMixer runs, and only while this component is mounted, so an
 * inactive hero cannot keep ticking in the background.
 */

interface HeroModelProps {
  hero: HeroDefinition;
  url: string;
  profile: QualitySettings;
  motion: HeroMotionState;
  onClipChange: (clip: HeroClip, clipName: string | null) => void;
  /** Fired when a one-shot clip reaches its end or its duration cap. */
  onClipFinished?: () => void;
  /** Reports the rendered height in metres, before scaling. */
  onMeasured?: (heightMeters: number) => void;
  /** Reports how many times the hero's meshes are drawn per frame. */
  onDrawCount?: (draws: { meshes: number; perFrame: number }) => void;
  /** Bumping this replays the current one-shot clip. */
  performanceToken: number;
}

function HeroModel({
  hero,
  url,
  profile,
  motion,
  onClipChange,
  onClipFinished,
  onMeasured,
  onDrawCount,
  performanceToken,
}: HeroModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);

  /**
   * Clone so the cached source stays pristine for the next city.
   *
   * `Object3D.clone()` must NOT be used here. On a skinned mesh it copies the
   * mesh but leaves its `skeleton` pointing at the ORIGINAL bones, so the
   * clone's own bones — the ones the mixer animates — drive nothing. The mesh
   * then falls back to its node transform, and because this rig stores joints
   * in centimetres under an Armature scaled 0.01, a 1.70 m character renders
   * 1.7 cm tall and is effectively invisible. SkeletonUtils.clone rebinds the
   * skeleton to the cloned bones.
   */
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  /**
   * The mixer is created here rather than taken from `useAnimations` so the
   * actions belong to this component and their loop mode can be configured.
   * It is also the only mixer in the app, and it only exists while mounted.
   */
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const clipsByName = useMemo(
    () => new Map<string, AnimationClip>(animations.map((clip) => [clip.name, clip])),
    [animations],
  );

  useEffect(
    () => () => {
      mixer.stopAllAction();
    },
    [mixer],
  );

  /**
   * Draw counter.
   *
   * The first field reading showed the frame carrying almost exactly three
   * times the hero's triangle count. Two passes are accounted for — the camera
   * and the shadow map — and the third was guesswork. This counts the real
   * thing: a hook on each of the hero's meshes, tallied per frame. If the
   * number is 3 with one mesh, there is a pass nobody asked for.
   */
  const drawsThisFrame = useRef(0);
  const framesCounted = useRef(0);
  const drawsAccumulated = useRef(0);
  const meshCount = useRef(0);

  useEffect(() => {
    const meshes: Mesh[] = [];
    model.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) meshes.push(child as Mesh);
    });
    meshCount.current = meshes.length;
    for (const mesh of meshes) {
      mesh.onBeforeRender = () => {
        drawsThisFrame.current += 1;
      };
    }
    return () => {
      for (const mesh of meshes) mesh.onBeforeRender = () => {};
    };
  }, [model]);

  const currentClip = useRef<HeroClip | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);
  const bag = useRef<ShuffleBag>(loadShuffleBag(hero.id, hero.animation.danceClips));
  const restPosition = useRef(new Vector3());
  const restQuaternion = useRef<[number, number, number, number]>([0, 0, 0, 1]);

  /**
   * Material correction.
   *
   * three.js draws a transparent double-sided material twice — back faces then
   * front faces — which doubles the cost of a 197k-triangle character for no
   * visible gain when the "transparency" is a 210/255 export artefact. The
   * decision is recorded per hero in the registry from an offline measurement,
   * not guessed at runtime.
   */
  useEffect(() => {
    if (!hero.material?.forceOpaque) return;
    model.traverse((child: Object3D) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (!material.transparent) continue;
        material.transparent = false;
        material.depthWrite = true;
        material.needsUpdate = true;
      }
    });
  }, [model, hero.material]);

  // Shadows follow the profile; the mesh does not.
  useEffect(() => {
    model.traverse((child) => {
      const mesh = child as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      if (mesh.isMesh) {
        mesh.castShadow = profile.heroShadow;
        mesh.receiveShadow = profile.heroShadow;
      }
    });
  }, [model, profile.heroShadow]);

  /**
   * Scale to the briefed height.
   *
   * The height is MEASURED from the mounted model, never taken on trust: the
   * registry figure is the raw mesh extent, which is not the rendered height
   * once rig units and armature scale are applied. Measuring is also what makes
   * a broken bind obvious instead of silent.
   *
   * Keloğlan is briefed at 1.45 m because he is a child in the tales; Nasreddin
   * Hodja at 1.65 m. Standing either at raw model height next to a 32 m Galata
   * Tower reads wrong.
   */
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const target = resolveAsset(hero.assetId, 'medium').entry.dimensions[1];

    node.scale.setScalar(1);
    node.updateMatrixWorld(true);
    const measured = new Box3().setFromObject(model).getSize(new Vector3()).y;

    if (measured > 0.0001 && target > 0) {
      node.scale.setScalar(target / measured);
      const registryHeight = hero.measuredHeightMeters;
      if (registryHeight && Math.abs(measured - registryHeight) > registryHeight * 0.5) {
        // Loud, because this is what an unbound skeleton looks like.
        console.warn(
          `[hero] ${hero.id} rendered ${measured.toFixed(3)} m but the registry records ` +
            `${registryHeight} m. Check that the skeleton is bound to the cloned bones.`,
        );
      }
    }

    restPosition.current.copy(node.position);
    restQuaternion.current = [node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w];
    onMeasured?.(measured);
  }, [model, hero.assetId, hero.id, hero.measuredHeightMeters, onMeasured]);

  const { speed, interacting, performing } = motion;

  useEffect(() => {
    // Hysteresis needs the clip that is currently playing, which is a ref, so
    // the decision belongs here rather than in the render body.
    const desiredClip = clipForState({ speed, interacting, performing }, currentClip.current);

    // A dance replay repeats the same state, so the token forces a re-run.
    if (desiredClip === currentClip.current && !isOneShot(desiredClip)) return;

    const clipName = ((): string | null => {
      if (desiredClip === 'dance') {
        const result = draw(bag.current);
        bag.current = result.bag;
        saveShuffleBag(hero.id, result.bag);
        return result.clip;
      }
      // Documented fallbacks live in the registry: agree falls back to wave,
      // wave and talk to idle, run to walk to idle.
      return resolveClipName(hero, desiredClip);
    })();

    const clip = clipName ? clipsByName.get(clipName) : undefined;
    const next: AnimationAction | null = clip ? mixer.clipAction(clip) : null;
    const previous = currentAction.current;
    const fade = transitionDuration(currentClip.current, desiredClip);

    if (next) {
      next.reset().fadeIn(fade).play();
      next.setEffectiveWeight(1);
      if (isOneShot(desiredClip)) {
        // One pass, then hand control back to the choreography. The pose is not
        // clamped: a clamped action keeps its weight forever and blends into
        // whatever plays next.
        next.setLoop(LoopOnce, 1);
        next.clampWhenFinished = false;
        /**
         * Some delivered clips run far longer than the beat they illustrate —
         * Nasreddin Hodja's agree gesture is 13 s. A cap in the registry ends
         * the beat early instead of holding the completion panel back.
         */
        const cap = clipName ? clipDurationCap(hero, clipName) : null;
        if (cap && next.getClip().duration > cap) {
          window.setTimeout(() => onClipFinished?.(), cap * 1000);
        }
      } else {
        next.setLoop(LoopRepeat, Infinity);
      }
      if (previous && previous !== next) previous.fadeOut(fade);
      currentAction.current = next;
    } else if (previous) {
      // Missing clip: hold the previous pose rather than snapping to bind pose.
      previous.play();
    } else {
      // Nothing to play and nothing playing would leave the bind pose on
      // screen. Idle is always better than a T-shape sliding along the ground.
      const idleName = hero.animation.clips.idle;
      const idle = idleName ? clipsByName.get(idleName) : undefined;
      if (idle) {
        const action = mixer.clipAction(idle);
        action.reset().setLoop(LoopRepeat, Infinity).play();
        currentAction.current = action;
      }
    }

    currentClip.current = desiredClip;
    onClipChange(desiredClip, clipName);
  }, [
    speed,
    interacting,
    performing,
    performanceToken,
    clipsByName,
    mixer,
    hero,
    onClipChange,
    onClipFinished,
  ]);

  // Celebration clips end; movement clips loop.
  useEffect(() => {
    const onFinished = () => {
      if (currentClip.current && isOneShot(currentClip.current)) onClipFinished?.();
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [mixer, onClipFinished]);

  /**
   * Bind-pose watchdog.
   *
   * A clip that finishes while clamped keeps its weight, a cross-fade can be
   * interrupted, and either way the character can end up with no action driving
   * him — arms out, sliding along the ground. Rather than chase every path that
   * leads there, this checks the outcome twice a second: if nothing is driving
   * the skeleton, idle is started. It is the symptom that matters to a child.
   */
  const watchdogElapsed = useRef(0);

  // Drive the single mixer manually so it can never run while unmounted.
  useFrame((_, delta) => {
    // useFrame runs before the render, so this frame's tally is last frame's.
    drawsAccumulated.current += drawsThisFrame.current;
    drawsThisFrame.current = 0;
    framesCounted.current += 1;
    if (framesCounted.current >= 30) {
      onDrawCount?.({
        meshes: meshCount.current,
        perFrame: Math.round((drawsAccumulated.current / framesCounted.current) * 10) / 10,
      });
      framesCounted.current = 0;
      drawsAccumulated.current = 0;
    }

    mixer.update(delta);

    watchdogElapsed.current += delta;
    if (watchdogElapsed.current >= 0.5) {
      watchdogElapsed.current = 0;
      let driving = 0;
      for (const clip of clipsByName.values()) {
        const action = mixer.existingAction(clip);
        if (action?.isRunning()) driving += action.getEffectiveWeight();
      }
      if (driving < 0.05) {
        const idleName = hero.animation.clips.idle;
        const idle = idleName ? clipsByName.get(idleName) : undefined;
        if (idle) {
          const action = mixer.clipAction(idle);
          action.reset().setEffectiveWeight(1).setLoop(LoopRepeat, Infinity).play();
          currentAction.current = action;
          currentClip.current = 'idle';
        }
      }
    }

    /**
     * Root-motion safety.
     *
     * The engine owns the character's world position, so every non-locomotion
     * clip has its horizontal root translation cancelled each frame and its
     * rest pose restored exactly when the clip ends. Measured offenders:
     * Keloğlan's FunnyDancing_01 drifts 0.21 m sideways, Nasreddin Hodja's
     * Agree_Gesture drifts 0.21 m forward. Walking and Running are in place
     * and keep their own transform.
     */
    const node = group.current;
    if (!node) return;
    const clip = currentClip.current;
    if (clip && !isLocomotion(clip)) {
      node.position.x = restPosition.current.x;
      node.position.z = restPosition.current.z;
    } else {
      node.position.copy(restPosition.current);
      const [x, y, z, w] = restQuaternion.current;
      node.quaternion.set(x, y, z, w);
    }
  });

  return (
    <group ref={group}>
      <primitive object={model} />
      {/*
        A real shadow costs a second full pass of a 197k-triangle character.
        Below the top profile the guide gets a soft blob instead: two triangles,
        and it still reads as standing on the ground rather than floating.
      */}
      {profile.heroShadow ? null : (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <circleGeometry args={[0.42, 20]} />
          <meshBasicMaterial color="#2A2418" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

class HeroErrorBoundary extends React.Component<
  { fallback: ReactNode; children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export type HeroRenderMode = 'placeholder' | 'model';

/**
 * Pure render decision, kept outside the component so it can be tested without
 * a WebGL canvas. Anything other than "ready, not failed, model delivered"
 * draws the placeholder and the city stays playable (policy rule 10).
 */
export function heroRenderMode(input: {
  ready: boolean;
  failed: boolean;
  modelUrl: string | null;
}): HeroRenderMode {
  if (!input.ready) return 'placeholder';
  if (input.failed) return 'placeholder';
  if (!input.modelUrl) return 'placeholder';
  return 'model';
}

export interface HeroCharacterProps {
  hero: HeroDefinition;
  profile: QualitySettings;
  motion: HeroMotionState;
  /** False until the city shell and canonical content are ready (policy rule 2). */
  ready: boolean;
  onStatusChange?: (status: HeroStatus) => void;
  onClipFinished?: () => void;
  onMeasured?: (heightMeters: number) => void;
  onDrawCount?: (draws: { meshes: number; perFrame: number }) => void;
  /** Incremented to restart the current one-shot clip. */
  performanceToken?: number;
}

export interface HeroStatus {
  heroId: HeroId;
  state: 'waiting' | 'loading' | 'ready' | 'placeholder' | 'failed';
  clip: HeroClip | null;
  clipName: string | null;
  shadow: boolean;
}

export function HeroCharacter({
  hero,
  profile,
  motion,
  ready,
  onStatusChange,
  onClipFinished,
  onMeasured,
  onDrawCount,
  performanceToken = 0,
}: HeroCharacterProps) {
  const [failed, setFailed] = useState(false);
  const placeholderAsset = useMemo(() => resolveAsset(hero.assetId, 'medium'), [hero.assetId]);
  const placeholder = <PlaceholderAsset asset={placeholderAsset} />;

  // The url is a pure function of the hero, so it is derived rather than stored.
  const mode = heroRenderMode({ ready, failed, modelUrl: hero.modelUrl });
  // The registry stores a repository path; the asset host decides where it lives.
  const url = mode === 'model' ? heroModelUrl(hero) : null;

  // The GLB is registered with the cache only once the rest of the city is
  // playable, which is what keeps the hero off the critical path (policy rule 2).
  useEffect(() => {
    if (!ready) return;
    requestHero(hero.id, 'city-enter');
  }, [ready, hero.id]);

  const report = (status: Omit<HeroStatus, 'heroId' | 'shadow'>) =>
    onStatusChange?.({ ...status, heroId: hero.id, shadow: profile.heroShadow });

  useEffect(() => {
    if (!ready) report({ state: 'waiting', clip: null, clipName: null });
    else if (failed) report({ state: 'failed', clip: null, clipName: null });
    else if (!url) report({ state: 'placeholder', clip: null, clipName: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed, url]);

  if (!ready || failed || !url) return placeholder;

  return (
    <HeroErrorBoundary
      fallback={placeholder}
      onError={(error) => {
        console.warn(`[hero] ${hero.id} failed to load; falling back to placeholder`, error);
        setFailed(true);
      }}
    >
      <Suspense fallback={placeholder}>
        <HeroModel
          hero={hero}
          url={url}
          profile={profile}
          motion={motion}
          performanceToken={performanceToken}
          onClipFinished={onClipFinished}
          onMeasured={onMeasured}
          onDrawCount={onDrawCount}
          onClipChange={(clip, clipName) => report({ state: 'ready', clip, clipName })}
        />
      </Suspense>
    </HeroErrorBoundary>
  );
}
