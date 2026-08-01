'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { pendingTap } from '@/engine/controls/inputState';
import type { GroundSurface, SceneGround, SceneGroundPatch } from '@/engine/scene/buildScene';

/** Metres covered by one tile of the cobblestone texture. */
const TILE_METRES = 4;

/**
 * Sand tiles larger than paving.
 *
 * A cobble is 44 cm and repeating it every four metres is what a street looks
 * like. Dust has no unit, so the same repeat reads as a pattern; stretching it
 * lets it read as ground.
 */
/**
 * Sand tiles larger than paving, and rock larger still.
 *
 * A cobble is 44 cm and repeating it every four metres is what a street looks
 * like. Dust has no unit, so the same repeat reads as a pattern. A rock slab is
 * roughly two metres across, so its tile has to be wide enough to hold several
 * without any of them becoming a motif.
 */
const SURFACE_TILE = { cobblestone: 4, redsand: 9, steppe: 6, rock: 9, forest: 7 } as const;

/**
 * How far the paving runs past the edge of the play area.
 *
 * The ground used to end exactly where the child could walk, so the facades
 * standing beyond that edge appeared to float over a strip of sky. Ground is
 * scenery; bounds are gameplay, and they are not the same rectangle.
 */
const GROUND_MARGIN = 44;

/**
 * The street surface.
 *
 * This is the largest thing on screen and was a flat colour, which left every
 * prop looking like it hovered over a void however carefully its base was
 * measured onto y = 0.
 *
 * The texture is greyscale and the region's own ground colour tints it, so one
 * 368 KB set serves all 81 provinces and Cappadocia still reads as Cappadocia.
 */
export function Ground({
  ground,
  surface,
  patches = [],
}: {
  ground: SceneGround;
  /** Which region's surface this is: paving on the coast, dust on the plateau. */
  surface: GroundSurface;
  /** Circles of a different ground laid over this one. */
  patches?: readonly SceneGroundPatch[];
}) {
  const loaded = useTexture([
    `/assets/textures/ground_${surface}_albedo.jpg`,
    `/assets/textures/ground_${surface}_normal.jpg`,
    `/assets/textures/ground_${surface}_roughness.jpg`,
  ]) as Texture[];
  const [albedo, normal, roughness] = loaded;

  const maps = useMemo(() => {
    const tile = SURFACE_TILE[surface] ?? TILE_METRES;
    const repeatX = Math.max(1, Math.round((ground.width + GROUND_MARGIN * 2) / tile));
    const repeatY = Math.max(1, Math.round((ground.depth + GROUND_MARGIN * 2) / tile));

    const prepare = (texture: Texture, colour: boolean) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.anisotropy = 8;
      // Only the colour map is sRGB; the others carry data, not colour.
      if (colour) texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };

    if (!albedo || !normal || !roughness) return {};
    return {
      map: prepare(albedo, true),
      normalMap: prepare(normal, false),
      roughnessMap: prepare(roughness, false),
    };
  }, [albedo, normal, roughness, ground.width, ground.depth, surface]);

  const plane = (
    <mesh
      /**
       * Tapping the ground walks there.
       *
       * The stick works — the whole game runs on a tablet — but it takes
       * getting used to, and getting used to a joystick is not what this
       * product is for. Tapping where you want to go is the control every child
       * already knows.
       */
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        pendingTap.point = { x: event.point.x, z: event.point.z };
      }}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[ground.centerX, 0, ground.centerZ]}
      receiveShadow
    >
      <planeGeometry args={[ground.width + GROUND_MARGIN * 2, ground.depth + GROUND_MARGIN * 2]} />
      <meshStandardMaterial
        {...maps}
        color={ground.color}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );

  if (patches.length === 0) return plane;
  return (
    <>
      {plane}
      {patches.map((patch, index) => (
        <GroundPatch key={`ground-patch-${index}`} patch={patch} />
      ))}
    </>
  );
}

/**
 * A circle of a different ground, laid over the city's own.
 *
 * One city needs two grounds. Ani is a rock shelf, which is right for all of it
 * except the corner where the geese stand — geese graze, and do not stand on
 * bare stone. Blending two surfaces across the whole plane would need a splat
 * map and a custom shader for one patch in one province, so this is a small
 * plane lying just above the big one, with a soft-edged alpha in its colour map
 * so it fades into the rock instead of ending on a corner a child can see.
 *
 * Two things keep it from fighting the ground beneath: it sits 1 cm up, and
 * `polygonOffset` biases its depth further still. At close range either would
 * do; at a distance neither does alone.
 */
export function GroundPatch({ patch }: { patch: SceneGroundPatch }) {
  const loaded = useTexture([
    `/assets/textures/ground_${patch.surface}_albedo.png`,
    `/assets/textures/ground_${patch.surface}_normal.jpg`,
    `/assets/textures/ground_${patch.surface}_roughness.jpg`,
  ]) as Texture[];
  const [albedo, normal, roughness] = loaded;

  const maps = useMemo(() => {
    const prepare = (texture: Texture, colour: boolean) => {
      // Clamped rather than repeated: the single soft edge is the whole point.
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.anisotropy = 8;
      if (colour) texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };
    if (!albedo || !normal || !roughness) return {};
    return {
      map: prepare(albedo, true),
      normalMap: prepare(normal, false),
      roughnessMap: prepare(roughness, false),
    };
  }, [albedo, normal, roughness]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[patch.position[0], 0.01, patch.position[2]]}
      receiveShadow
      /* Not tappable: the plane underneath answers, and two overlapping tap
         targets would swallow every second tap. */
      raycast={() => null}
    >
      <planeGeometry args={[patch.radius * 2, patch.radius * 2]} />
      <meshStandardMaterial
        {...maps}
        color={patch.color}
        roughness={1}
        metalness={0}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}
