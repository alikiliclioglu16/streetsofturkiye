'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { Vector3 } from 'three';
import type { SceneDescription } from '@/engine/scene/buildScene';
import { HeroCharacter, type HeroStatus } from '@/components/three/HeroCharacter';
import { heroForGuide } from '@/engine/heroes/registry';
import type { QualityProfile } from '@/engine/heroes/policy';
import { inputState } from '@/engine/controls/inputState';
import { distance2, resolveMovement, stepWithCollision, type Point2 } from '@/engine/controls/movement';
import {
  advanceGuided,
  createGuidedState,
  guidedPauseHotspot,
  headingTowards,
  type GuidedState,
  type GuidedStop,
} from '@/engine/controls/guided';
import { clampPitch, followCameraPosition, smoothing } from '@/engine/camera/anchors';
import { celebrationCamera } from '@/engine/heroes/celebration';

interface PlayerRigProps {
  scene: SceneDescription;
  guided: boolean;
  /** True while a panel is open: the player holds still and the camera frames the hotspot. */
  frozen: boolean;
  reducedMotion: boolean;
  /** Camera anchor to hold while an interaction is running. */
  focus: { position: [number, number, number]; target: [number, number, number]; durationMs: number } | null;
  /** Stops already performed; guided mode no longer halts at these. */
  completedHotspotIds: readonly string[];
  /** Canonical guide id for this city; selects which hero is mounted. */
  guideId: string;
  profile: QualityProfile;
  /** The hero GLB is requested only once the city is otherwise playable. */
  heroReady: boolean;
  interacting: boolean;
  celebrating: boolean;
  /** True while the camera should frame the guide for a celebration. */
  framingCelebration: boolean;
  onCelebrationFramed?: () => void;
  onDanceFinished?: () => void;
  danceToken?: number;
  onHeroStatus?: (status: HeroStatus) => void;
  onFocusSettled: () => void;
  onNearestChange: (hotspotId: string | null) => void;
}

export function PlayerRig({
  scene,
  guided,
  frozen,
  reducedMotion,
  focus,
  completedHotspotIds,
  guideId,
  profile,
  heroReady,
  interacting,
  celebrating,
  framingCelebration,
  onCelebrationFramed,
  onDanceFinished,
  danceToken = 0,
  onHeroStatus,
  onFocusSettled,
  onNearestChange,
}: PlayerRigProps) {
  const { camera } = useThree();
  const bodyRef = useRef<Group>(null);

  const position = useRef<Point2>({ x: scene.spawn[0], z: scene.spawn[2] });
  const heading = useRef<number>(scene.spawnHeading);
  const pitch = useRef<number>(0.08);
  const guidedState = useRef<GuidedState>(createGuidedState(scene.routePoints));
  const nearestId = useRef<string | null>(null);
  const previousPosition = useRef<Point2>({ x: scene.spawn[0], z: scene.spawn[2] });
  const settledFor = useRef<string | null>(null);
  const lookTarget = useRef(new Vector3());
  const framedRef = useRef(false);
  const hero = useMemo(() => heroForGuide(guideId), [guideId]);

  // Ground speed feeds the animation state; it is sampled, never React state.
  const [speed, setSpeed] = useState(0);
  const speedRef = useRef(0);
  const speedSampledAt = useRef(0);

  const stops = useMemo<GuidedStop[]>(
    () =>
      scene.hotspots.map((hotspot) => ({
        id: hotspot.id,
        position: { x: hotspot.position[0], z: hotspot.position[2] },
        triggerRadius: hotspot.triggerRadius,
        order: hotspot.order,
      })),
    [scene],
  );

  // Read inside useFrame without re-creating the loop on every progress change.
  const completedRef = useRef<readonly string[]>(completedHotspotIds);
  useEffect(() => {
    completedRef.current = completedHotspotIds;
  }, [completedHotspotIds]);

  useEffect(() => {
    position.current = { x: scene.spawn[0], z: scene.spawn[2] };
    heading.current = scene.spawnHeading;
    guidedState.current = createGuidedState(scene.routePoints);
    nearestId.current = null;
  }, [scene]);

  // Pointer drag orbits the camera within child-friendly pitch limits.
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      heading.current -= (event.clientX - lastX) * 0.005;
      pitch.current = clampPitch(pitch.current + (event.clientY - lastY) * 0.003);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const up = () => {
      dragging = false;
    };

    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);

    if (guided) {
      const before = guidedState.current.position;
      const blockedBy = guidedPauseHotspot(before, stops, completedRef.current);
      guidedState.current = advanceGuided(
        guidedState.current,
        scene.routePoints,
        delta,
        frozen || blockedBy !== null,
      );
      const after = guidedState.current.position;
      if (distance2(before, after) > 0.0005) {
        heading.current = headingTowards(before, after);
      }
      // The authored route should never clip a building, but if a scene is
      // edited by hand the guide still walks around rather than through.
      position.current = resolveMovement(before, after, scene.bounds, scene.colliders);
      guidedState.current = { ...guidedState.current, position: position.current };
    } else if (!frozen) {
      heading.current -= inputState.yawDelta * delta * 2.2;
      inputState.yawDelta = 0;
      position.current = stepWithCollision(
        position.current,
        { forward: inputState.forward, strafe: inputState.strafe },
        heading.current,
        delta,
        scene.bounds,
        scene.colliders,
      );
    }

    if (bodyRef.current) {
      bodyRef.current.position.set(position.current.x, 0, position.current.z);
      bodyRef.current.rotation.y = heading.current;
    }

    // Publish speed at 10 Hz so the clip selector reacts without per-frame renders.
    speedRef.current = delta > 0 ? distance2(previousPosition.current, position.current) / delta : 0;
    previousPosition.current = { ...position.current };
    speedSampledAt.current += delta;
    if (speedSampledAt.current >= 0.1) {
      speedSampledAt.current = 0;
      const rounded = Math.round(speedRef.current * 10) / 10;
      setSpeed((current) => (current === rounded ? current : rounded));
    }

    // Celebration framing wins over everything: the guide is the subject.
    if (framingCelebration) {
      const anchor = celebrationCamera([position.current.x, 0, position.current.z]);
      const factor = smoothing(delta, anchor.durationMs, reducedMotion);
      camera.position.lerp(new Vector3(...anchor.position), factor);
      lookTarget.current.lerp(new Vector3(...anchor.target), factor);
      camera.lookAt(lookTarget.current);
      if (camera.position.distanceTo(new Vector3(...anchor.position)) < 0.4 && !framedRef.current) {
        framedRef.current = true;
        onCelebrationFramed?.();
      }
      return;
    }
    framedRef.current = false;

    // Camera: authored anchor while focused, follow rig otherwise.
    if (focus) {
      const factor = smoothing(delta, focus.durationMs, reducedMotion);
      camera.position.lerp(new Vector3(...focus.position), factor);
      lookTarget.current.lerp(new Vector3(...focus.target), factor);
      camera.lookAt(lookTarget.current);

      const key = focus.position.join(',');
      const arrived = camera.position.distanceTo(new Vector3(...focus.position)) < 0.35;
      if (arrived && settledFor.current !== key) {
        settledFor.current = key;
        onFocusSettled();
      }
    } else {
      settledFor.current = null;
      const desired = followCameraPosition(
        position.current.x,
        position.current.z,
        heading.current,
        pitch.current,
      );
      camera.position.lerp(new Vector3(...desired), reducedMotion ? 1 : Math.min(1, delta * 6));
      lookTarget.current.lerp(new Vector3(position.current.x, 1.4, position.current.z), reducedMotion ? 1 : Math.min(1, delta * 8));
      camera.lookAt(lookTarget.current);
    }

    // Proximity is evaluated every frame but only reported when it changes.
    let found: string | null = null;
    for (const hotspot of scene.hotspots) {
      const flat = { x: hotspot.position[0], z: hotspot.position[2] };
      if (distance2(position.current, flat) <= hotspot.triggerRadius) {
        found = hotspot.id;
        break;
      }
    }
    if (found !== nearestId.current) {
      nearestId.current = found;
      onNearestChange(found);
    }
  });

  return (
    <group ref={bodyRef}>
      <HeroCharacter
        hero={hero}
        profile={profile}
        ready={heroReady}
        motion={{ speed, interacting, celebrating }}
        danceToken={danceToken}
        onDanceFinished={onDanceFinished}
        onStatusChange={onHeroStatus}
      />
      {/* Facing indicator: direction is readable without relying on colour. */}
      <mesh position={[0, 0.06, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 0.5, 3]} />
        <meshStandardMaterial color="#16324F" roughness={0.6} />
      </mesh>
    </group>
  );
}
