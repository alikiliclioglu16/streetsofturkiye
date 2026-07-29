'use client';

import { useMemo } from 'react';
import type { SceneDescription } from '@/engine/scene/buildScene';
import type { QualitySettings } from '@/engine/quality/quality';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import type { HeroClip } from '@/engine/heroes/registry';
import { AssetInstance } from '@/components/three/AssetInstance';
import { WindProp } from '@/components/three/WindProp';
import { Tram } from '@/components/three/Tram';
import { Ground } from '@/components/three/Ground';
import { Water } from '@/components/three/Water';
import { HotspotObject } from '@/components/three/HotspotObject';
import { StreetCat } from '@/components/three/StreetCat';
import { StreetTrees } from '@/components/three/StreetTrees';
import { FeaturedNpcActor } from '@/components/three/FeaturedNpc';
import { PlayerRig } from '@/components/three/PlayerRig';

interface CitySceneProps {
  scene: SceneDescription;
  quality: QualitySettings;
  reducedMotion: boolean;
  frozen: boolean;
  completedHotspotIds: readonly string[];
  activeHotspotId: string | null;
  focus: { position: [number, number, number]; target: [number, number, number]; durationMs: number } | null;
  onFocusSettled: () => void;
  onNearestChange: (hotspotId: string | null) => void;
  guideId: string;
  heroReady: boolean;
  interacting: boolean;
  performing: HeroClip | null;
  performanceLocked: boolean;
  framingCelebration: boolean;
  onCelebrationFramed?: () => void;
  onClipFinished?: () => void;
  performanceToken?: number;
  onHeroStatus?: (status: HeroStatus) => void;
  onHeroMeasured?: (heightMeters: number) => void;
  onHeroDrawCount?: (draws: { meshes: number; perFrame: number }) => void;
  onHeroMotion?: (motion: { weight: number; advancing: boolean; revivals: number }) => void;
}

/**
 * Environment, route and props are generated from the scene description.
 * No city-specific copy or transforms live here (CLAUDE.md rule 3).
 */
export function CityScene({
  scene,
  quality,
  reducedMotion,
  frozen,
  completedHotspotIds,
  activeHotspotId,
  focus,
  onFocusSettled,
  onNearestChange,
  guideId,
  heroReady,
  interacting,
  performing,
  performanceLocked,
  framingCelebration,
  onCelebrationFramed,
  onClipFinished,
  performanceToken,
  onHeroStatus,
  onHeroMeasured,
  onHeroDrawCount,
  onHeroMotion,
}: CitySceneProps) {
  const completed = useMemo(() => new Set(completedHotspotIds), [completedHotspotIds]);

  // Route markers are instanced-friendly primitives reused across cities.
  const markerScale = scene.routeMarker.entry.dimensions;

  return (
    <>
      {/* Region atmosphere. Haze also hides the edge of the ground plate. */}
      <fog attach="fog" args={[scene.sky.horizon, 40, 190]} />
      <hemisphereLight args={[scene.sky.top, scene.ground.color, 1.0]} />
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

      <Ground ground={scene.ground} surface={scene.groundSurface} />

      {scene.water ? (
        <Water
          centerX={scene.water.centerX}
          centerZ={scene.water.centerZ}
          width={scene.water.width}
          depth={scene.water.depth}
          color={scene.water.color}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/* Scenery beyond the play area: never solid, never reached. */}
      {scene.backdrop.map((prop) => (
        <group key={prop.key} position={prop.position} rotation={[0, prop.rotationY, 0]}>
          <AssetInstance asset={prop.asset} castShadow={false} />
        </group>
      ))}

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

      {/* Street dressing: static, no state, no interaction. */}
      {scene.props.map((prop) =>
        // The flag is the one prop whose stillness would be conspicuous.
        prop.asset.entry.id === 'kit_turkish_flag' ? (
          <WindProp
            key={prop.key}
            asset={prop.asset}
            position={prop.position}
            rotationY={prop.rotationY}
            reducedMotion={reducedMotion}
          />
        ) : (
          <group key={prop.key} position={prop.position} rotation={[0, prop.rotationY, 0]}>
            <AssetInstance asset={prop.asset} />
          </group>
        ),
      )}


      {/* Street dressing: static, shared across cities, no interaction. */}
      {scene.props.map((prop) =>
        // The flag is the one prop whose stillness would be conspicuous.
        prop.asset.entry.id === 'kit_turkish_flag' ? (
          <WindProp
            key={prop.key}
            asset={prop.asset}
            position={prop.position}
            rotationY={prop.rotationY}
            reducedMotion={reducedMotion}
          />
        ) : (
          <group key={prop.key} position={prop.position} rotation={[0, prop.rotationY, 0]}>
            <AssetInstance asset={prop.asset} />
          </group>
        ),
      )}

      {scene.tramLine && scene.tramAsset ? (
        <Tram
          asset={scene.tramAsset}
          from={scene.tramLine.from}
          to={scene.tramLine.to}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/*
        Stray cats. Dressing: no colliders, the player walks through them.
        One GLB is fetched once and cloned per cat, so five cats are one
        download — but each clone carries its own skeleton and mixer, because
        sharing either would make them move as one animal.
      */}
      {scene.catModelUrl
        ? scene.catRoutes.map((route, index) => (
            <StreetCat
              key={`cat-${index}`}
              url={scene.catModelUrl!}
              route={route}
              targetHeight={scene.catHeight}
              phase={index / scene.catRoutes.length}
            />
          ))
        : null}

      {/* Greenery. Generated geometry, roughly 250 triangles a tree. */}
      <StreetTrees trees={scene.trees} reducedMotion={reducedMotion} />

      {/* People at their posts. One of each, never mass-instanced. */}
      {scene.npcs.map((entry, index) => (
        <FeaturedNpcActor
          key={entry.key}
          npc={entry.npc}
          position={entry.position}
          rotationY={entry.rotationY}
          phase={index / Math.max(1, scene.npcs.length)}
        />
      ))}

      {scene.hotspots.map((hotspot) => (
        <HotspotObject
          key={hotspot.id}
          hotspot={hotspot}
          completed={completed.has(hotspot.id)}
          inRange={activeHotspotId === hotspot.id}
          reducedMotion={reducedMotion}
        />
      ))}

      <PlayerRig
        scene={scene}
        frozen={frozen}
        reducedMotion={reducedMotion}
        guideId={guideId}
        profile={quality}
        heroReady={heroReady}
        interacting={interacting}
        performing={performing}
        performanceLocked={performanceLocked}
        framingCelebration={framingCelebration}
        onCelebrationFramed={onCelebrationFramed}
        onClipFinished={onClipFinished}
        performanceToken={performanceToken}
        onHeroStatus={onHeroStatus}
        onHeroMeasured={onHeroMeasured}
        onHeroDrawCount={onHeroDrawCount}
        onHeroMotion={onHeroMotion}
        focus={focus}
        onFocusSettled={onFocusSettled}
        onNearestChange={onNearestChange}
      />
    </>
  );
}
