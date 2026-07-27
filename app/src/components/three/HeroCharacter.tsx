'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { AnimationAction, Group } from 'three';
import { Box3, Vector3 } from 'three';
import { resolveAsset } from '@/engine/assets/registry';
import { PlaceholderAsset } from '@/components/three/PlaceholderAsset';
import { clipForState, transitionDuration, type HeroMotionState } from '@/engine/heroes/animation';
import { createShuffleBag, draw, type ShuffleBag } from '@/engine/heroes/danceBag';
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
}

function HeroModel({ hero, url, profile, motion, onClipChange }: HeroModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);

  // Clone so the cached source stays pristine for the next city.
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions, mixer } = useAnimations(animations, group);

  const currentClip = useRef<HeroClip | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);
  const bag = useRef<ShuffleBag>(createShuffleBag(hero.animation.danceClips));

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

  // Normalise gross scale mismatches against the manifest footprint.
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const target = resolveAsset(hero.assetId, 'medium').entry.dimensions[1];
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    if (size.y > 0.0001 && target > 0) {
      const factor = target / size.y;
      if (factor < 0.5 || factor > 2) node.scale.setScalar(factor);
    }
  }, [model, hero.assetId]);

  const desiredClip = clipForState(motion);

  useEffect(() => {
    if (desiredClip === currentClip.current) return;

    let clipName: string | null;
    if (desiredClip === 'dance') {
      const result = draw(bag.current);
      bag.current = result.bag;
      clipName = result.clip;
    } else {
      clipName = hero.animation.clips[desiredClip] ?? null;
    }

    const next = clipName ? (actions[clipName] ?? null) : null;
    const previous = currentAction.current;
    const fade = transitionDuration(currentClip.current, desiredClip);

    if (next) {
      next.reset().fadeIn(fade).play();
      if (previous && previous !== next) previous.fadeOut(fade);
      currentAction.current = next;
    } else if (previous) {
      // Missing clip: hold the previous pose rather than snapping to bind pose.
      previous.play();
    }

    currentClip.current = desiredClip;
    onClipChange(desiredClip, clipName);
  }, [desiredClip, actions, hero.animation.clips, onClipChange]);

  // Drive the single mixer manually so it can never run while unmounted.
  useFrame((_, delta) => {
    mixer.update(delta);
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
}

export interface HeroStatus {
  heroId: HeroId;
  state: 'waiting' | 'loading' | 'ready' | 'placeholder' | 'failed';
  clip: HeroClip | null;
  clipName: string | null;
  shadow: boolean;
}

export function HeroCharacter({ hero, profile, motion, ready, onStatusChange }: HeroCharacterProps) {
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
          onClipChange={(clip, clipName) => report({ state: 'ready', clip, clipName })}
        />
      </Suspense>
    </HeroErrorBoundary>
  );
}
