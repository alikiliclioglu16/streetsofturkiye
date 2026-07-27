'use client';

import { useMemo } from 'react';
import type { SceneDescription } from '@/engine/scene/buildScene';
import type { QualitySettings } from '@/engine/quality/quality';
import { HotspotObject } from '@/components/three/HotspotObject';
import { PlayerRig } from '@/components/three/PlayerRig';

interface CitySceneProps {
  scene: SceneDescription;
  quality: QualitySettings;
  reducedMotion: boolean;
  guided: boolean;
  frozen: boolean;
  completedHotspotIds: readonly string[];
  activeHotspotId: string | null;
  inspect: { hotspotId: string; targetId: string; spin: number; onPick: (id: string) => void } | null;
  focus: { position: [number, number, number]; target: [number, number, number]; durationMs: number } | null;
  onFocusSettled: () => void;
  onNearestChange: (hotspotId: string | null) => void;
}

/**
 * Environment, route and props are generated from the scene description.
 * No city-specific copy or transforms live here (CLAUDE.md rule 3).
 */
export function CityScene({
  scene,
  quality,
  reducedMotion,
  guided,
  frozen,
  completedHotspotIds,
  activeHotspotId,
  inspect,
  focus,
  onFocusSettled,
  onNearestChange,
}: CitySceneProps) {
  const completed = useMemo(() => new Set(completedHotspotIds), [completedHotspotIds]);

  // Route markers are instanced-friendly primitives reused across cities.
  const markerScale = scene.routeMarker.entry.dimensions;

  return (
    <>
      <hemisphereLight args={['#BFE4F2', '#7C6A55', 1.0]} />
      <directionalLight
        position={[18, 24, 12]}
        intensity={1.35}
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      {/* Ground plate sized from the authored bounds. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[scene.ground.centerX, 0, scene.ground.centerZ]}
        receiveShadow
      >
        <planeGeometry args={[scene.ground.width, scene.ground.depth]} />
        <meshStandardMaterial color="#D9CFBC" roughness={0.95} />
      </mesh>

      {/* Boundary posts: the play area is visible rather than an invisible wall. */}
      {scene.bounds.map((corner, index) => (
        <mesh key={`bound-${index}`} position={[corner[0], 0.9, corner[2]]} castShadow>
          <boxGeometry args={[0.35, 1.8, 0.35]} />
          <meshStandardMaterial color="#16324F" roughness={0.8} />
        </mesh>
      ))}

      {scene.routePoints.map((point, index) => (
        <mesh
          key={`route-${index}`}
          position={[point[0], 0.03, point[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[markerScale[0] / 2 + 0.25, 20]} />
          <meshStandardMaterial color={scene.routeMarker.entry.color} roughness={0.7} />
        </mesh>
      ))}

      {scene.hotspots.map((hotspot) => (
        <HotspotObject
          key={hotspot.id}
          hotspot={hotspot}
          completed={completed.has(hotspot.id)}
          inRange={activeHotspotId === hotspot.id}
          reducedMotion={reducedMotion}
          inspect={
            inspect && inspect.hotspotId === hotspot.id
              ? { targetId: inspect.targetId, spin: inspect.spin, onPick: inspect.onPick }
              : null
          }
        />
      ))}

      <PlayerRig
        scene={scene}
        guided={guided}
        frozen={frozen}
        reducedMotion={reducedMotion}
        completedHotspotIds={completedHotspotIds}
        focus={focus}
        onFocusSettled={onFocusSettled}
        onNearestChange={onNearestChange}
      />
    </>
  );
}
