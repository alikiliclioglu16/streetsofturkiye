'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { AnimationAction, AnimationClip, Group } from 'three';
import { AnimationMixer, Box3, LoopOnce, LoopRepeat, Vector3 } from 'three';
import { resolveAsset } from '@/engine/assets/registry';
import { PlaceholderAsset } from '@/components/three/PlaceholderAsset';
import { clipForState, transitionDuration, type HeroMotionState } from '@/engine/heroes/animation';
import { draw, loadShuffleBag, saveShuffleBag, type ShuffleBag } from '@/engine/heroes/danceBag';
import { requestHero } from '@/engine/heroes/heroCache';
import type { HeroClip, HeroDefinition, HeroId } from '@/engine/heroes/registry';
import type { QualityProfile } from '@/engine/heroes/policy';

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
  profile: QualityProfile;
  motion: HeroMotionState;
  onClipChange: (clip: HeroClip, clipName: string | null) => void;
  onDanceFinished?: () => void;
  /** Bumping this replays the celebration with the next clip from the bag. */
  danceToken: number;
}

function HeroModel({
  hero,
  url,
  profile,
  motion,
  onClipChange,
  onDanceFinished,
  danceToken,
}: HeroModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);

  // Clone so the cached source stays pristine for the next city.
  const model = useMemo(() => scene.clone(true), [scene]);

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

  const currentClip = useRef<HeroClip | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);
  const bag = useRef<ShuffleBag>(loadShuffleBag(hero.id, hero.animation.danceClips));
  const restPosition = useRef(new Vector3());
  const restQuaternion = useRef<[number, number, number, number]>([0, 0, 0, 1]);

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
   * The delivered model measures 1.70 m while the asset manifest briefs
   * Keloğlan at 1.45 m — he is a child in the tales, and standing him at adult
   * height next to a 32 m Galata Tower reads wrong. The measured height is
   * recorded in the registry so this is a stated correction, not a guess.
   */
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const target = resolveAsset(hero.assetId, 'medium').entry.dimensions[1];
    const measured =
      hero.measuredHeightMeters ?? new Box3().setFromObject(model).getSize(new Vector3()).y;
    if (measured > 0.0001 && target > 0) {
      node.scale.setScalar(target / measured);
    }
    restPosition.current.copy(node.position);
    restQuaternion.current = [node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w];
  }, [model, hero.assetId, hero.measuredHeightMeters]);

  const desiredClip = clipForState(motion);

  useEffect(() => {
    // A dance replay repeats the same state, so the token forces a re-run.
    if (desiredClip === currentClip.current && desiredClip !== 'dance') return;

    const clipName = ((): string | null => {
      if (desiredClip === 'dance') {
        const result = draw(bag.current);
        bag.current = result.bag;
        saveShuffleBag(hero.id, result.bag);
        return result.clip;
      }
      const mapped = hero.animation.clips[desiredClip];
      if (mapped) return mapped;
      // Documented fallbacks: missing run uses walk, missing walk or talk holds
      // idle. Movement still translates the rig either way.
      if (desiredClip === 'run') return hero.animation.clips.walk ?? hero.animation.clips.idle ?? null;
      return hero.animation.clips.idle ?? null;
    })();

    const clip = clipName ? clipsByName.get(clipName) : undefined;
    const next: AnimationAction | null = clip ? mixer.clipAction(clip) : null;
    const previous = currentAction.current;
    const fade = transitionDuration(currentClip.current, desiredClip);

    if (next) {
      next.reset().fadeIn(fade).play();
      if (desiredClip === 'dance') {
        // One pass, then hand control back to the choreography.
        next.setLoop(LoopOnce, 1);
        next.clampWhenFinished = true;
      } else {
        next.setLoop(LoopRepeat, Infinity);
      }
      if (previous && previous !== next) previous.fadeOut(fade);
      currentAction.current = next;
    } else if (previous) {
      // Missing clip: hold the previous pose rather than snapping to bind pose.
      previous.play();
    }

    currentClip.current = desiredClip;
    onClipChange(desiredClip, clipName);
  }, [desiredClip, danceToken, clipsByName, mixer, hero.animation.clips, hero.id, onClipChange]);

  // Celebration clips end; movement clips loop.
  useEffect(() => {
    const onFinished = () => {
      if (currentClip.current === 'dance') onDanceFinished?.();
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [mixer, onDanceFinished]);

  // Drive the single mixer manually so it can never run while unmounted.
  useFrame((_, delta) => {
    mixer.update(delta);

    /**
     * Root-motion safety.
     *
     * Two approved dances drift: FunnyDancing_01 travels 0.21 m sideways and
     * several move vertically. The guide must stay on his celebration mark, so
     * horizontal root translation is cancelled every frame and the rest pose is
     * restored exactly when the clip ends.
     */
    const node = group.current;
    if (!node) return;
    if (currentClip.current === 'dance') {
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
  profile: QualityProfile;
  motion: HeroMotionState;
  /** False until the city shell and canonical content are ready (policy rule 2). */
  ready: boolean;
  onStatusChange?: (status: HeroStatus) => void;
  onDanceFinished?: () => void;
  /** Incremented to replay the celebration with the next clip from the bag. */
  danceToken?: number;
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
  onDanceFinished,
  danceToken = 0,
}: HeroCharacterProps) {
  const [failed, setFailed] = useState(false);
  const placeholderAsset = useMemo(() => resolveAsset(hero.assetId, 'medium'), [hero.assetId]);
  const placeholder = <PlaceholderAsset asset={placeholderAsset} />;

  // The url is a pure function of the hero, so it is derived rather than stored.
  const mode = heroRenderMode({ ready, failed, modelUrl: hero.modelUrl });
  const url = mode === 'model' ? hero.modelUrl : null;

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
          danceToken={danceToken}
          onDanceFinished={onDanceFinished}
          onClipChange={(clip, clipName) => report({ state: 'ready', clip, clipName })}
        />
      </Suspense>
    </HeroErrorBoundary>
  );
}
