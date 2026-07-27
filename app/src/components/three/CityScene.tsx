'use client';

import { useMemo } from 'react';
import type { SceneDescription } from '@/engine/scene/buildScene';
import type { QualityProfile } from '@/engine/quality/quality';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import { HotspotObject } from '@/components/three/HotspotObject';
import { PlayerRig } from '@/components/three/PlayerRig';

interface CitySceneProps {
  scene: SceneDescription;
  quality: QualityProfile;
  reducedMotion: boolean;
  guided: boolean;
  frozen: boolean;
  completedHotspotIds: readonly string[];
  activeHotspotId: string | null;
  inspect: { hotspotId: string; targetId: string; spin: number; onPick: (id: string) => void } | null;
  focus: { position: [number, number, number]; target: [number, number, number]; durationMs: number } | null;
  onFocusSettled: () => void;
  onNearestChange: (hotspotId: string | null) => void;
  guideId: string;
  heroReady: boolean;
  interacting: boolean;
  celebrating: boolean;
  onHeroStatus?: (status: HeroStatus) => void;
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
  guideId,
  heroReady,
  interacting,
  celebrating,
  onHeroStatus,
}: CitySceneProps) {
  const completed = useMemo(() => new Set(completedHotspotIds), [completedHotspotIds]);

  /**
   * Nonessential decoration. Count scales with `environmentDensity` and
   * anything past `distantAssetCutoff` is dropped — these are the first two
   * rungs of the degradation ladder, and the reason the hero mesh never has to
   * be touched.
   */
  const decoration = useMemo(() => {
    const base = 24;
    const count = Math.round(base * quality.environmentDensity);
    const items: { key: string; position: [number, number, number]; height: number }[] = [];
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.399963;
      const radius = 12 + (i % 7) * 4.5;
      const x = scene.ground.centerX + Math.cos(angle) * radius;
      const z = scene.ground.centerZ + Math.sin(angle) * radius;
      const distance = Math.hypot(x - scene.ground.centerX, z - scene.ground.centerZ);
      if (distance > quality.distantAssetCutoff) continue;
      items.push({ key: `decor-${i}`, position: [x, 0, z], height: 1.2 + (i % 4) * 0.6 });
    }
    return items;
  }, [quality.environmentDensity, quality.distantAssetCutoff, scene.ground]);

  // Route markers are instanced-friendly primitives reused across cities.
  const markerScale = scene.routeMarker.entry.dimensions;

  return (
    <>
      <hemisphereLight args={['#BFE4F2', '#7C6A55', 1.0]} />
      <directionalLight
        position={[18, 24, 12]}
        intensity={1.35}
        castShadow={quality.heroShadow}
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

      {/* Boundary posts: the play area is visible rather than an invisible wall.
          Corner posts are essential; decorative density is applied to props. */}
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

      {decoration.map((item) => (
        <mesh
          key={item.key}
          position={[item.position[0], item.height / 2, item.position[2]]}
          castShadow={quality.shadowMapSize > 512}
          receiveShadow
        >
          <boxGeometry args={[0.8, item.height, 0.8]} />
          <meshStandardMaterial color="#B8AC98" roughness={0.9} />
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
        guideId={guideId}
        profile={quality}
        heroReady={heroReady}
        interacting={interacting}
        celebrating={celebrating}
        onHeroStatus={onHeroStatus}
        focus={focus}
        onFocusSettled={onFocusSettled}
        onNearestChange={onNearestChange}
      />
    </>
  );
}
