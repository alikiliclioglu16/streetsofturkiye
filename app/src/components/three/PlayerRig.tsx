'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { Vector3 } from 'three';
import type { SceneDescription } from '@/engine/scene/buildScene';
import { HeroCharacter, type HeroStatus } from '@/components/three/HeroCharacter';
import { heroForGuide, type HeroClip } from '@/engine/heroes/registry';
import type { QualitySettings } from '@/engine/heroes/policy';
import { inputState } from '@/engine/controls/inputState';
import { distance2, stepWithCollision, TURN_SPEED, type Point2 } from '@/engine/controls/movement';
import { clampPitch, decayOrbit, followCameraPosition, smoothing } from '@/engine/camera/anchors';
import { celebrationCamera } from '@/engine/heroes/celebration';

interface PlayerRigProps {
  scene: SceneDescription;
  /** True while a panel is open: the player holds still and the camera frames the hotspot. */
  frozen: boolean;
  reducedMotion: boolean;
  /** Camera anchor to hold while an interaction is running. */
  focus: { position: [number, number, number]; target: [number, number, number]; durationMs: number } | null;
  /** Canonical guide id for this city; selects which hero is mounted. */
  guideId: string;
  profile: QualitySettings;
  /** The hero GLB is requested only once the city is otherwise playable. */
  heroReady: boolean;
  interacting: boolean;
  /** One-shot clip driven by the choreography, or null. */
  performing: HeroClip | null;
  performanceLocked: boolean;
  /** True while the camera should frame the guide for a celebration. */
  framingCelebration: boolean;
  onCelebrationFramed?: () => void;
  onClipFinished?: () => void;
  performanceToken?: number;
  onHeroStatus?: (status: HeroStatus) => void;
  onHeroMeasured?: (heightMeters: number) => void;
  onHeroDrawCount?: (draws: { meshes: number; perFrame: number }) => void;
  onHeroMotion?: (motion: { weight: number; advancing: boolean; revivals: number }) => void;
  onFocusSettled: () => void;
  onNearestChange: (hotspotId: string | null) => void;
}

export function PlayerRig({
  scene,
  frozen,
  reducedMotion,
  focus,
  guideId,
  profile,
  heroReady,
  interacting,
  performing,
  performanceLocked,
  framingCelebration,
  onCelebrationFramed,
  onClipFinished,
  performanceToken = 0,
  onHeroStatus,
  onHeroMeasured,
  onHeroDrawCount,
  onHeroMotion,
  onFocusSettled,
  onNearestChange,
}: PlayerRigProps) {
  const { camera } = useThree();
  const bodyRef = useRef<Group>(null);

  const position = useRef<Point2>({ x: scene.spawn[0], z: scene.spawn[2] });
  const heading = useRef<number>(scene.spawnHeading);
  const pitch = useRef<number>(0.08);
  const nearestId = useRef<string | null>(null);
  const previousPosition = useRef<Point2>({ x: scene.spawn[0], z: scene.spawn[2] });
  const settledFor = useRef<string | null>(null);
  const lookTarget = useRef(new Vector3());
  const framedRef = useRef(false);
  /** Camera orbit relative to the guide's heading; drag changes it, walking undoes it. */
  const orbitOffset = useRef(0);
  const hero = useMemo(() => heroForGuide(guideId), [guideId]);

  // Ground speed feeds the animation state; it is sampled, never React state.
  const [speed, setSpeed] = useState(0);
  const speedRef = useRef(0);
  const speedSampledAt = useRef(0);


  useEffect(() => {
    position.current = { x: scene.spawn[0], z: scene.spawn[2] };
    heading.current = scene.spawnHeading;
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
      // Dragging moves the camera around him, not him.
      orbitOffset.current -= (event.clientX - lastX) * 0.006;
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

    if (!frozen) {
      // Left and right turn the guide, so the player can look back at him.
      heading.current += inputState.turn * TURN_SPEED * delta;
      heading.current -= inputState.yawDelta * delta * 2.2;
      inputState.yawDelta = 0;
      position.current = stepWithCollision(
        position.current,
        { forward: inputState.forward, strafe: 0 },
        heading.current,
        delta,
        scene.bounds,
        scene.colliders,
        inputState.running,
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
      // Celebration is the one moment the camera goes round to his face.
      const anchor = celebrationCamera(
        [position.current.x, 0, position.current.z],
        heading.current,
      );
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
      const moving = Math.abs(inputState.forward) > 0.01;
      orbitOffset.current = decayOrbit(orbitOffset.current, moving, delta);
      const desired = followCameraPosition(
        position.current.x,
        position.current.z,
        heading.current + orbitOffset.current,
        pitch.current,
      );
      camera.position.lerp(new Vector3(...desired), reducedMotion ? 1 : Math.min(1, delta * 6));
      lookTarget.current.lerp(
        new Vector3(position.current.x, 1.4, position.current.z),
        reducedMotion ? 1 : Math.min(1, delta * 8),
      );
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
        motion={{ speed, interacting, performing, performanceLocked }}
        performanceToken={performanceToken}
        onClipFinished={onClipFinished}
        onMeasured={onHeroMeasured}
        onDrawCount={onHeroDrawCount}
        onMotionReport={onHeroMotion}
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
