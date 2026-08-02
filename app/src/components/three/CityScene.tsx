'use client';

import { useMemo } from 'react';
import type { SceneDescription } from '@/engine/scene/buildScene';
import type { QualitySettings } from '@/engine/quality/quality';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import type { HeroClip } from '@/engine/heroes/registry';
import { AssetInstance } from '@/components/three/AssetInstance';
import { WindProp } from '@/components/three/WindProp';
import { WindSlope } from '@/components/three/WindSlope';
import { Mist } from '@/components/three/Mist';
import { Birds } from '@/components/three/Birds';
import { CableCarLine, Train, TrainTrack, Tram } from '@/components/three/Tram';
import { playFerryHorn } from '@/engine/audio/cues';
import { Balloons } from '@/components/three/Balloons';
import { Ground } from '@/components/three/Ground';
import { Water } from '@/components/three/Water';
import { HotspotObject } from '@/components/three/HotspotObject';
import { CatCalls,
  CAT_TURN_RATE,
  CAT_WALK_SPEED,
  HORSE_TURN_RATE,
  HORSE_WALK_SPEED,
  StreetCat,
} from '@/components/three/StreetCat';
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

      <Ground ground={scene.ground} surface={scene.groundSurface} patches={scene.groundPatches} />

      {scene.water ? (
        <Water
          centerX={scene.water.centerX}
          centerZ={scene.water.centerZ}
          width={scene.water.width}
          depth={scene.water.depth}
          color={scene.water.color}
          still={scene.water.still}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/* Scenery beyond the play area: never solid, never reached. */}
      {scene.backdrop.map((prop) =>
        /*
          Tea terraces move. A hillside is the wrong thing to rotate and
          `WindSlope` says so at length — but a green flank that is perfectly
          still against a sky reads as a painted backdrop, and a fifteenth of
          the flag's sway is enough to stop that. Everything else in the
          backdrop is rock, forest edge or water and stays where it is put.
        */
        prop.asset.entry.id === 'city_trabzon_tea_slope' ? (
          <WindSlope
            key={prop.key}
            asset={prop.asset}
            position={prop.position}
            rotationY={prop.rotationY}
            reducedMotion={reducedMotion}
          />
        ) : (
          <group key={prop.key} position={prop.position} rotation={[prop.rotationX, prop.rotationY, 0]}>
            <AssetInstance asset={prop.asset} castShadow={false} />
          </group>
        ),
      )}

      {/* Cloud crossing Sümela. Weather, so it has to move or it is a stain. */}
      <Mist bands={scene.mistBands} reducedMotion={reducedMotion} />

      {/* Birds over the city, one circle each. */}
      <Birds
        modelUrl={scene.birdModelUrl}
        paths={scene.birdPaths}
        reducedMotion={reducedMotion}
      />

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
          <group key={prop.key} position={prop.position} rotation={[prop.rotationX, prop.rotationY, 0]}>
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
          <group key={prop.key} position={prop.position} rotation={[prop.rotationX, prop.rotationY, 0]}>
            <AssetInstance asset={prop.asset} />
          </group>
        ),
      )}

      <Balloons
        asset={scene.balloonAsset}
        specs={scene.balloons}
        reducedMotion={reducedMotion}
      />

      {/*
        Paragliders off Boztepe. The balloon component, with a different model:
        both are something light hanging in the air that drifts, lifts and
        leans, and there was no second behaviour to write.
      */}
      <Balloons
        asset={scene.paragliderAsset}
        specs={scene.paragliders}
        reducedMotion={reducedMotion}
      />

      {scene.tramLine && scene.tramAsset ? (
        <Tram
          asset={scene.tramAsset}
          from={scene.tramLine.from}
          to={scene.tramLine.to}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/*
        The Eastern Express. Crosses Kars from off one side of the map to off
        the other, then waits fifteen seconds and does it again. Not rendered
        at all between runs — a locomotive parked at the edge of the plateau is
        a strange thing to leave in shot.
      */}
      {/*
        Canoes on the lake. The tram's motion, at a fifth of its speed: out,
        pause, back. A canoe turning round at the end of its crossing is what a
        canoe does, so nothing new had to be written for it.
      */}
      {scene.canoeAsset
        ? scene.canoeLines.map((line, index) => (
            <Tram
              key={`canoe-${index}`}
              asset={scene.canoeAsset!}
              from={line.from}
              to={line.to}
              reducedMotion={reducedMotion}
              speed={line.speed}
            />
          ))
        : null}

      {/*
        Hamsi boats on Uzungöl. The tram's motion again — out, pause, back —
        but on a lifted line, because Trabzon's water is a tilted plate and its
        height depends on where along it you are.
      */}
      {scene.boatAsset
        ? scene.boatLines.map((line, index) => (
            <Tram
              key={`boat-${index}`}
              asset={scene.boatAsset!}
              from={line.from}
              to={line.to}
              heights={line.heights}
              reducedMotion={reducedMotion}
              speed={line.speed}
            />
          ))
        : null}

      {/*
        The ferry. The train's motion with a ship's horn and a slower pace —
        it crosses the strait and goes, which is what a Bosphorus ferry does.
      */}
      {/*
        The cable car. The tram's motion at half its pace — a cabin climbing a
        hill goes out, pauses at the top and comes back, which is the same shape
        as a tram working a street.
      */}
      {scene.cableCarLine && scene.cableCarAsset ? (
        <CableCarLine
          asset={scene.cableCarAsset}
          from={scene.cableCarLine.from}
          to={scene.cableCarLine.to}
          /* Leaves the station at roof height and reaches Boztepe's shoulder. */
          heights={[5, 24]}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {scene.ferryLine && scene.ferryAsset ? (
        <Train
          asset={scene.ferryAsset}
          from={scene.ferryLine.from}
          to={scene.ferryLine.to}
          reducedMotion={reducedMotion}
          onEnter={playFerryHorn}
          intervalSeconds={15}
          /* Four metres a second. A ferry crossing a strait is slow, and at
             nine it read as a speedboat. */
          speed={4}
        />
      ) : null}

      {scene.trainLine ? <TrainTrack from={scene.trainLine.from} to={scene.trainLine.to} /> : null}

      {scene.trainLine && scene.trainAsset ? (
        <Train
          asset={scene.trainAsset}
          from={scene.trainLine.from}
          to={scene.trainLine.to}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {/*
        Stray cats. Dressing: no colliders, the player walks through them.
        One GLB is fetched once and cloned per cat, so five cats are one
        download — but each clone carries its own skeleton and mixer, because
        sharing either would make them move as one animal.
      */}
      {/*
        Heard, not seen, and in Van only.

        It went everywhere with a cat at first. The owner's judgement, and it
        is right: İstanbul's cats are part of the furniture and a city that
        mews at you every fifteen seconds is a city insisting on itself. Van's
        cat is the answer to the city's one question, so there it earns the
        sound.
      */}
      <CatCalls
        enabled={scene.animal === 'vancat'}
        reducedMotion={reducedMotion}
      />

      {scene.animals.map((animal, index) => (
        <StreetCat
          key={animal.key}
          url={animal.modelUrl!}
          route={animal.route}
          targetHeight={animal.targetHeight}
          phase={index / Math.max(1, scene.animals.length)}
          speed={scene.animal === 'horse' ? HORSE_WALK_SPEED : CAT_WALK_SPEED}
          turnRate={scene.animal === 'horse' ? HORSE_TURN_RATE : CAT_TURN_RATE}
        />
      ))}

      {/* Greenery. Generated geometry, roughly 250 triangles a tree. */}
      <StreetTrees trees={scene.trees} reducedMotion={reducedMotion} />

      {/* People at their posts. One of each, never mass-instanced. */}
      {scene.npcs.map((entry, index) => (
        <FeaturedNpcActor
          key={entry.key}
          npc={entry.npc}
          walkTo={entry.walkTo}
          reducedMotion={reducedMotion}
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
